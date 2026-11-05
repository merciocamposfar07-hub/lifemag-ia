'use strict';
const assert=require('node:assert/strict');
async function main(){
 const {discoverOfficialAnvisaPdf}=await import('../worker/anvisa-discover.js');
 const {ANVISA_CATALOG}=await import('../worker/anvisa-catalog.js');
 const entry=ANVISA_CATALOG.find(x=>x.id==='fb8-volume-ii-insumos');
 let n=0;
 const check=async(name,fn)=>{await fn();n++;console.log('PASSOU:',name)};
 const html=(s)=>new Response('<html><body>'+s+'</body></html>',{
  headers:{'content-type':'text/html'}
 });
 await check('identifica PDF somente do mesmo item oficial na Biblioteca Digital',async()=>{
  const out=await discoverOfficialAnvisaPdf(entry,async url=>{
   assert.equal(url,entry.canonicalUrl);
   return html('<a href="/jspui/bitstream/anvisa/21042/1/Volume%20II.pdf">Abrir</a>');
  });
  assert.equal(out.ok,true);
  assert.equal(out.url,'https://bibliotecadigital.anvisa.gov.br/jspui/bitstream/anvisa/21042/1/Volume%20II.pdf');
 });
 await check('não aceita PDF de outra edição/handle',async()=>{
  const out=await discoverOfficialAnvisaPdf(entry,async()=>
   html('<a href="/jspui/bitstream/anvisa/11974/1/VolumeII.pdf">Abrir</a>'));
  assert.equal(out.ok,false);
  assert.equal(out.status,404);
 });
 await check('não aceita domínio externo nem links arbitrários',async()=>{
  const out=await discoverOfficialAnvisaPdf(entry,async()=>
   html('<a href="https://evil.example/jspui/bitstream/anvisa/21042/1/arquivo.pdf">Abrir</a>'));
  assert.equal(out.ok,false);
 });
 await check('HTTP 403 é respeitado sem contorno',async()=>{
  const out=await discoverOfficialAnvisaPdf(entry,async()=>new Response('Forbidden',{status:403}));
  assert.equal(out.ok,false);assert.equal(out.status,502);
  assert.match(out.error,/HTTP 403/);
 });
 await check('URL de catálogo inválida não é pesquisada',async()=>{
  const out=await discoverOfficialAnvisaPdf({...entry,canonicalUrl:'https://evil.example/arquivo'},async()=>{throw Error('não pode executar')});
  assert.equal(out.status,422);
 });
 console.log('Descoberta Anvisa:',n,'verificações aprovadas');
}
main().catch(error=>{console.error(error);process.exitCode=1});
