// Importador de PDFs oficiais da Anvisa para biblioteca privada (não Github).
// O texto é mantido sob 'pending_review' até conferir a monografia com o PDF.
// Aceita somente documentos constantes do catálogo de edições vigentes 2026.
import {ANVISA_CATALOG} from './anvisa-catalog.js';
export const MAX_COMPENDIUM_BYTES=46*1024*1024; // margem para 128 MiB de RAM Workers Free
const MAX_MARKDOWN=20*1024*1024;
const hashBytes=async input=>{
 const hash=await crypto.subtle.digest('SHA-256',input);
 return Array.from(new Uint8Array(hash),b=>b.toString(16).padStart(2,'0')).join('');
};
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
export async function convertAnvisaDocument(id,buf,env,identity,provenance){
 const entry=ANVISA_CATALOG.find(x=>x.id===id);
 if(!entry)return {ok:false,status:400,error:'Compêndio não cadastrado'};
 if(!env.SCIENCE_LIBRARY||typeof env.AI?.toMarkdown!=='function')
  return {ok:false,status:503,error:'Biblioteca SQLite ou conversor PDF não disponível'};
 if(!(buf instanceof ArrayBuffer)||buf.byteLength<800||buf.byteLength>MAX_COMPENDIUM_BYTES)
  return {ok:false,status:413,error:'PDF excede limite seguro de 46 MiB por arquivo no plano Free; dividir este volume em partes'};
 const signature=String.fromCharCode(...new Uint8Array(buf,0,5));
 if(signature!=='%PDF-')return {ok:false,status:422,error:'Arquivo recebido não tem assinatura PDF'};
 let converted;
 try{
  converted=await env.AI.toMarkdown(
   {name:id+'.pdf',blob:new Blob([buf],{type:'application/pdf'})},
   {conversionOptions:{pdf:{metadata:false}}}
  );
 }catch(_){return {ok:false,status:502,error:'A Cloudflare não conseguiu converter este PDF; não foi indexado'};}
 const output=Array.isArray(converted)?converted[0]:converted;
 if(!output||output.format==='error'||typeof output.data!=='string')
  return {ok:false,status:502,error:'Falha da conversão: '+String(output?.error||'arquivo sem texto').slice(0,180)};
 if(output.data.length>MAX_MARKDOWN)
  return {ok:false,status:413,error:'Texto convertido excedeu limite de memória por documento'};
 const parts=splitScientificMarkdown(output.data);
 if(!parts.length||parts.length>6000)
  return {ok:false,status:422,error:'Arquivo sem conteúdo recuperável ou volume maior que o limite de trechos'};
 const pdfHash=await hashBytes(buf);
 const jobId=id+'-'+pdfHash.slice(0,12);
 const library=env.SCIENCE_LIBRARY.getByName('lifemag-main');
 const start=await library.beginCompendiumExtraction({
  id:jobId,sourceId:entry.sourceId,title:entry.title,
  edition:entry.edition,officialUrl:entry.canonicalUrl,
  mirrorUrl:provenance||entry.publisherPage,pdfSha256:pdfHash,
  submittedBy:String(identity?.email||'').toLowerCase()
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
  title:entry.title,pdfSha256:pdfHash,pdfBytes:buf.byteLength,
  convertedCharacters:output.data.length,sections:count,
  reviewStatus:'pending_review',acquisition:provenance?'uploaded_pdf':'public_reference',
  message:'Texto extraído, guardado em biblioteca privada para conferir tabelas, capítulos e unidades antes da aprovação.'};
}
export async function importAnvisaCompendium(key,env,identity,fetcher=fetch){
 const entry=ANVISA_CATALOG.find(x=>x.id===key);
 if(!entry)return {ok:false,status:400,error:'Documento não cadastrado'};
 if(!entry.verifiedMirrorUrl)return {ok:false,status:409,
  error:'Esta seção possui apenas endereço oficial do catálogo; importe o PDF por arquivo'};
 if(Number(entry.knownSizeBytes)>MAX_COMPENDIUM_BYTES)
  return {ok:false,status:413,error:'Este volume tem cerca de '+Math.ceil(entry.knownSizeBytes/1048576)+' MiB e excede o limite seguro de 46 MiB. Divida o PDF em partes ou use infraestrutura de maior capacidade.'};
 let response;
 try{
  response=await fetcher(entry.verifiedMirrorUrl,{
   method:'GET',headers:{accept:'application/pdf'},redirect:'follow',
   signal:AbortSignal.timeout(90000)
  });
 }catch(_){return {ok:false,status:502,error:'A cópia pública não respondeu. Abra o documento oficial e envie o PDF pela opção de arquivo.'}}
 if(!response.ok)return {ok:false,status:502,
  error:'Servidor da publicação indisponível (HTTP '+response.status+'). Utilize importação por arquivo.'};
 const final=new URL(response.url||entry.verifiedMirrorUrl);
 if(!['fitoterapiabrasil.com.br','www.fitoterapiabrasil.com.br'].includes(final.hostname)||
   final.protocol!=='https:'||!final.pathname.endsWith('.pdf'))
  return {ok:false,status:422,error:'A publicação retornou endereço inesperado'};
 const size=Number(response.headers.get('content-length')||0);
 if(size>MAX_COMPENDIUM_BYTES)return {ok:false,status:413,
  error:'Volume maior que o limite de memória desta operação; dividir em PDFs menores'};
 let buffer;
 try{buffer=await response.arrayBuffer()}catch(_){return {ok:false,status:502,error:'Falha ao receber PDF'};}
 return convertAnvisaDocument(key,buffer,env,identity,entry.verifiedMirrorUrl);
}
