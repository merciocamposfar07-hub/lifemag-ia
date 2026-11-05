// Biblioteca científica persistente do LifeMag IA, sem informações de pacientes.
// SQLite-backed Durable Object: Cloudflare a cria quando o Worker é implantado.
// Documentos oficiais só se tornam pesquisáveis depois de revisão e aprovação.
import {DurableObject} from 'cloudflare:workers';
import {buildIndexQuery} from './science-index.js';
import {OFFICIAL_OVERVIEWS} from './official-overviews.js';

const SEEDS=[
 ['anvisa-fb','Farmacopeia Brasileira 8ª edição','compendio_oficial',
  'https://www.gov.br/anvisa/pt-br/assuntos/farmacopeia/farmacopeia-brasileira'],
 ['anvisa-fn','Formulário Nacional 3ª edição','compendio_oficial',
  'https://www.gov.br/anvisa/pt-br/assuntos/farmacopeia/formulario-nacional'],
 ['anvisa-fitoterapicos','Formulário de Fitoterápicos 3ª edição','compendio_oficial',
  'https://www.gov.br/anvisa/pt-br/assuntos/farmacopeia/formulario-fitoterapico'],
 ['conitec-pcdt','Conitec / Protocolos Clínicos e Diretrizes Terapêuticas','diretriz',
  'https://www.gov.br/conitec/pt-br'],
 ['who','Organização Mundial da Saúde','diretriz','https://www.who.int/publications'],
 ['atividade-br','Guia de Atividade Física da População Brasileira','diretriz',
  'https://www.gov.br/saude/pt-br'],
 ['alimentar-br','Guia Alimentar para a População Brasileira','diretriz',
  'https://www.gov.br/saude/pt-br'],
 ['pubmed','PubMed via Europe PMC (consulta em tempo real)','literatura',
  'https://europepmc.org/']
];

const allowedOfficialUrl=value=>{
 try{
  const u=new URL(String(value||''));
  return u.protocol==='https:'&&[
   'www.gov.br','gov.br','bibliotecadigital.anvisa.gov.br',
   'www.who.int','who.int','bvsms.saude.gov.br'
  ].includes(u.hostname);
 }catch(_){return false}
};
const str=(value,max=300)=>String(value??'').trim().slice(0,max);
async function sha256Hex(input){
 const bytes=new TextEncoder().encode(String(input));
 const digest=await crypto.subtle.digest('SHA-256',bytes);
 return Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
}
const verifiedSource=(row)=>({
 id:String(row.id),name:String(row.name),
 status:row.status==='active'&&Number(row.approved_documents)>0?
  'content_retrievable':Number(row.overview_sections)>0?'official_overview_available':
  row.status==='live_api'?'external_api_registered':'catalog_only',
 approvedDocuments:Number(row.approved_documents)||0,
 overviewSections:Number(row.overview_sections)||0
});

