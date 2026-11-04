// Adaptador opcional da API Consensus (https://docs.consensus.app/api-get-started).
// Não consome chamadas em silêncio: só quando o farmacêutico solicitar explicitamente.
// A chave CONSENSUS_API_KEY pertence APENAS aos Secrets do Worker; nunca ao navegador.
export async function searchConsensus(query,env,fetcher=fetch){
  if(!env?.CONSENSUS_API_KEY)return {status:'not_configured',items:[]};
  const clean=String(query||'').trim().slice(0,300);
  if(clean.length<5)return {status:'empty_query',items:[]};
  const url='https://api.consensus.app/v1/search?'+new URLSearchParams({
    query:clean,page_size:'5'
  });
  try{
    const response=await fetcher(url,{method:'GET',
      headers:{'x-api-key':env.CONSENSUS_API_KEY,accept:'application/json'},
      signal:AbortSignal.timeout(10000)});
    if(response.status===401||response.status===403)return {status:'invalid_credentials',items:[]};
    if(response.status===429)return {status:'quota_exhausted',items:[]};
    if(!response.ok)return {status:'source_error',items:[]};
    const json=await response.json();
    const items=(Array.isArray(json?.results)?json.results:[]).slice(0,5)
      .filter(x=>typeof x.url==='string'&&
        /^https:\/\/(?:consensus\.app|(?:www\.)?doi\.org|pubmed\.ncbi\.nlm\.nih\.gov)\//.test(x.url))
      .map((x,i)=>({
        id:'K'+(i+1),
        title:String(x.title||'Pesquisa científica').slice(0,240),
        abstract:String(x.takeaway||'').slice(0,1400),
        journal:String(x.journal_name||'').slice(0,100),
        date:String(x.publish_year||'').slice(0,10),
        url:x.url,source:'Consensus API'
      }));
    return {status:items.length?'ok':'no_results',items};
  }catch(_){return {status:'source_error',items:[]}}
}
