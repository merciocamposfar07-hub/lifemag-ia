// Coleta automática em Cloudflare Cron: importa somente PDFs públicos autorizados,
// e armazena trechos PENDENTES de revisão profissional em SQLite privado.
// Um documento por disparo, com proteção contra repetição e backoff em erro.
import {ANVISA_CATALOG} from './anvisa-catalog.js';
import {importAnvisaCompendium,anvisaDocumentByteLimit} from './anvisa-importer.js';

const COOLDOWN_MS=12*60*60*1000;
// Catalogadas para tentativa automática sem seleção de arquivos pelo usuário.
// Plantas medicinais são prioritárias e admitem tentativa específica de até 62 MiB.
export const AUTO_COMPENDIA=[
 'fb8-volume-ii-plantas','fffb3-2026','fn3-2026','fb8-volume-i',
 'fb8-volume-ii-insumos','fb8-volume-ii-dispositivos',
 'fb8-volume-ii-gases','fb8-volume-ii-hemocomponentes',
 'fb8-volume-ii-biologicos','fb8-volume-ii-radiofarmacos'
].map(id=>ANVISA_CATALOG.find(x=>x.id===id))
 .filter(x=>x&&(!x.knownSizeBytes||x.knownSizeBytes<=anvisaDocumentByteLimit(x.id)))
 .map(x=>({id:x.id,sourceId:x.sourceId,title:x.title}));

export async function runAnvisaAutoSync(env,now=new Date(),importer=importAnvisaCompendium,{retryFailed=false}={}){
 if(!env?.SCIENCE_LIBRARY||typeof env.AI?.toMarkdown!=='function')
  return {status:'not_configured',attempted:false};
 if(!AUTO_COMPENDIA.length)return {status:'no_eligible_documents',attempted:false};
 const library=env.SCIENCE_LIBRARY.getByName('lifemag-main');
 let extracted,attempted;
 try{
  [extracted,attempted]=await Promise.all([
   library.listCompendiumExtractions(),library.listCompendiumSync()
  ]);
  if(!Array.isArray(extracted)||!Array.isArray(attempted))throw Error('Falha no catálogo científico');
 }catch(_){return {status:'library_unavailable',attempted:false}}
 const last=new Map(attempted.map(x=>[x.documentId,x]));
 const eligible=AUTO_COMPENDIA.filter(entry=>{
  const exact=extracted.some(x=>x.id.startsWith(entry.id+'-')&&
   (x.status==='pending_review'||x.status==='approved'));
  if(exact)return false;
  const row=last.get(entry.id);
  if(!row)return true;
  if(row.status==='extracted_pending_review')return false;
  // Após a correção da versão 0.5.4, falhas do importador antigo de plantas
  // são retentadas UMA vez automaticamente, sem esperar 12 horas.
  // O novo registro prefixa 'Etapa ...', impedindo loop de retentativas.
  if(entry.id==='fb8-volume-ii-plantas'&&row.status==='import_failed'&&
     !String(row.message||'').startsWith('Etapa '))return true;
  // Só a solicitação explícita pelo farmacêutico pode antecipar retry de Plantas.
  if(retryFailed&&entry.id==='fb8-volume-ii-plantas'&&['import_failed','stalled'].includes(row.status))return true;
  const at=Date.parse(row.checkedAt);
  return Number.isNaN(at)||now.getTime()-at>=COOLDOWN_MS;
 });
 if(!eligible.length){
  const allExtracted=AUTO_COMPENDIA.every(entry=>extracted.some(x=>x.id.startsWith(entry.id+'-')&&
   (x.status==='pending_review'||x.status==='approved')));
  return {status:allExtracted?'all_extracted_pending_review':'retry_cooldown',
   attempted:false,covered:AUTO_COMPENDIA.length-eligible.length};
 }
 const entry=eligible[0];
 try{
  const reserved=await library.recordCompendiumSync({
   documentId:entry.id,status:'in_progress',sections:0,
   message:'Iniciada a tentativa automática de aquisição do documento',
   checkedAt:now.toISOString()
  });
  if(reserved?.ok===false)throw Error('Falha ao registrar tentativa');
 }catch(_){return {status:'sync_record_error',attempted:false,documentId:entry.id}}
 let result;
 try{result=await importer(entry.id,env,{email:'automatic-sync@lifemag.invalid'})}
 catch(_){result={ok:false,status:502,error:'Falha inesperada na importação'};}
 const status=result?.ok?'extracted_pending_review':'import_failed';
 try{
  const saved=await library.recordCompendiumSync({
   documentId:entry.id,status,sections:Number(result?.sections)||0,
   message:result?.ok?'PDF convertido, trechos isolados para revisão profissional':
    ('Etapa '+String(result?.stage||'desconhecida')+': '+String(result?.error||'Servidor de publicação indisponível')).slice(0,220),
   checkedAt:now.toISOString()
  });
  if(saved?.ok===false)throw Error('Falha ao registrar');
 }catch(_){return {status:'sync_record_error',attempted:true,documentId:entry.id}}
 return {status,attempted:true,documentId:entry.id,
  sections:Number(result?.sections)||0,reviewStatus:result?.ok?'pending_review':null};
}