export class LifeMagScientificStore extends DurableObject{
 constructor(ctx,env){
  super(ctx,env);
  this.sql=ctx.storage.sql;
  this.sql.exec(
   'CREATE TABLE IF NOT EXISTS sources ('+
   'id TEXT PRIMARY KEY,name TEXT NOT NULL,kind TEXT NOT NULL,url TEXT NOT NULL,'+
   "status TEXT NOT NULL DEFAULT 'awaiting_review');"+
   'CREATE TABLE IF NOT EXISTS documents ('+
   'id TEXT PRIMARY KEY,source_id TEXT NOT NULL,title TEXT NOT NULL,edition TEXT NOT NULL,'+
   'official_url TEXT NOT NULL,license TEXT NOT NULL,sha256 TEXT NOT NULL,'+
   'reviewer TEXT NOT NULL,verified_at TEXT NOT NULL,'+
   "status TEXT NOT NULL DEFAULT 'draft');"+
   'CREATE TABLE IF NOT EXISTS passages ('+
   'id TEXT PRIMARY KEY,document_id TEXT NOT NULL,heading TEXT NOT NULL,'+
   'body TEXT NOT NULL,content_sha256 TEXT NOT NULL);'+
   "CREATE VIRTUAL TABLE IF NOT EXISTS passages_fts USING fts5(passage_id UNINDEXED,body,tokenize='unicode61 remove_diacritics 2');"+
   'CREATE TABLE IF NOT EXISTS source_overviews ('+
   'id TEXT PRIMARY KEY,source_id TEXT NOT NULL,title TEXT NOT NULL,'+
   'edition TEXT NOT NULL,official_url TEXT NOT NULL,heading TEXT NOT NULL,'+
   'body TEXT NOT NULL,verified_at TEXT NOT NULL);'+
   "CREATE VIRTUAL TABLE IF NOT EXISTS source_overviews_fts USING fts5(body,tokenize='unicode61 remove_diacritics 2');"+
   'CREATE TABLE IF NOT EXISTS staged_compendia ('+
   'id TEXT PRIMARY KEY,source_id TEXT NOT NULL,title TEXT NOT NULL,edition TEXT NOT NULL,'+
   'official_url TEXT NOT NULL,mirror_url TEXT NOT NULL,pdf_sha256 TEXT NOT NULL,'+
   'submitted_by TEXT NOT NULL,status TEXT NOT NULL,sections INTEGER NOT NULL DEFAULT 0,'+
   'created_at TEXT NOT NULL);'+
   'CREATE TABLE IF NOT EXISTS staged_compendium_passages ('+
   'document_id TEXT NOT NULL,ordinal INTEGER NOT NULL,heading TEXT NOT NULL,body TEXT NOT NULL,'+
   'PRIMARY KEY(document_id,ordinal));'+
   "CREATE VIRTUAL TABLE IF NOT EXISTS staged_passages_fts USING fts5(body,tokenize='unicode61 remove_diacritics 2');"+
   'CREATE TABLE IF NOT EXISTS staged_compendium_parts ('+
   'document_id TEXT PRIMARY KEY,original_sha256 TEXT NOT NULL,'+
   'part_number INTEGER NOT NULL,part_count INTEGER NOT NULL,'+
   'page_start INTEGER NOT NULL,page_end INTEGER NOT NULL,total_pages INTEGER NOT NULL);'+
   'CREATE TABLE IF NOT EXISTS auto_compendium_sync ('+
   'document_id TEXT PRIMARY KEY,status TEXT NOT NULL,checked_at TEXT NOT NULL,'+
   'sections INTEGER NOT NULL DEFAULT 0,message TEXT NOT NULL);'
  );
  for(const [id,name,kind,url] of SEEDS){
   this.sql.exec('INSERT OR IGNORE INTO sources(id,name,kind,url,status) VALUES(?,?,?,?,?)',
    id,name,kind,url,id==='pubmed'?'live_api':'awaiting_review');
  }
  for(const item of OFFICIAL_OVERVIEWS){
   if(this.sql.exec('SELECT id FROM source_overviews WHERE id=?',item.id).toArray().length)continue;
   this.sql.exec('INSERT OR IGNORE INTO source_overviews'+
    '(id,source_id,title,edition,official_url,heading,body,verified_at) VALUES(?,?,?,?,?,?,?,?)',
    item.id,item.sourceId,item.title,item.edition,item.officialUrl,item.heading,item.body,'2026-11-04');
   this.sql.exec('INSERT INTO source_overviews_fts(rowid,body) '+
    'SELECT rowid,body FROM source_overviews WHERE id=?',item.id);
  }
 }

