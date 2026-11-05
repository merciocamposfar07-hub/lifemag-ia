'use strict';
const assert=require('node:assert/strict');
async function main(){
 const {AUTO_COMPENDIA,runAnvisaAutoSync}=await import('../worker/anvisa-auto-sync.js');
 let passed=0;
 const check=async(name,fn)=>{await fn();passed++;console.log('PASSOU:',name)};
 const now=new Date('2026-11-05T06:17:00Z');
 let extracted=[],records=[],downloaded=[];
 const library={
  listCompendiumExtractions:async()=>extracted,
  listCompendiumSync:async()=>records,
  recordCompendiumSync:async input=>{
   records=records.filter(x=>x.documentId!==input.documentId).concat(input);
   return {ok:true};
  }
 };
 const env={AI:{toMarkdown:async()=>({format:'markdown',data:'teste'})},
  SCIENCE_LIBRARY:{getByName:()=>library}};
 const success=async id=>{
  downloaded.push(id);
  extracted.push({id:id+'-123456abcdef',status:'pending_review'});
  return {ok:true,sections:15};
 };
 await check('fila inclui os 10 arquivos e prioriza as plantas medicinais',async()=>{
  assert.deepEqual(AUTO_COMPENDIA.slice(0,4).map(x=>x.id),
   ['fb8-volume-ii-plantas','fffb3-2026','fn3-2026','fb8-volume-i']);
  assert.equal(AUTO_COMPENDIA.length,10);
 });
 await check('sem Cloudflare AI e SQLite não tenta nenhuma importação',async()=>{
  assert.equal((await runAnvisaAutoSync({},now)).attempted,false);
 });
 await check('segue para próximo documento sem intervenção manual',async()=>{
  for(const entry of AUTO_COMPENDIA){
   const result=await runAnvisaAutoSync(env,now,success);
   assert.equal(result.attempted,true);
   assert.equal(result.documentId,entry.id);
   assert.equal(result.reviewStatus,'pending_review');
  }
  assert.equal(downloaded.length,10);
  assert.equal(records.length,10);
  assert.ok(records.every(r=>r.status==='extracted_pending_review'));
 });
 await check('depois da extração não repete e não aprova doses automaticamente',async()=>{
  const x=await runAnvisaAutoSync(env,now,async()=>{throw Error('duplicado')});
  assert.equal(x.attempted,false);
  assert.equal(x.status,'all_extracted_pending_review');
 });
 await check('falhas HTTP são registradas e não geram falsa extração',async()=>{
  extracted=[];records=[];downloaded=[];
  const failure=async()=>({ok:false,status:502,error:'HTTP 403 Biblioteca Digital'});
  for(const entry of AUTO_COMPENDIA){
   const x=await runAnvisaAutoSync(env,now,failure);
   assert.equal(x.status,'import_failed');
   assert.equal(x.documentId,entry.id);
   assert.equal(x.reviewStatus,null);
  }
  assert.equal(extracted.length,0);
  assert.equal(records.length,10);
  assert.ok(records.every(x=>x.status==='import_failed'&&x.message.includes('HTTP 403')));
  const withheld=await runAnvisaAutoSync(env,now,async()=>{throw Error('sem cooldown')});
  assert.equal(withheld.attempted,false);
  assert.equal(withheld.status,'retry_cooldown');
 });
 await check('corrige automaticamente uma falha antiga de Plantas após atualizar código',async()=>{
  const i=records.findIndex(x=>x.documentId==='fb8-volume-ii-plantas');
  records[i]={...records[i],status:'import_failed',
   message:'A Cloudflare não conseguiu converter este PDF; não foi indexado'};
  const result=await runAnvisaAutoSync(env,now,
   async()=>({ok:false,status:502,stage:'conversion',error:'Conversão PDF falhou'}));
  assert.equal(result.documentId,'fb8-volume-ii-plantas');
  assert.equal(result.attempted,true);
  assert.match(records.find(x=>x.documentId==='fb8-volume-ii-plantas').message,/^Etapa conversion:/);
  const withheld=await runAnvisaAutoSync(env,now,async()=>{throw Error('Não repetir')});
  assert.equal(withheld.attempted,false);
 });
 await check('pedido explícito recupera também tentativa de Plantas interrompida',async()=>{
  const i=records.findIndex(x=>x.documentId==='fb8-volume-ii-plantas');
  records[i]={...records[i],status:'stalled'};
  const result=await runAnvisaAutoSync(env,now,
   async()=>({ok:false,stage:'acquisition',error:'Fonte externa indisponível'}),
   {retryFailed:true});
  assert.equal(result.documentId,'fb8-volume-ii-plantas');
  assert.equal(result.attempted,true);
 });
 await check('pedido explícito permite repetir Plantas antes das 12 horas',async()=>{
  const result=await runAnvisaAutoSync(env,now,
   async()=>({ok:false,status:502,stage:'conversion',error:'Conversor não concluiu'}),
   {retryFailed:true});
  assert.equal(result.attempted,true);
  assert.equal(result.documentId,'fb8-volume-ii-plantas');
  assert.equal(result.status,'import_failed');
  const record=records.find(x=>x.documentId==='fb8-volume-ii-plantas');
  assert.match(record.message,/Etapa conversion/);
 });
 await check('erros podem voltar à fila após intervalo de segurança',async()=>{
  const later=new Date(now.getTime()+12*60*60*1000);
  const result=await runAnvisaAutoSync(env,later,async()=>({ok:false,error:'ainda sem acesso'}));
  assert.equal(result.documentId,'fb8-volume-ii-plantas');
  assert.equal(result.attempted,true);
 });
 console.log('Sincronização Anvisa:',passed,'verificações aprovadas');
}
main().catch(error=>{console.error(error);process.exitCode=1});
