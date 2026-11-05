// Persistência de atendimentos em Durable Object SQL isolado por profissional.
// O Worker resolve a identidade pelo Cloudflare Access, nunca por email do corpo.
// Não existe endpoint público para consultar dados de pacientes.
// Campos e dados de pacientes não são transmitidos para telemetria/logs.
import {DurableObject} from 'cloudflare:workers';

export const MAX_CLINICAL_STATE_BYTES=2*1024*1024;
const normalizeObject=x=>x&&typeof x==='object'&&!Array.isArray(x);
const safeId=v=>typeof v==='string'&&/^[a-zA-Z0-9_-]{3,100}$/.test(v);
const validState=s=>{
 if(!normalizeObject(s)||s.schema!==1||
   !Array.isArray(s.patients)||!Array.isArray(s.visits)||
   !Array.isArray(s.anonymousDrafts)||!normalizeObject(s.settings))return false;
 if(s.patients.length>2000||s.visits.length>5000||s.anonymousDrafts.length>2000)return false;
 if(s.researchMessages!==undefined){
  if(!Array.isArray(s.researchMessages)||s.researchMessages.length>60)return false;
  for(const m of s.researchMessages){
   if(!normalizeObject(m)||!safeId(m.id)||
      !['user','assistant'].includes(m.role)||typeof m.text!=='string'||
      m.text.length>16000)return false;
  }
 }
 const ids=new Set(), visitIds=new Set();
 for(const p of s.patients){
  if(!normalizeObject(p)||!safeId(p.id)||ids.has(p.id)||
    typeof p.name!=='string'||p.name.trim().length<2||p.name.length>180||
    typeof p.phone!=='string'||p.phone.length>40)return false;
  ids.add(p.id);
 }
 for(const v of s.visits){
  if(!normalizeObject(v)||!safeId(v.id)||!safeId(v.patientId)||
    !ids.has(v.patientId)||visitIds.has(v.id)||
    !Array.isArray(v.ingredients)||v.ingredients.length>60||
    !Array.isArray(v.chat)||v.chat.length>400||
    !Array.isArray(v.revisions)||v.revisions.length>120||
    (v.assessment!==undefined&&!normalizeObject(v.assessment)))return false;
  visitIds.add(v.id);
 }
 for(const d of s.anonymousDrafts){
  if(!normalizeObject(d)||!safeId(d.id))return false;
 }
 return true;
};

export class LifeMagClinicalRecords extends DurableObject{
 constructor(ctx,env){
  super(ctx,env);
  this.sql=ctx.storage.sql;
  this.sql.exec(
   'CREATE TABLE IF NOT EXISTS clinical_state ('+
   'id INTEGER PRIMARY KEY CHECK(id=1),revision INTEGER NOT NULL,'+
   'payload TEXT NOT NULL,updated_at TEXT NOT NULL);'+
   'CREATE TABLE IF NOT EXISTS clinical_audit ('+
   'revision INTEGER PRIMARY KEY,action TEXT NOT NULL,'+
   'at TEXT NOT NULL,patient_count INTEGER NOT NULL,'+
   'visit_count INTEGER NOT NULL);'
  );
 }
 async read(){
  const row=this.sql.exec('SELECT revision,payload,updated_at FROM clinical_state WHERE id=1').toArray()[0];
  if(!row)return {ok:true,revision:0,state:null,updatedAt:null};
  try{
   const state=JSON.parse(row.payload);
   if(!validState(state))return {ok:false,error:'Estrutura clínica armazenada inválida'};
   return {ok:true,revision:Number(row.revision),state,updatedAt:row.updated_at};
  }catch(_){return {ok:false,error:'Registro clínico ilegível'};}
 }
 async save({revision,state,action='update'}={}){
  if(!Number.isSafeInteger(revision)||revision<0||
     !validState(state)||!['update','delete'].includes(action))
   return {ok:false,status:422,error:'Estrutura clínica inválida'};
  const json=JSON.stringify(state);
  if(new TextEncoder().encode(json).byteLength>MAX_CLINICAL_STATE_BYTES)
   return {ok:false,status:413,error:'Limite de armazenamento por arquivo clínico excedido'};
  const row=this.sql.exec('SELECT revision FROM clinical_state WHERE id=1').toArray()[0];
  const existing=Number(row?.revision)||0;
  if(existing!==revision)
   return {ok:false,status:409,error:'Dados alterados em outra sessão. Atualize antes de salvar.',revision:existing};
  const next=existing+1;
  const at=new Date().toISOString();
  // Durable Object serializa os pedidos de atualização deste profissional.
  try{this.ctx.storage.transactionSync(()=>{
   const current=this.sql.exec('SELECT revision FROM clinical_state WHERE id=1').toArray()[0];
   if((Number(current?.revision)||0)!==revision)throw Error('REVISION_CONFLICT');
   this.sql.exec('INSERT INTO clinical_state (id,revision,payload,updated_at) VALUES (1,?,?,?) '+
    'ON CONFLICT(id) DO UPDATE SET revision=excluded.revision,'+
    'payload=excluded.payload,updated_at=excluded.updated_at',next,json,at);
   this.sql.exec('INSERT INTO clinical_audit (revision,action,at,patient_count,visit_count) '+
    'VALUES (?,?,?,?,?)',next,action,at,state.patients.length,state.visits.length);
  });}catch(error){
   if(error?.message==='REVISION_CONFLICT')
    return {ok:false,status:409,error:'Conflito entre sessões: atualização recusada'};
   throw error;
  }
  return {ok:true,revision:next,updatedAt:at};
 }
 async audit(){
  return this.sql.exec('SELECT revision,action,at,patient_count,visit_count '+
    'FROM clinical_audit ORDER BY revision DESC LIMIT 50').toArray();
 }
}
