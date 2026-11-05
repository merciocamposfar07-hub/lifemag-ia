// Teste de persistência clínica real (SQLite em memória, sem dados pessoais reais).
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {LifeMagClinicalRecords} from '../worker/clinical-records.js';

function makeStore(){
 const db=new DatabaseSync(':memory:');
 const sql={
  exec(query,...args){
   const stmt=String(query).trim();
   if(stmt.startsWith('CREATE TABLE')){
    db.exec(stmt);return {toArray:()=>[],one:()=>undefined};
   }
   const p=db.prepare(stmt);
   if(stmt.startsWith('SELECT'))
    return {toArray:()=>p.all(...args),one:()=>p.get(...args)};
   p.run(...args);return {toArray:()=>[],one:()=>undefined};
  }
 };
 const storage={sql,transactionSync:fn=>{db.exec('BEGIN IMMEDIATE');
  try{const result=fn();db.exec('COMMIT');return result}
  catch(e){db.exec('ROLLBACK');throw e}}};
 return new LifeMagClinicalRecords({storage},{});
}
const person={id:'pac_teste1',name:'Paciente fictício A',phone:'81999999999',dob:'1980-01-01'};
const example=()=>({
 schema:1,patients:[person],
 visits:[{
  id:'at_teste1',patientId:person.id,date:'2026-11-05',
  ingredients:[],chat:[],revisions:[],
  assessment:{chiefComplaint:'Consulta fictícia'}
 }],
 anonymousDrafts:[],settings:{professional:'Profissional de teste'}
});
const check=async(name,fn)=>{await fn();console.log('PASSOU: '+name)};
const a=makeStore(),b=makeStore();
await check('prontuário inicia vazio',async()=>{
 const r=await a.read();
 assert.equal(r.ok,true);assert.equal(r.revision,0);assert.equal(r.state,null);
});
await check('salva atendimento e recupera registro completo',async()=>{
 const r=await a.save({revision:0,state:example()});
 assert.equal(r.ok,true);assert.equal(r.revision,1);
 const read=await a.read();
 assert.equal(read.state.visits[0].assessment.chiefComplaint,'Consulta fictícia');
 assert.equal(read.state.patients[0].name,'Paciente fictício A');
});
await check('segundo profissional não acessa dados do primeiro',async()=>{
 assert.equal((await b.read()).state,null);
});
await check('atualização concorrente perde acesso e não sobrescreve dados',async()=>{
 const st=example();st.patients[0].name='Paciente fictício B';
 const r=await a.save({revision:0,state:st});
 assert.equal(r.ok,false);assert.equal(r.status,409);
 assert.equal((await a.read()).state.patients[0].name,'Paciente fictício A');
});
await check('rejeita visita sem paciente válido',async()=>{
 const st=example();st.visits[0].patientId='pac_inexistente';
 const r=await a.save({revision:1,state:st});
 assert.equal(r.ok,false);assert.equal(r.status,422);
});
await check('exclusão em cascata salva o estado vazio com auditoria',async()=>{
 const st=example();st.patients=[];st.visits=[];
 const r=await a.save({revision:1,state:st,action:'delete'});
 assert.equal(r.ok,true);assert.equal(r.revision,2);
 assert.equal((await a.read()).state.patients.length,0);
 const audit=await a.audit();
 assert.equal(audit[0].action,'delete');assert.equal(audit[0].visit_count,0);
});
console.log('Prontuário clínico privado: 6 verificações em SQLite real');
