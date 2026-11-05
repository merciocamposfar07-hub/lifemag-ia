// Consulta EXTERNA, automática e limitada às páginas oficiais dos 3 compêndios.
// Não confundir texto da página institucional com o teor integral do PDF.
// Respostas públicas são somente contexto: jamais justificam dose ou formulação.
export const ANVISA_LIVE_PAGES = [
 {id:'anvisa-fb',title:'Farmacopeia Brasileira, 8ª edição',
  url:'https://www.gov.br/anvisa/pt-br/assuntos/farmacopeia/farmacopeia-brasileira',
  edition:'RDC 1.026/2026'},
 {id:'anvisa-fn',title:'Formulário Nacional, 3ª edição',
  url:'https://www.gov.br/anvisa/pt-br/assuntos/farmacopeia/formulario-nacional',
  edition:'RDC 1.025/2026'},
 {id:'anvisa-fitoterapicos',title:'Formulário de Fitoterápicos, 3ª edição',
  url:'https://www.gov.br/anvisa/pt-br/assuntos/farmacopeia/formulario-fitoterapico',
  edition:'RDC 1.024/2026'}
];
const normalize=t=>String(t||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
 .toLowerCase().replace(/[^a-z0-9\s]/g,' ').replace(/\s+/g,' ').trim();
const STOP=new Set('como para sobre com sem qual quais esse essa esses essas nesta neste paciente pacientes precisa quero queria saber pode podem essa isso mais menos dose doses posologia formula formulacao tratamento tratamento clinico clinica estudo estudos eficiencia seguranca anvisa dados fonte fontes referencias'.split(' '));
function terms(question){
 return [...new Set(normalize(question).split(' ').filter(x=>x.length>=4&&!STOP.has(x)))].slice(0,7);
}
function decode(value){
 return value.replace(/&(?:nbsp|amp|quot|lt|gt|#39|#x27|#(\d+)|#x([0-9a-f]+));/gi,(s,dec,hex)=>{
  if(dec||hex){const n=parseInt(dec||hex,hex?16:10);
   return n>=32&&n<=0x10ffff?String.fromCodePoint(n):' ';}
  return ({'&nbsp;':' ','&amp;':'&','&quot;':'"','&lt;':'<','&gt;':'>','&#39;':"'",'&#x27;':"'"})[s.toLowerCase()]||' ';
 });
}
function publicPageText(html){
 const noScript=String(html||'').replace(/<!--[\s\S]*?-->/g,' ')
  .replace(/<(script|style|noscript|svg|nav|footer|header)\b[^>]*>[\s\S]*?<\/\1\s*>/gi,' ');
 const main=noScript.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1]||
  noScript.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i)?.[1]||noScript;
 return decode(main.replace(/<\/(?:p|div|li|section|h[1-6]|tr|br)\s*>/gi,'\n')
  .replace(/<[^>]*>/g,' ').replace(/[ \t]{2,}/g,' ')
  .replace(/\n\s*\n+/g,'\n').trim()).slice(0,90000);
}
async function limitedHtml(response){
 if(Number(response.headers.get('content-length')||0)>280000)
  throw Error('página maior que o limite');
 if(!response.body)return (await response.text()).slice(0,280000);
 const reader=response.body.getReader();
 const chunks=[];let length=0;
 try{
  for(;;){
   const next=await reader.read();if(next.done)break;
   length+=next.value.byteLength;
   if(length>280000)throw Error('página acima do limite');
   chunks.push(next.value);
  }
 }finally{try{await reader.cancel()}catch(_){}}
 const bytes=new Uint8Array(length);let at=0;
 for(const chunk of chunks){bytes.set(chunk,at);at+=chunk.length}
 return new TextDecoder().decode(bytes);
}
export async function searchAnvisaOnline(question,fetcher=fetch){
 const q=terms(question);
 if(!q.length)return {status:'empty_query',items:[],checked:0,reachable:0};
 const checks=await Promise.all(ANVISA_LIVE_PAGES.map(async page=>{
  try{
   const response=await fetcher(page.url,{method:'GET',redirect:'follow',
    headers:{accept:'text/html'},signal:AbortSignal.timeout(5500)});
   const url=new URL(response.url||page.url);
   if(!response.ok||url.protocol!=='https:'||!['www.gov.br','gov.br'].includes(url.hostname))
    return {ok:false,page};
   const type=String(response.headers.get('content-type')||'').toLowerCase();
   if(type&&!type.includes('html'))return {ok:false,page};
   const text=publicPageText(await limitedHtml(response));
   if(text.length<90)return {ok:false,page};
   const normalized=normalize(text);
   const matched=q.filter(word=>normalized.includes(word));
   // Para consultas não relacionadas ao tema da página, não enviar conteúdo genérico à IA.
   if(!matched.length)return {ok:true,page,match:false};
   const lines=text.split('\n').map(x=>x.trim()).filter(x=>x.length>=35);
   const selected=lines.filter(line=>matched.some(word=>normalize(line).includes(word))).slice(0,3);
   const passage=(selected.length?selected.join(' '):text.slice(0,900)).slice(0,1200);
   return {ok:true,page,match:true,passage};
  }catch(_){return {ok:false,page}}
 }));
 const reachable=checks.filter(x=>x.ok).length;
 const items=checks.filter(x=>x.ok&&x.match).map((x,i)=>({
  id:'W'+(i+1),title:x.page.title+' — página oficial consultada na internet',
  abstract:x.passage,date:'',journal:'Anvisa / gov.br',url:x.page.url,
  source:'Anvisa — contexto institucional consultado online (não é monografia integral)',
  evidenceTier:'official_web_context',edition:x.page.edition
 }));
 return {items,checked:checks.length,reachable,
  status:reachable?'online_pages_checked':'official_pages_unavailable',
  disclosure:'Somente páginas institucionais. O conteúdo integral de monografias em PDF precisa ser importado e revisado separadamente.'};
}
