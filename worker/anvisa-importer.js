// Importação de edições vigentes via PDF alojado em fonte pública conhecida.
// Não envia textos ao repositório GitHub e não recebe URLs arbitrárias.
// O conteúdo extraído fica em quarentena no SQLite, não em fontes clínicas aprovadas.
import {ANVISA_CATALOG} from './anvisa-catalog.js';

const MAX_BYTES=46*1024*1024; // margem para o limite de memória Workers Free (128 MB)
const MAX_MARKDOWN=20*1024*1024;
const sha256=async input=>{
 const hash=await crypto.subtle.digest('SHA-256',input);
 return Array.from(new Uint8Array(hash),b=>b.toString(16).padStart(2,'0')).join('');
};
const splitMarkdown=content=>{
 const clean=String(content||'').replace(/\r\n/g,'\n').trim();
 if(clean.length<120)return [];
 const paragraphs=clean.split(/\n{2,}/).map(x=>x.trim()).filter(Boolean);
 const parts=[],chunkLimit=3500;
 let accumulator='',heading='Trecho introdutório';
 const flush=()=>{
  if(accumulator.trim().length>=30){
    parts.push({heading:(heading||'Trecho do compêndio').slice(0,220),
      body:accumulator.trim()});
  }
  accumulator='';
 };
 for(const paragraph of paragraphs){
  if(paragraph.length<240&&/^#{1,5}\s/.test(paragraph)){
   flush();
   heading=paragraph.replace(/^#{1,5}\s/,'').slice(0,220);
   continue;
  }
  let remaining=paragraph;
  while(remaining.length){
   const room=chunkLimit-accumulator.length;
   if(room<=80){flush();continue}
   if(remaining.length<=room){
    accumulator+=(accumulator?'\n\n':'')+remaining;
    break;
   }
   // Preservar todo o texto, sem cortes silenciosos. Em texto longo,
   // dividir no limite de caracteres, registrando continuação no título.
   const split=Math.max(600,remaining.lastIndexOf(' ',room));
   const safe=Math.min(room,split);
   accumulator+=(accumulator?'\n\n':'')+remaining.slice(0,safe);
   flush();
   remaining=remaining.slice(safe).trimStart();
  }
 }
 flush();
 return parts;
};
export async function importAnvisaCompendium(key,env,identity,fetcher=fetch){
 const entry=ANVISA_CATALOG.find(x=>x.id===key);
 if(!entry)return {ok:false,status:400,error:'Documento não consta do catálogo vigente'};
 if(!env.SCIENCE_LIBRARY||typeof env.AI?.toMarkdown!=='function')
  return {ok:false,status:503,error:'Biblioteca SQLite ou conversor PDF da Cloudflare indisponível'};
 let response;
 try{
  response=await fetcher(entry.verifiedMirrorUrl,{
   method:'GET',headers:{accept:'application/pdf'},redirect:'follow',
   signal:AbortSignal.timeout(90000)
  });
 }catch(_){return {ok:false,status:502,error:'Servidor da publicação não respondeu; faça a importação a partir do PDF oficial'};}
 if(!response.ok)return {ok:false,status:502,error:'Download da edição não autorizado ou indisponível (HTTP '+response.status+')'};
 const final=new URL(response.url||entry.verifiedMirrorUrl);
 if(!['fitoterapiabrasil.com.br','www.fitoterapiabrasil.com.br'].includes(final.hostname)||
    final.protocol!=='https:'||!final.pathname.endsWith('.pdf'))
  return {ok:false,status:502,error:'Origem do arquivo diferente da publicação cadastrada'};
 const sizeHeader=Number(response.headers.get('content-length')||0);
 if(sizeHeader>MAX_BYTES)return {ok:false,status:413,
  error:'Este volume é muito grande para a memória do Worker Free; necessita divisão do PDF por partes'};
 let arrayBuffer;
 try{arrayBuffer=await response.arrayBuffer()}catch(_){return {ok:false,status:502,error:'Falha ao receber documento PDF'};}
 if(arrayBuffer.byteLength<800||arrayBuffer.byteLength>MAX_BYTES)
  return {ok:false,status:413,error:'PDF fora dos limites de importação de uma requisição'};
 const magic=new Uint8Array(arrayBuffer,0,5);
 if(String.fromCharCode(...magic)!=='%PDF-')
  return {ok:false,status:422,error:'O endereço cadastrado não entregou um arquivo PDF válido'};
 let result;
 try{
  result=await env.AI.toMarkdown({
   name:entry.id+'.pdf',blob:new Blob([arrayBuffer],{type:'application/pdf'})
  },{conversionOptions:{pdf:{metadata:false}}});
 }catch(_){return {ok:false,status:502,error:'Conversor PDF da Cloudflare não conseguiu ler o arquivo'};}
 const conversion=Array.isArray(result)?result[0]:result;
 if(!conversion||conversion.format==='error'||!conversion.data)
  return {ok:false,status:502,error:'Conversão sem texto verificável: '+String(conversion?.error||'erro desconhecido').slice(0,160)};
 const md=String(conversion.data);
 if(md.length>MAX_MARKDOWN)return {ok:false,status:413,error:'Texto extraído excedeu limite por documento'};
 const parts=splitMarkdown(md);
 if(!parts.length||parts.length>6000)return {ok:false,status:422,error:'Não foi possível separar trechos completos para a revisão'};
 const pdfHash=await sha256(arrayBuffer);
 const docId=entry.id+'-'+pdfHash.slice(0,12);
 const library=env.SCIENCE_LIBRARY.getByName('lifemag-main');
 const start=await library.beginCompendiumExtraction({
  id:docId,sourceId:entry.sourceId,title:entry.title,
  edition:entry.edition,officialUrl:entry.canonicalUrl,
  mirrorUrl:entry.verifiedMirrorUrl,pdfSha256:pdfHash,
  submittedBy:String(identity.email||'').toLowerCase()
 });
 if(!start.ok)return {ok:false,status:409,error:start.error};
 let sent=0;
 for(let offset=0;offset<parts.length;offset+=20){
  const step=await library.addCompendiumSegments(docId,parts.slice(offset,offset+20));
  if(!step.ok)return {ok:false,status:500,error:'Extração parcialmente gravada em '+sent+' trechos: '+step.error};
  sent=step.sections;
 }
 const finished=await library.finishCompendiumExtraction(docId,parts.length);
 if(!finished.ok)return {ok:false,status:500,error:finished.error};
 return {
  ok:true,status:202,id:docId,sourceId:entry.sourceId,title:entry.title,
  pdfBytes:arrayBuffer.byteLength,pdfSha256:pdfHash,
  sections:parts.length,convertedCharacters:md.length,
  reviewStatus:'pending_review',
  info:'PDF convertido e guardado privadamente para conferência. Não está aprovado como monografia para formulações.'
 };
}
