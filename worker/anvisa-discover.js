// Descobre endereços de PDF SOMENTE na página oficial do próprio item da Anvisa.
// Acesso 403/429 é respeitado: não contorna autenticação, bloqueios ou robots.
// O link extraído exige o identificador exato (handle) do documento cadastrado.
const HOST='bibliotecadigital.anvisa.gov.br';
const CAP=320000;
export async function discoverOfficialAnvisaPdf(entry,fetcher=fetch){
 let page;
 try{
  page=new URL(String(entry?.canonicalUrl||''));
  if(page.protocol!=='https:'||page.hostname!==HOST)throw Error('domínio externo');
  if(!/^\/jspui\/handle\/anvisa\/\d+$/.test(page.pathname))throw Error('handle ausente');
 }catch(_){return {ok:false,status:422,error:'Referência oficial não reconhecida'};}
 let response;
 try{
  response=await fetcher(page.href,{
   method:'GET',headers:{accept:'text/html'},redirect:'follow',
   signal:AbortSignal.timeout(8500)
  });
 }catch(_){return {ok:false,status:502,error:'Biblioteca Digital indisponível neste acesso'};}
 if(!response.ok)
  return {ok:false,status:502,error:'Biblioteca Digital retornou HTTP '+response.status+
    ' para a página oficial; nenhuma restrição foi contornada'};
 const final=new URL(response.url||page.href);
 if(final.protocol!=='https:'||final.hostname!==HOST)
  return {ok:false,status:422,error:'Redirecionamento externo não permitido'};
 const mime=String(response.headers?.get('content-type')||'').toLowerCase();
 if(mime&&!mime.includes('html'))
  return {ok:false,status:415,error:'Página oficial não retornou HTML'};
 if(Number(response.headers?.get('content-length')||0)>CAP)
  return {ok:false,status:413,error:'Página de descoberta excede limite'};
 let html;
 try{
  if(!response.body)throw Error('sem corpo');
  const reader=response.body.getReader();
  let size=0;const chunks=[];
  try{
   for(;;){
    const part=await reader.read();if(part.done)break;
    size+=part.value.byteLength;
    if(size>CAP)return {ok:false,status:413,error:'Página de descoberta excede limite'};
    chunks.push(part.value);
   }
  }finally{try{await reader.cancel()}catch(_){}}
  const combined=new Uint8Array(size);let offset=0;
  for(const chunk of chunks){combined.set(chunk,offset);offset+=chunk.length}
  html=new TextDecoder().decode(combined);
 }catch(_){return {ok:false,status:502,error:'Falha na leitura da página da Anvisa'};}
 const itemId=page.pathname.split('/').pop();
 const href=/\bhref\s*=\s*["']([^"']+)["']/gi;
 let found;
 while((found=href.exec(html))!==null){
  const raw=found[1].replace(/&amp;/gi,'&');
  let url;
  try{url=new URL(raw,page.href)}catch(_){continue}
  if(url.protocol!=='https:'||url.hostname!==HOST)continue;
  let path;
  try{path=decodeURIComponent(url.pathname)}catch(_){continue}
  const prefix=new RegExp('^/(?:jspui/)?bitstream/anvisa/'+itemId+'/');
  if(prefix.test(path)&&path.toLowerCase().endsWith('.pdf'))
   return {ok:true,url:url.href,provenance:page.href};
 }
 return {ok:false,status:404,error:'Nenhum PDF referente ao item foi localizado na página oficial'};
}
