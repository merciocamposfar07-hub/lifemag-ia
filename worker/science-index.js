// Motor de recuperação do índice científico oficial (Cloudflare D1).
// Opcional: sem D1 configurado, o assistente continua consultando PubMed online.
// Somente trechos de documentos APROVADOS aparecem na pesquisa.
export function buildIndexQuery(question){
  const stop=new Set(['quais','qual','que','como','sobre','para','com','sem',
    'uma','uns','das','dos','nas','nos','uso','utilizacao','existe','existem',
    'mediante','base','evidencia','evidencias','dados','estudos','informacoes',
    'paciente','tratamento','formula','formulacao','clinica','clinico','mg','mcg','ui']);
  const terms=String(question||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .toLowerCase().replace(/[^a-z0-9\s]/g,' ').split(/\s+/)
    .filter(x=>x.length>=4&&!stop.has(x)&&!/^\d+$/.test(x)).slice(0,7);
  return [...new Set(terms)].map(x=>'"'+x+'"*').join(' OR ');
}
export async function searchIndexedEvidence(question,db){
  if(!db||typeof db.prepare!=='function')return {items:[],status:'not_configured'};
  const keywords=buildIndexQuery(question);
  if(!keywords)return {items:[],status:'empty_query'};
  try{
    const result=await db.prepare(
      'SELECT p.heading,p.body,d.title,d.edition,d.official_url,d.verified_at,s.name '+ 
      'FROM scientific_passages_fts f '+
      'JOIN scientific_passages p ON p.id=f.passage_id '+
      'JOIN scientific_documents d ON d.id=p.document_id '+
      'JOIN scientific_sources s ON s.id=d.source_id '+
      "WHERE scientific_passages_fts MATCH ? AND d.review_status='approved' "+
      "AND s.status='active' ORDER BY scientific_passages_fts.rank LIMIT 5"
    ).bind(keywords).all();
    const items=(result?.results||[])
      .filter(x=>typeof x.body==='string'&&x.body.trim().length>=40 &&
        /^https:\/\/(?:www\.)?(?:gov\.br|anvisa\.gov\.br|who\.int|ncbi\.nlm\.nih\.gov)\//.test(String(x.official_url||'')))
      .slice(0,5).map((x,i)=>({
        id:'C'+String(i+1),
        title:String(x.title||'Documento oficial').slice(0,200)+
          (x.edition?' — '+String(x.edition).slice(0,60):''),
        abstract:String(x.heading||'').slice(0,90)+': '+String(x.body).slice(0,2000),
        journal:String(x.name||'Fonte oficial').slice(0,100),
        date:String(x.verified_at||'').slice(0,15),
        url:x.official_url,
        source:'Base científica interna revisada'
      }));
    return {items,status:items.length?'ok':'no_approved_documents'};
  }catch(_){
    return {items:[],status:'index_unavailable'};
  }
}
