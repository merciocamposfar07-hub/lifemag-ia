'use strict';
const assert=require('node:assert/strict');
async function main(){
 const {AUTO_COMPENDIA,runAnvisaAutoSync}=await import('../worker/anvisa-auto-sync.js');
 let runs=0;
 async function check(name,fn){await fn();runs++;console.log('PASSOU:',name)}
 const now=new Date('2026-11-05T06:17:00Z');
 let existing=[],recorded=[],attempts=[];
 const library={
  listCompendiumExtractions:async()=>existing,
  recordCompendiumSync:async x=>{recorded.push(x);return {ok:true}}
 };
 const env={AI:{toMarkdown:async()=>({format:'markdown',data:'teste'})},
  SCIENCE_LIBRARY:{getByName:()=>library}};
 await check('lista de sincronização inclui os três compêndios em PDFs públicos elegíveis',async()=>{
  assert.ok(AUTO_COMPENDIA.some(x=>x.id==='fb8-volume-i'));
  assert.ok(AUTO_COMPENDIA.some(x=>x.id==='fn3-2026'));
  assert.ok(AUTO_COMPENDIA.some(x=>x.id==='fffb3-2026'));
  assert.ok(!AUTO_COMPENDIA.some(x=>x.id==='fb8-volume-ii-plantas'));
 });
 await check('sem Cloudflare AI ou SQLite: não tenta baixar',async()=>{
  assert.equal((await runAnvisaAutoSync({},now)).attempted,false);
 });
 await check('executa um documento por rodada, registra pendência sem liberar dose',async()=>{
  const result=await runAnvisaAutoSync(env,now,async(id,_env,identity)=>{
   attempts.push(id);
   assert.ok(identity.email.includes('automatic-sync'));
   return {ok:true,sections:24,reviewStatus:'pending_review'};
  });
  assert.equal(result.status,'extracted_pending_review');
  assert.equal(result.attempted,true);
  assert.equal(result.reviewStatus,'pending_review');
  assert.equal(attempts.length,1);
  assert.equal(recorded[0].status,'extracted_pending_review');
  assert.equal(recorded[0].sections,24);
 });
 await check('não faz download duplicado quando já extraído para revisão',async()=>{
  existing=[{id:attempts[0]+'-abc123abc123',status:'pending_review'}];
  const result=await runAnvisaAutoSync(env,now,async()=>{throw Error('não deve rodar')});
  assert.equal(result.attempted,false);
  assert.equal(result.status,'already_extracted_pending_review');
 });
 await check('falha HTTP é registrada e não aparece como documento aprovado',async()=>{
  existing=[];recorded=[];
  const result=await runAnvisaAutoSync(env,now,async()=>({ok:false,status:502,error:'HTTP 403 no espelho público'}));
  assert.equal(result.status,'import_failed');
  assert.equal(result.reviewStatus,null);
  assert.equal(recorded[0].status,'import_failed');
  assert.match(recorded[0].message,/HTTP 403/);
 });
 console.log('Sincronização automática Anvisa:',runs,'verificações aprovadas');
}
main().catch(e=>{console.error(e);process.exitCode=1});
