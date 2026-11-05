// Sincronização automática dos PDFs públicos que cabem no limite do Workers Free.
// É execução de servidor (cron Cloudflare), NÃO é tarefa no telefone ou envio manual.
// Nunca declara um PDF revisado: extrações ficam pendentes de revisão profissional.
import {ANVISA_CATALOG} from './anvisa-catalog.js';
import {importAnvisaCompendium,MAX_COMPENDIUM_BYTES} from './anvisa-importer.js';

export const AUTO_COMPENDIA = ANVISA_CATALOG
 .filter(x=>x.verifiedMirrorUrl&&x.knownSizeBytes&&
   x.knownSizeBytes<=MAX_COMPENDIUM_BYTES)
 .map(x=>({id:x.id,sourceId:x.sourceId,title:x.title}));

// A cada dia, tenta somente UM documento: reduz consumo de RAM e de Workers AI.
// Repete tentativas com erro nos próximos ciclos; o status é persistido no SQLite.
export async function runAnvisaAutoSync(env,now=new Date(),importer=importAnvisaCompendium){
 if(!env?.SCIENCE_LIBRARY||typeof env.AI?.toMarkdown!=='function')
  return {status:'not_configured',attempted:false};
 if(!AUTO_COMPENDIA.length)return {status:'no_eligible_documents',attempted:false};
 const day=Math.floor(now.getTime()/86400000);
 const entry=AUTO_COMPENDIA[((day%AUTO_COMPENDIA.length)+AUTO_COMPENDIA.length)%AUTO_COMPENDIA.length];
 const library=env.SCIENCE_LIBRARY.getByName('lifemag-main');
 let existing=[];
 try{existing=await library.listCompendiumExtractions();}
 catch(_){return {status:'library_unavailable',attempted:false,documentId:entry.id}}
 if(existing.some(x=>x.id.startsWith(entry.id+'-')&&x.status==='pending_review')){
  return {status:'already_extracted_pending_review',documentId:entry.id,attempted:false};
 }
 let result;
 try{result=await importer(entry.id,env,{email:'automatic-sync@lifemag.invalid'})}
 catch(_){result={ok:false,status:502,error:'Falha inesperada no serviço de importação'}}
 const status=result.ok?'extracted_pending_review':'import_failed';
 try{
  await library.recordCompendiumSync({
   documentId:entry.id,status,sections:Number(result.sections)||0,
   message:result.ok?'PDF extraído automaticamente; revisão ainda pendente':
    String(result.error||'Servidor da publicação indisponível').slice(0,220),
   checkedAt:now.toISOString()
  });
 }catch(_){return {status:'sync_record_error',attempted:true,documentId:entry.id}}
 return {status,documentId:entry.id,attempted:true,
  sections:Number(result.sections)||0,reviewStatus:result.ok?'pending_review':null};
}