 // Entrada de PDF convertido em Markdown, ainda SEM aprovação clínica.
 // Os trechos ficam em tabela isolada até revisão do documento de origem.
 async beginCompendiumExtraction(meta){
  if(!meta||!/^[a-z0-9-]{4,80}$/.test(String(meta.id||''))||
     !/^[a-f0-9]{64}$/i.test(String(meta.pdfSha256||''))||
     !allowedOfficialUrl(meta.officialUrl)||
     !this.sql.exec('SELECT id FROM sources WHERE id=?',String(meta.sourceId||'')).toArray().length)
   return {ok:false,error:'Origem ou identificação do documento não verificada'};
  const current=this.sql.exec('SELECT status FROM staged_compendia WHERE id=?',meta.id).toArray()[0];
  if(current?.status==='pending_review'||current?.status==='approved')
   return {ok:false,error:'Já existe uma extração aguardando revisão; não sobrescrever'};
  this.ctx.storage.transactionSync(()=>{
   this.sql.exec('DELETE FROM staged_passages_fts WHERE rowid IN ('+
    'SELECT rowid FROM staged_compendium_passages WHERE document_id=?)',meta.id);
   this.sql.exec('DELETE FROM staged_compendium_passages WHERE document_id=?',meta.id);
   this.sql.exec('DELETE FROM staged_compendium_parts WHERE document_id=?',meta.id);
   this.sql.exec('DELETE FROM staged_compendia WHERE id=?',meta.id);
   this.sql.exec(
    'INSERT INTO staged_compendia(id,source_id,title,edition,official_url,mirror_url,pdf_sha256,'+
    "submitted_by,status,sections,created_at) VALUES(?,?,?,?,?,?,?,?,'extracting',0,?)",
    str(meta.id,80),str(meta.sourceId,90),str(meta.title,300),
    str(meta.edition,80),str(meta.officialUrl,600),str(meta.mirrorUrl,600),
    str(meta.pdfSha256,64),str(meta.submittedBy,130),
    new Date().toISOString()
   );
   if(meta.part){
    const p=meta.part;
    this.sql.exec(
     'INSERT INTO staged_compendium_parts(document_id,original_sha256,'+
     'part_number,part_count,page_start,page_end,total_pages) VALUES(?,?,?,?,?,?,?)',
     meta.id,p.originalSha256,p.partNumber,p.partCount,p.pageStart,p.pageEnd,p.totalPages
    );
   }
  });
  return {ok:true,id:meta.id};
 }
 async addCompendiumSegments(id,parts){
  if(!Array.isArray(parts)||!parts.length||parts.length>30)
   return {ok:false,error:'Envie lotes de 1 a 30 trechos'};
  const job=this.sql.exec('SELECT status,sections FROM staged_compendia WHERE id=?',id).toArray()[0];
  if(!job||job.status!=='extracting')return {ok:false,error:'Extração não está aberta'};
  const offset=Number(job.sections)||0;
  if(offset+parts.length>6000)return {ok:false,error:'Volume excede o limite de trechos indexáveis'};
  for(const part of parts){
   if(typeof part.body!=='string'||part.body.trim().length<30||
     part.body.length>4200||typeof part.heading!=='string')
    return {ok:false,error:'Trecho ausente ou com tamanho inválido'};
  }
  this.ctx.storage.transactionSync(()=>{
   parts.forEach((part,i)=>{
    const ordinal=offset+i+1;
    this.sql.exec(
     'INSERT INTO staged_compendium_passages(document_id,ordinal,heading,body) VALUES(?,?,?,?)',
     id,ordinal,str(part.heading,250),part.body.trim());
    this.sql.exec(
     'INSERT INTO staged_passages_fts(rowid,body) SELECT rowid,body '+
     'FROM staged_compendium_passages WHERE document_id=? AND ordinal=?',
     id,ordinal);
   });
   this.sql.exec('UPDATE staged_compendia SET sections=? WHERE id=?',
    offset+parts.length,id);
  });
  return {ok:true,sections:offset+parts.length};
 }
 async finishCompendiumExtraction(id,expected){
  const job=this.sql.exec('SELECT status,sections FROM staged_compendia WHERE id=?',id).toArray()[0];
  if(!job||job.status!=='extracting'||!Number.isInteger(expected)||
    expected<=0||expected!==Number(job.sections))
   return {ok:false,error:'Extração parcial: conferir trechos antes de finalizar'};
  this.sql.exec("UPDATE staged_compendia SET status='pending_review' WHERE id=?",id);
  return {ok:true,status:'pending_review',sections:expected,
   message:'Conteúdo integral convertido e armazenado para revisão; não disponível para prescrição até validação.'};
 }
 async listCompendiumExtractions(){
  const rows=this.sql.exec(
   'SELECT c.id,c.source_id,c.title,c.edition,c.status,c.sections,c.created_at,'+
   'p.original_sha256,p.part_number,p.part_count,p.page_start,p.page_end,p.total_pages '+
   'FROM staged_compendia c LEFT JOIN staged_compendium_parts p ON p.document_id=c.id '+
   'ORDER BY c.created_at DESC LIMIT 100'
  ).toArray();
  return rows.map(x=>({
   id:x.id,sourceId:x.source_id,title:x.title,edition:x.edition,
   status:x.status,sections:Number(x.sections)||0,createdAt:x.created_at,
   part:x.part_number==null?null:{
    originalSha256:x.original_sha256,number:Number(x.part_number),
    total:Number(x.part_count),pageStart:Number(x.page_start),
    pageEnd:Number(x.page_end),totalPages:Number(x.total_pages)}
  }));
 }
 async compendiumCoverage(){
  const rows=this.sql.exec(
   'SELECT c.id,c.source_id,c.status,p.original_sha256,p.part_number,p.part_count,'+
   'p.page_start,p.page_end,p.total_pages FROM staged_compendium_parts p '+
   'JOIN staged_compendia c ON c.id=p.document_id '+
   'ORDER BY c.source_id,p.original_sha256,p.part_number'
  ).toArray();
  const groups=new Map();
  for(const r of rows){
   const key=r.source_id+'-'+r.original_sha256;
   if(!groups.has(key))groups.set(key,{sourceId:r.source_id,
    originalSha256:r.original_sha256,parts:[]});
   groups.get(key).parts.push(r);
  }
  return Array.from(groups.values()).map(group=>{
   const a=group.parts.sort((x,y)=>x.part_number-y.part_number);
   const expected=Number(a[0].part_count),totalPages=Number(a[0].total_pages);
   let covered=0,previous=0;
   const consistent=a.every((r,i)=>{
    const ok=Number(r.part_count)===expected&&Number(r.total_pages)===totalPages&&
     Number(r.part_number)===i+1&&Number(r.page_start)===previous+1&&
     Number(r.page_end)>=Number(r.page_start)&&r.status==='pending_review';
    if(!ok)return false;
    covered+=Number(r.page_end)-Number(r.page_start)+1;
    previous=Number(r.page_end);
    return true;
   });
   return {sourceId:group.sourceId,originalSha256:group.originalSha256,
    importedParts:a.length,expectedParts:expected,coveredPages:covered,totalPages,
    completeExtraction:consistent&&a.length===expected&&previous===totalPages,
    reviewStatus:'pending_review',clinicalApproval:false};
  });
 }
 async listCompendiumSync(){
  return this.sql.exec('SELECT document_id,status,checked_at,sections,message '+
   'FROM auto_compendium_sync ORDER BY checked_at DESC LIMIT 20').toArray()
   .map(x=>({documentId:x.document_id,status:x.status,checkedAt:x.checked_at,
     sections:Number(x.sections)||0,message:x.message}));
 }
 async recordCompendiumSync(entry){
  if(!/^[a-z0-9-]{4,80}$/.test(String(entry?.documentId||''))||
     !['extracted_pending_review','import_failed','in_progress'].includes(entry?.status)||
     !Number.isSafeInteger(Number(entry.sections))||Number(entry.sections)<0||
     Number.isNaN(Date.parse(String(entry.checkedAt||''))))
   return {ok:false,error:'Registro de sincronização inválido'};
  this.sql.exec('INSERT INTO auto_compendium_sync(document_id,status,checked_at,sections,message) '+
   'VALUES(?,?,?,?,?) ON CONFLICT(document_id) DO UPDATE SET '+
   'status=excluded.status,checked_at=excluded.checked_at,'+
   'sections=excluded.sections,message=excluded.message',
   str(entry.documentId,80),entry.status,str(entry.checkedAt,40),
   Number(entry.sections),str(entry.message,220));
  return {ok:true};
 }
 async status(){
  const counts=this.sql.exec(
   "SELECT COUNT(DISTINCT d.id) AS documents,COUNT(p.id) AS passages "+
   "FROM documents d JOIN sources s ON s.id=d.source_id "+
   "JOIN passages p ON p.document_id=d.id "+
   "WHERE d.status='approved' AND s.status='active'"
  ).one();
  const sources=this.sql.exec(
   "SELECT s.id,s.name,s.status,COUNT(DISTINCT CASE WHEN d.status='approved' THEN d.id END) AS approved_documents, "+
   "COUNT(DISTINCT o.id) AS overview_sections "+
   'FROM sources s LEFT JOIN documents d ON d.source_id=s.id '+
   'LEFT JOIN source_overviews o ON o.source_id=s.id '+
   'GROUP BY s.id,s.name,s.status ORDER BY s.name'
  ).toArray().map(verifiedSource);
  const documents=Number(counts?.documents)||0;
  const passages=Number(counts?.passages)||0;
  const overviewSections=Number(this.sql.exec('SELECT COUNT(*) AS n FROM source_overviews').one()?.n)||0;
  const pending=this.sql.exec("SELECT COUNT(*) AS n FROM staged_compendia WHERE status='pending_review'").one()?.n||0;
  const extracting=this.sql.exec("SELECT COUNT(*) AS n FROM staged_compendia WHERE status='extracting'").one()?.n||0;
  const autoSync=this.sql.exec('SELECT document_id,status,checked_at,sections,message '+
   'FROM auto_compendium_sync ORDER BY checked_at DESC LIMIT 10').toArray()
   .map(x=>({documentId:x.document_id,status:x.status,checkedAt:x.checked_at,
     sections:Number(x.sections)||0,message:x.message}));
  return {autoSync,status:documents&&passages?'approved_content_available':
   overviewSections?'official_overviews_available':'configured_empty_or_unverified',
   approvedDocuments:documents,approvedPassages:passages,overviewSections,sources,
   pendingReviewDocuments:Number(pending)||0,incompleteExtracts:Number(extracting)||0,
   storage:'SQLite Durable Object'};
 }
 async search(question){
  const query=buildIndexQuery(question);
  if(!query)return {status:'empty_query',items:[]};
  try{
   const rows=this.sql.exec(
    "SELECT d.title,d.edition,d.official_url,d.verified_at,s.name,p.heading,p.body "+
    'FROM passages_fts JOIN passages p ON p.id=passages_fts.passage_id '+
    'JOIN documents d ON d.id=p.document_id JOIN sources s ON s.id=d.source_id '+
    "WHERE passages_fts MATCH ? AND d.status='approved' AND s.status='active' "+
    'ORDER BY passages_fts.rank LIMIT 5',query
   ).toArray();
   const verified=rows.filter(x=>allowedOfficialUrl(x.official_url)&&
    typeof x.body==='string'&&x.body.length>=40).map((x,i)=>({
    id:'C'+String(i+1),title:str(x.title,180)+' — '+str(x.edition,70),
    abstract:str(x.heading,90)+': '+str(x.body,2000),
    journal:str(x.name,150),date:str(x.verified_at,15),
    url:x.official_url,source:'Documento oficial revisado',
    evidenceTier:'reviewed_document'
   }));
   const overviewRows=this.sql.exec(
    'SELECT o.title,o.edition,o.official_url,o.verified_at,o.heading,o.body,s.name '+
    'FROM source_overviews_fts JOIN source_overviews o ON o.rowid=source_overviews_fts.rowid '+
    'JOIN sources s ON s.id=o.source_id '+
    'WHERE source_overviews_fts MATCH ? ORDER BY bm25(source_overviews_fts) LIMIT 6',query
   ).toArray();
   const overviews=overviewRows.filter(x=>allowedOfficialUrl(x.official_url)&&
     typeof x.body==='string'&&x.body.length>=40).map((x,i)=>({
     id:'O'+String(i+1),title:str(x.title,180)+' — '+str(x.edition,70),
     abstract:str(x.heading,90)+': '+str(x.body,1500),
     journal:str(x.name,150),date:str(x.verified_at,15),
     url:x.official_url,source:'Sinopse institucional, não monografia completa',
     evidenceTier:'official_overview'
   }));
   const pendingRows=this.sql.exec(
    'SELECT j.title,j.edition,j.official_url,j.created_at,p.heading,p.body '+
    'FROM staged_passages_fts JOIN staged_compendium_passages p '+
    'ON p.rowid=staged_passages_fts.rowid '+
    'JOIN staged_compendia j ON j.id=p.document_id '+
    "WHERE staged_passages_fts MATCH ? AND j.status='pending_review' "+
    'ORDER BY bm25(staged_passages_fts) LIMIT 4',query
   ).toArray();
   const pending=pendingRows.filter(x=>allowedOfficialUrl(x.official_url)&&
    typeof x.body==='string'&&x.body.length>=40).map((x,i)=>({
     id:'P'+String(i+1),title:str(x.title,180)+' — '+str(x.edition,70),
     abstract:str(x.heading,90)+': '+str(x.body,1600),
     journal:'Anvisa (PDF extraído, ainda não conferido)',
     date:String(x.created_at||'').slice(0,10),url:x.official_url,
     source:'PDF integral extraído — revisão profissional pendente',
     evidenceTier:'extracted_unreviewed'
   }));
   const items=[...verified,...pending,...overviews].slice(0,10);
   return {status:verified.length?'ok_reviewed_document':
     pending.length?'ok_unreviewed_pdf':overviews.length?'ok_official_overview':'no_approved_documents',
     items,reviewedCount:verified.length,unreviewedCount:pending.length,
     overviewCount:overviews.length};
  }catch(_){return {status:'library_search_error',items:[]}}
 }
 // Ainda NÃO exposto como rota pública: documentos têm de ser conferidos pelo
 // farmacêutico e enviados por importador autenticado com auditoria.
 async importReviewed(manifest){
  if(!manifest||manifest.reviewStatus!=='approved'||
    !allowedOfficialUrl(manifest.officialUrl)||
    !/^[a-z0-9-]{4,80}$/.test(str(manifest.id,100))||
    !Array.isArray(manifest.sections)||!manifest.sections.length||
    !str(manifest.reviewer,120)||str(manifest.license,200).length<7||
    !str(manifest.title,300)||!str(manifest.edition,100)||
    !/^\d{4}-\d{2}-\d{2}$/.test(str(manifest.verifiedAt,15))||
    !/^[a-f0-9]{64}$/i.test(str(manifest.sha256,64)))
   return {ok:false,error:'Origem, licença, hash ou revisão documental inválidos'};
  const source=this.sql.exec('SELECT id FROM sources WHERE id=?',str(manifest.sourceId,100)).toArray();
  if(!source.length)return {ok:false,error:'Fonte não cadastrada'};
  if(manifest.sections.length>500)return {ok:false,error:'Máximo de 500 trechos por documento'};
  let contentForHash='';
  for(const part of manifest.sections){
   if(!str(part.heading,250)||str(part.body,4501).length<40||
     String(part.body||'').length>4500||
     !/^[a-f0-9]{64}$/i.test(str(part.sha256,64)))
    return {ok:false,error:'Trecho sem verificação ou tamanho fora do permitido'};
   const actualHash=await sha256Hex(String(part.body).trim());
   if(actualHash!==part.sha256.toLowerCase())
    return {ok:false,error:'Hash SHA-256 incompatível com o trecho'};
   contentForHash+=String(part.heading).trim()+'\n'+String(part.body).trim()+'\n';
  }
  if((await sha256Hex(contentForHash))!==manifest.sha256.toLowerCase())
   return {ok:false,error:'Hash SHA-256 do documento não corresponde ao conteúdo'};
  this.ctx.storage.transactionSync(()=>{
  this.sql.exec('DELETE FROM passages_fts WHERE passage_id IN ('+
   "SELECT id FROM passages WHERE document_id=?)",str(manifest.id,80));
  this.sql.exec('DELETE FROM passages WHERE document_id=?',str(manifest.id,80));
  this.sql.exec('DELETE FROM documents WHERE id=?',str(manifest.id,80));
  this.sql.exec(
   'INSERT INTO documents(id,source_id,title,edition,official_url,license,sha256,reviewer,verified_at,status) '+
   "VALUES(?,?,?,?,?,?,?,?,?,'approved')",
   str(manifest.id,80),str(manifest.sourceId,100),str(manifest.title,300),
   str(manifest.edition,100),str(manifest.officialUrl,600),str(manifest.license,200),
   str(manifest.sha256,64),str(manifest.reviewer,120),str(manifest.verifiedAt,15)
  );
  for(let i=0;i<manifest.sections.length;i++){
   const part=manifest.sections[i],id=str(manifest.id,80)+'-'+(i+1);
   this.sql.exec(
    'INSERT INTO passages(id,document_id,heading,body,content_sha256) VALUES(?,?,?,?,?)',
    id,str(manifest.id,80),str(part.heading,250),str(part.body,4500),str(part.sha256,64)
   );
   this.sql.exec('INSERT INTO passages_fts(passage_id,body) VALUES(?,?)',id,str(part.body,4500));
  }
  this.sql.exec("UPDATE sources SET status='active' WHERE id=?",str(manifest.sourceId,100));
  });
  return {ok:true,sections:manifest.sections.length};
 }
}
