'use strict';
const assert=require('node:assert/strict');
async function main(){
 const {ANVISA_CATALOG}=await import('../worker/anvisa-catalog.js');
 const {convertAnvisaDocument,importAnvisaCompendium,splitScientificMarkdown,validateAnvisaPart}
   =await import('../worker/anvisa-importer.js');
 const source=ANVISA_CATALOG.find(x=>x.id==='fffb3-2026');
 let record=null,staged=0,conversions=0,approved=0;
 const library={
  beginCompendiumExtraction:async meta=>{
   record=meta;
   return {ok:true,id:meta.id};
  },
  addCompendiumSegments:async(id,parts)=>{
   staged+=parts.length;
   return {ok:true,sections:staged};
  },
  finishCompendiumExtraction:async(id,expected)=>{
   assert.equal(expected,staged);
   return {ok:true,status:'pending_review'};
  },
  importReviewed:async()=>{approved++;throw Error('Não pode aprovar PDF automaticamente')}
 };
 const env={
  SCIENCE_LIBRARY:{getByName:()=>library},
  AI:{toMarkdown:async()=>{
   conversions++;
   return {format:'markdown',data:'# Formulações da Anvisa\n\n'+
    'Texto científico de teste para comprovar segmentação sem liberar doses, prescrições ou monografias. '.repeat(9)}
  }}
 };
 const identity={email:'profissional@example.org'};
 const buffer=new TextEncoder().encode('%PDF-'+'x'.repeat(950)).buffer;
 let count=0,failed=0;
 const check=async(name,fn)=>{
  try{await fn();count++;console.log('PASSOU:',name)}
  catch(e){failed++;process.exitCode=1;console.error('FALHOU:',name,e)}
 };
 await check('catálogo contém oito volumes da FB8 e dois formulários atuais',async()=>{
  assert.equal(ANVISA_CATALOG.length,10);
  assert.equal(ANVISA_CATALOG.filter(x=>x.sourceId==='anvisa-fb').length,8);
  assert.equal(ANVISA_CATALOG.filter(x=>x.sourceId==='anvisa-fn').length,1);
  assert.equal(ANVISA_CATALOG.filter(x=>x.sourceId==='anvisa-fitoterapicos').length,1);
 });
 await check('PDF em formato de arquivo entra em quarentena sem aprovação automática',async()=>{
  const result=await convertAnvisaDocument(source.id,buffer,env,identity,'pdf_enviado');
  assert.equal(result.ok,true);
  assert.equal(result.reviewStatus,'pending_review');
  assert.ok(result.sections>=1);
  assert.equal(approved,0);
  assert.equal(record.sourceId,'anvisa-fitoterapicos');
  assert.ok(record.officialUrl.startsWith('https://bibliotecadigital.anvisa.gov.br/'));
 });
 await check('arquivo com bytes inválidos não passa pelo conversor',async()=>{
  const invalid=new TextEncoder().encode('FAKE!'+'x'.repeat(950)).buffer;
  const previous=conversions;
  const result=await convertAnvisaDocument(source.id,invalid,env,identity,'pdf_enviado');
  assert.equal(result.status,422);
  assert.equal(conversions,previous);
 });
 await check('arquivo pequeno ou identificador inexistente é recusado',async()=>{
  assert.equal((await convertAnvisaDocument(source.id,new ArrayBuffer(10),env,identity)).status,413);
  assert.equal((await convertAnvisaDocument('inventado',buffer,env,identity)).status,400);
 });
 await check('volume sem espelho tenta PDF oficial e respeita HTTP 403',async()=>{
  let requests=0;
  const result=await importAnvisaCompendium('fb8-volume-ii-insumos',env,identity,
   async()=>{requests++;return new Response('Forbidden',{status:403})});
  assert.equal(result.ok,false);assert.equal(result.status,502);
  assert.match(result.error,/HTTP 403/);
  assert.equal(requests,2);
 });
 await check('URL oficial direta converte mesmo se a página canônica estiver inacessível',async()=>{
  const urls=[];const entry=ANVISA_CATALOG.find(x=>x.id==='fb8-volume-ii-insumos');
  const result=await importAnvisaCompendium(entry.id,env,identity,async url=>{
   urls.push(String(url));
   return new Response(buffer,{status:200,headers:{'content-type':'application/pdf'}});
  });
  assert.equal(result.ok,true);
  assert.equal(urls.length,1);
  assert.equal(urls[0],entry.officialPdfUrl);
  assert.equal(result.reviewStatus,'pending_review');
  assert.equal(approved,0);
 });
 await check('servidor não aceita PDF redirecionado para outro volume oficial',async()=>{
  const entry=ANVISA_CATALOG.find(x=>x.id==='fb8-volume-ii-dispositivos');
  const forbidden='https://bibliotecadigital.anvisa.gov.br/jspui/bitstream/anvisa/21042/3/outro.pdf';
  const result=await importAnvisaCompendium(entry.id,env,identity,async url=>{
   if(String(url)===entry.canonicalUrl)return new Response('Acesso negado',{status:403});
   return {ok:true,url:forbidden,headers:new Headers({'content-type':'application/pdf'}),
    body:new ReadableStream({start(c){c.enqueue(new Uint8Array(buffer));c.close()}})};
  });
  assert.equal(result.ok,false);
  assert.match(result.error,/Redirecionamento|HTTP 403/);
 });
 await check('manifesto de páginas rejeita intervalos inválidos',async()=>{
  const part={catalogId:source.id,originalSha256:'b'.repeat(64),
   pdfSha256:'c'.repeat(64),partNumber:2,partCount:2,
   pageStart:101,pageEnd:99,totalPages:200};
  assert.equal(validateAnvisaPart(part,source.id).ok,false);
  part.pageEnd=200;
  assert.equal(validateAnvisaPart(part,source.id).ok,true);
  assert.equal(validateAnvisaPart({...part,partNumber:3},source.id).ok,false);
 });
 await check('parte de PDF com hash divergente é barrada antes de converter',async()=>{
  const previous=conversions;
  const part={catalogId:source.id,originalSha256:'b'.repeat(64),
   pdfSha256:'0'.repeat(64),partNumber:1,partCount:2,
   pageStart:1,pageEnd:100,totalPages:200};
  const result=await convertAnvisaDocument(source.id,buffer,env,identity,'manual',part);
  assert.equal(result.status,422);
  assert.equal(conversions,previous);
 });
 await check('servidor de publicação indisponível falha explicitamente',async()=>{
  const result=await importAnvisaCompendium(source.id,env,identity,
   async()=>({ok:false,status:403}));
  assert.equal(result.status,502);
 });
 await check('divisor mantém os parágrafos com limite seguro por trecho',async()=>{
  const parts=splitScientificMarkdown('# Preparação\n\n'+
    'A manipulação requer verificação profissional. '.repeat(160));
  assert.ok(parts.length>=2);
  assert.ok(parts.every(x=>x.body.length<=4200));
 });
 console.log('Importação Anvisa:',count,'verificações; falhas:',failed);
}
main().catch(error=>{console.error(error);process.exitCode=1});
