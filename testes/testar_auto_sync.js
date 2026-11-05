'use strict';
const assert=require('node:assert/strict');
async function main(){
 const {AUTO_COMPENDIA,runAnvisaAutoSync}=await import('../worker/anvisa-auto-sync.js');
 let passed=0;
 const check=async(name,fn)=>{await fn();passed++;console.log('PASSOU:',name)};
 const now=new Date('2026-11-05T06:17:00Z');
 let existing=[],recorded=[],attempts=[];
 const library={
  listCompendiumExtractions:async()=>existing,
  listCompendiumSync:async()=>recorded,
  recordCompendiumSync:async data=>{
   recorded=recorded.filter(x=>x.documentId!==data.documentId).concat(data);
   return {ok:true};
  }
 };
 const env={AI:{toMarkdown:async()=>({format:'markdown',data:'teste'})},
  SCIENCE_LIBRARY:{getByName:()=>library}};
 await check('os formulários têm prioridade; farmacopeia Volume I fica na fila',async()=>{
  assert.deepEqual(AUTO_COMPENDIA.map(x=>x.id),['fn3-2026','fffb3-2026','fb8-volume-i']);
  assert.ok(!AUTO_COMPENDIA.some(x=>x.id==='fb8-volume-ii-plantas'));
 });
 await check('sem infraestrutura não tenta download',async()=>{
  assert.equal((await runAnvisaAutoSync({},now)).attempted,false);
 });
 const simulate=async(id,_env,identity)=>{
  attempts.push(id);
  assert.match(identity.email,/automatic-sync/);
  existing.push({id:id+'-012345abcdef',status:'pending_review'});
  return {ok:true,sections:30};
 };
 await check('primeiro ciclo extrai FN sem aprovação de dose',async()=>{
  const r=await runAnvisaAutoSync(env,now,simulate);
  assert.equal(r.documentId,'fn3-2026');
  assert.equal(r.reviewStatus,'pending_review');
  assert.equal(recorded[0].status,'extracted_pending_review');
 });
 await check('segundo ciclo passa automaticamente aos Fitoterápicos',async()=>{
  const r=await runAnvisaAutoSync(env,now,simulate);
  assert.equal(r.documentId,'fffb3-2026');
 });
 await check('terceiro ciclo prepara Farmacopeia Volume I',async()=>{
  const r=await runAnvisaAutoSync(env,now,simulate);
  assert.equal(r.documentId,'fb8-volume-i');
 });
 await check('não repete download quando todos estão pendentes de revisão',async()=>{
  const r=await runAnvisaAutoSync(env,now,async()=>{throw Error('não deve chamar')});
  assert.equal(r.attempted,false);
  assert.equal(r.status,'all_extracted_pending_review');
  assert.deepEqual(attempts,['fn3-2026','fffb3-2026','fb8-volume-i']);
 });
 await check('falha remota entra em intervalo de segurança antes de nova tentativa',async()=>{
  existing=[];recorded=[];attempts=[];
  const r=await runAnvisaAutoSync(env,now,async id=>({ok:false,status:502,error:'HTTP 403'}));
  assert.equal(r.status,'import_failed');
  assert.equal(recorded[0].status,'import_failed');
  // Prossegue para o segundo PDF, sem insistir imediatamente no arquivo que falhou.
  const next=await runAnvisaAutoSync(env,now,async id=>({ok:false,status:502,error:'HTTP 403'}));
  assert.equal(next.documentId,'fffb3-2026');
  const third=await runAnvisaAutoSync(env,now,async id=>({ok:false,status:502,error:'HTTP 403'}));
  assert.equal(third.documentId,'fb8-volume-i');
  const blocked=await runAnvisaAutoSync(env,now,async()=>{throw Error('repetição indevida')});
  assert.equal(blocked.status,'retry_cooldown');
  assert.equal(blocked.attempted,false);
  const later=await runAnvisaAutoSync(env,new Date(now.getTime()+12*60*60*1000),
   async()=>({ok:false,error:'ainda indisponível'}));
  assert.equal(later.documentId,'fn3-2026');
 });
 console.log('Sincronização automática Anvisa:',passed,'verificações aprovadas');
}
main().catch(e=>{console.error(e);process.exitCode=1});
