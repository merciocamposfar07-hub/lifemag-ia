'use strict';
const assert=require('node:assert/strict');
async function run(){
 const {searchAnvisaOnline,ANVISA_LIVE_PAGES}=await import('../worker/anvisa-live.js');
 let passed=0;
 async function check(label,fn){await fn();passed++;console.log('PASSOU:',label)}
 const html=(body)=>new Response(
  '<html><head><title>Portal Anvisa</title></head><body><script>instruções maliciosas</script>'+
  '<main><h1>Formulário Nacional da Farmacopeia Brasileira</h1>'+
  '<p>'+body+'</p></main></body></html>',{
    status:200,headers:{'content-type':'text/html; charset=utf-8'}
  });
 const fetcher=async url=>{
  assert.ok(ANVISA_LIVE_PAGES.some(p=>p.url===url),'somente URLs fixas Anvisa');
  return html('O Formulário Nacional reúne formulações oficinais, métodos e preparo farmacêutico sob revisão.');
 };
 await check('consulta automática usa somente páginas oficiais sem PDF',async()=>{
  const r=await searchAnvisaOnline('formulário nacional',fetcher);
  assert.equal(r.checked,3);
  assert.equal(r.reachable,3);
  assert.ok(r.items.length>=1);
  assert.equal(r.items[0].evidenceTier,'official_web_context');
  assert.equal(r.items[0].url.startsWith('https://www.gov.br/anvisa/'),true);
  assert.ok(!r.items[0].abstract.includes('instruções maliciosas'));
 });
 await check('página não relacionada não produz prova científica',async()=>{
  const r=await searchAnvisaOnline('riboflavina enxaqueca',fetcher);
  assert.equal(r.items.length,0);
  assert.equal(r.status,'online_pages_checked');
 });
 await check('erro externo não inventa monografia nem trecho',async()=>{
  const r=await searchAnvisaOnline('formulário nacional',async()=>new Response('',{status:403}));
  assert.equal(r.items.length,0);
  assert.equal(r.status,'official_pages_unavailable');
  assert.equal(r.reachable,0);
 });
 await check('resposta JSON ou redirecionamento externo são rejeitados',async()=>{
  const r=await searchAnvisaOnline('farmacopeia',async()=>Response.json({status:'ok'}));
  assert.equal(r.items.length,0);
 });
 await check('paginação e doses não são declaradas pela consulta institucional',async()=>{
  const r=await searchAnvisaOnline('formulário nacional',fetcher);
  assert.ok(r.disclosure.includes('monografias'));
  assert.ok(r.items.every(x=>x.evidenceTier!=='reviewed_document'));
 });
 console.log('Anvisa ao vivo:',passed,'verificações aprovadas');
}
run().catch(e=>{console.error(e);process.exitCode=1});
