// Importador de PDFs oficiais da Anvisa para biblioteca privada (não Github).
// O texto é mantido sob 'pending_review' até conferir a monografia com o PDF.
// Aceita somente documentos constantes do catálogo de edições vigentes 2026.
import {ANVISA_CATALOG} from './anvisa-catalog.js';
import {discoverOfficialAnvisaPdf} from './anvisa-discover.js';
import {sha256BlobHex} from './sha256-stream.js';
export const MAX_COMPENDIUM_BYTES=46*1024*1024; // limite conservador habitual
// Tentativa específica para plantas: o arquivo conhecido possui ~55 MB.
// Falhas de conversão precisam aparecer no diagnóstico; nunca aprovar automaticamente.
export const MAX_PLANTS_BYTES=62*1024*1024;
export const anvisaDocumentByteLimit=id=>
 id==='fb8-volume-ii-plantas'?MAX_PLANTS_BYTES:MAX_COMPENDIUM_BYTES;
const MAX_MARKDOWN=20*1024*1024;
export function splitScientificMarkdown(source){
 const clean=String(source||'').replace(/\r\n/g,'\n').trim();
 if(clean.length<120)return [];
 const paragraphs=clean.split(/\n{2,}/).map(x=>x.trim()).filter(Boolean);
 const parts=[];let text='',heading='Trecho introdutório';
 const flush=()=>{
  if(text.trim().length>=30)parts.push({heading:heading.slice(0,220),body:text.trim()});
  text='';
 };
 for(const paragraph of paragraphs){
  if(paragraph.length<200&&/^#{1,5}\s/.test(paragraph)){
   flush();heading=paragraph.replace(/^#{1,5}\s/,'').slice(0,220);continue;
  }
  let remaining=paragraph;
  while(remaining){
   const room=3500-text.length;
   if(room<130){flush();continue}
   if(remaining.length<=room){
    text+=(text?'\n\n':'')+remaining;break;
   }
   const lastSpace=remaining.lastIndexOf(' ',room);
   const cut=lastSpace>=600?lastSpace:room;
   text+=(text?'\n\n':'')+remaining.slice(0,cut);
   flush();
   remaining=remaining.slice(cut).trimStart();
  }
 }
 flush();
 return parts;
}
export function validateAnvisaPart(raw,id){
 if(raw==null)return {ok:true,part:null};
 const n=key=>Number(raw[key]);
 const digits=key=>Number.isSafeInteger(n(key))&&n(key)>=1;
 if(raw.catalogId!==id||
    !/^[a-f0-9]{64}$/i.test(String(raw.originalSha256||''))||
    !/^[a-f0-9]{64}$/i.test(String(raw.pdfSha256||''))||
    !['partNumber','partCount','pageStart','pageEnd','totalPages'].every(digits)||
    n('partCount')>500||n('partNumber')>n('partCount')||
    n('pageStart')>n('pageEnd')||n('pageEnd')>n('totalPages'))
  return {ok:false,error:'Manifesto de partes inválido; não é possível verificar a cobertura do PDF'};
 return {ok:true,part:{
  originalSha256:String(raw.originalSha256).toLowerCase(),
  pdfSha256:String(raw.pdfSha256).toLowerCase(),
  partNumber:n('partNumber'),partCount:n('partCount'),
  pageStart:n('pageStart'),pageEnd:n('pageEnd'),totalPages:n('totalPages')
 }};
}
export async function convertAnvisaDocument(id,buf,env,identity,provenance,partMetadata=null){
 const entry=ANVISA_CATALOG.find(x=>x.id===id);
 if(!entry)return {ok:false,status:400,error:'Compêndio não cadastrado'};
 if(!env.SCIENCE_LIBRARY||typeof env.AI?.toMarkdown!=='function')
  return {ok:false,status:503,error:'Biblioteca SQLite ou conversor PDF não disponível'};
 const pdfBytes=buf instanceof Blob?buf.size:buf instanceof ArrayBuffer?buf.byteLength:-1;
 if(pdfBytes<800||pdfBytes>anvisaDocumentByteLimit(id))
  return {ok:false,status:413,error:'PDF excede limite configurado para este volume; requer processamento segmentado'};
 const signature=buf instanceof Blob?await buf.slice(0,5).text():
  String.fromCharCode(...new Uint8Array(buf,0,5));
 if(signature!=='%PDF-')return {ok:false,status:422,error:'Arquivo recebido não tem assinatura PDF'};
 const checked=validateAnvisaPart(partMetadata,id);
 if(!checked.ok)return {ok:false,status:422,error:checked.error};
 const part=checked.part;
 // Reutiliza o Blob para a conversão, sem concatenar outra cópia de 55 MB.
 let pdfHash;
 try{pdfHash=await sha256BlobHex(buf)}
 catch(_){return {ok:false,status:502,stage:'integrity',errorCode:'sha256_failed',error:'Não foi possível verificar SHA-256 do PDF'}};
 if(part&&part.pdfSha256!==pdfHash)
  return {ok:false,status:422,error:'SHA-256 divergente: esta parte não corresponde ao manifesto'};

 let converted;
 try{
  converted=await env.AI.toMarkdown(
   {name:id+'.pdf',blob:buf instanceof Blob?buf:new Blob([buf],{type:'application/pdf'})},
   {conversionOptions:{pdf:{metadata:false}}}
  );
  }catch(err){return {ok:false,status:502,stage:'conversion',
  errorCode:'cloudflare_pdf_conversion_failed',
  error:'Conversão PDF falhou: '+String(err?.message||err?.name||'sem detalhes')
   .replace(/[\r\n\t]/g,' ').slice(0,135)};}
 const output=Array.isArray(converted)?converted[0]:converted;
 if(!output||output.format==='error'||typeof output.data!=='string')
  return {ok:false,status:502,stage:'conversion',errorCode:'cloudflare_pdf_invalid_output',error:'Falha da conversão: '+String(output?.error||'arquivo sem texto').slice(0,180)};
 if(output.data.length>MAX_MARKDOWN)
  return {ok:false,status:413,error:'Texto convertido excedeu limite de memória por documento'};
 const parts=splitScientificMarkdown(output.data);
 if(!parts.length||parts.length>6000)
  return {ok:false,status:422,error:'Arquivo sem conteúdo recuperável ou volume maior que o limite de trechos'};
 const jobId=id+'-'+pdfHash.slice(0,12);
 const library=env.SCIENCE_LIBRARY.getByName('lifemag-main');
 const start=await library.beginCompendiumExtraction({
  id:jobId,sourceId:entry.sourceId,title:entry.title,
  edition:entry.edition,officialUrl:entry.canonicalUrl,
  mirrorUrl:provenance||entry.publisherPage,pdfSha256:pdfHash,
  submittedBy:String(identity?.email||'').toLowerCase(),part
 });
 if(!start.ok)return {ok:false,status:409,error:start.error};
 let count=0;
 for(let index=0;index<parts.length;index+=20){
  const next=await library.addCompendiumSegments(jobId,parts.slice(index,index+20));
  if(!next.ok)return {ok:false,status:500,
   error:'Importação parcial ('+count+' trechos). A etapa não foi liberada: '+next.error};
  count=next.sections;
 }
 const finished=await library.finishCompendiumExtraction(jobId,count);
 if(!finished.ok)return {ok:false,status:500,error:finished.error};
 return {ok:true,status:202,id:jobId,sourceId:entry.sourceId,
  title:entry.title,pdfSha256:pdfHash,pdfBytes,
  convertedCharacters:output.data.length,sections:count,
  reviewStatus:'pending_review',part:part?{number:part.partNumber,total:part.partCount,pages:[part.pageStart,part.pageEnd]}:null,
  acquisition:provenance?'uploaded_pdf':'public_reference',
  message:'Texto extraído, guardado em biblioteca privada para conferir tabelas, capítulos e unidades antes da aprovação.'};
}
export async function importAnvisaCompendium(key,env,identity,fetcher=fetch){
 const entry=ANVISA_CATALOG.find(x=>x.id===key);
 if(!entry)return {ok:false,status:400,error:'Documento não cadastrado'};
 const limit=anvisaDocumentByteLimit(key);
 if(Number(entry.knownSizeBytes)>limit)return {ok:false,status:413,
  error:'PDF acima do limite deste volume; processamento segmentado necessário'};
 // URLs são constantes do catálogo. Não consulta buscadores genéricos ou edições revogadas.
 const attempts=[entry.verifiedMirrorUrl,entry.officialPdfUrl].filter(Boolean);
 let lastError='';const visited=new Set();
 let pdf=null,origin=null;
 const officialId=/\/handle\/anvisa\/(\d+)$/.exec(String(entry.canonicalUrl))?.[1];
 function permitted(target){
  try{
   const u=new URL(target);
   if(u.protocol!=='https:'||!u.pathname.toLowerCase().endsWith('.pdf'))return false;
   const name=u.hostname;
   if(name==='bibliotecadigital.anvisa.gov.br')
    return !!officialId&&[
     '/jspui/bitstream/anvisa/'+officialId+'/',
     '/bitstream/anvisa/'+officialId+'/'
    ].some(x=>u.pathname.startsWith(x));
   return ['fitoterapiabrasil.com.br','www.fitoterapiabrasil.com.br'].includes(name)&&
     entry.verifiedMirrorUrl===target;
  }catch(_){return false}
 }
 async function retrieve(url){
  if(visited.has(url)||!permitted(url))return null;
  visited.add(url);
  let response;
  try{
   response=await fetcher(url,{method:'GET',headers:{accept:'application/pdf'},
    redirect:'follow',signal:AbortSignal.timeout(85000)});
  }catch(_){lastError='Servidor PDF não respondeu';return null}
  if(!response?.ok){
   lastError='Servidor PDF retornou HTTP '+String(response?.status||'indisponível');
   return null;
  }
  const finalUrl=response.url||url;
  if(!permitted(finalUrl)){lastError='Redirecionamento não permitido';return null}
  const contentType=String(response.headers?.get('content-type')||'').toLowerCase();
  if(contentType&&!contentType.includes('pdf')&&!contentType.includes('octet-stream')){
   lastError='Servidor retornou conteúdo diferente de PDF';return null;
  }
  if(Number(response.headers?.get('content-length')||0)>limit){
   lastError='PDF excede 46 MiB';return null;
  }
  // Evita três buffers completos de ~55 MB em um isolate de 128 MB.
  // Response.blob() com limite de bytes não concatena manualmente os chunks.
  let blob;
  try{
   if(!response.body)throw Error('Sem corpo');
   let bytes=0;
   const capped=response.body.pipeThrough(new TransformStream({
    transform(chunk,controller){
     bytes+=chunk.byteLength;
     if(bytes>limit)throw Error('PDF_TOO_LARGE');
     controller.enqueue(chunk);
    }
   }));
   blob=await new Response(capped,{headers:{'content-type':'application/pdf'}}).blob();
  }catch(err){
   lastError=String(err?.message||'')==='PDF_TOO_LARGE'?
    'PDF ultrapassou o limite configurado durante download':
    'Falha no streaming do PDF remoto';
   return null;
  }
  if(blob.size<800||await blob.slice(0,5).text()!=='%PDF-'){
   lastError='Arquivo não possui assinatura PDF';return null;
  }
  return {url:finalUrl,blob};
 }
 for(const url of attempts){
  pdf=await retrieve(url);
  if(pdf)break;
 }
 if(!pdf&&officialId){
  // Página canônica só é usada como último recurso, sem contornar erros HTTP.
  const discovered=await discoverOfficialAnvisaPdf(entry,fetcher);
  if(discovered.ok)pdf=await retrieve(discovered.url);
  else lastError+=(lastError?' / ':'')+discovered.error;
 }
 if(!pdf)return {ok:false,status:502,stage:'acquisition',errorCode:'pdf_source_unavailable',
  error:'Nenhum PDF da edição 2026 acessível: '+String(lastError||'origem indisponível').slice(0,200)};
 return convertAnvisaDocument(key,pdf.blob,env,identity,pdf.url);
}
