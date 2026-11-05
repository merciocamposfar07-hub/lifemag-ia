// Teste do banco SQLite REAL, sem simular consultas SQL.
// Executar em Node 22 com loader do runtime Cloudflare:
// node --no-warnings --experimental-loader ./testes/cloudflare-runtime-loader.mjs testes/testar_sqlite_real.mjs
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {LifeMagScientificStore} from '../worker/science-do.js';

const db=new DatabaseSync(':memory:');
const sql={
 exec(query,...args){
  const stmt=String(query).trim();
  if(stmt.startsWith('CREATE TABLE')){
    db.exec(stmt);
    return {toArray:()=>[],one:()=>undefined};
  }
  const prepared=db.prepare(stmt);
  if(stmt.startsWith('SELECT')){
    return {toArray:()=>prepared.all(...args),one:()=>prepared.get(...args)};
  }
  prepared.run(...args);
  return {toArray:()=>[],one:()=>undefined};
 }
};
const store=new LifeMagScientificStore({storage:{
 sql,transactionSync:fn=>fn()
}},{});
const digest=async value=>{
 const buf=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value));
 return Array.from(new Uint8Array(buf),x=>x.toString(16).padStart(2,'0')).join('');
};
const paragraph='As diretrizes da OMS sobre atividade física para adultos de 18 a 64 anos recomendam entre 150 e 300 minutos semanais de atividade aeróbica moderada ou 75 a 150 minutos de atividade vigorosa, com fortalecimento muscular ao menos duas vezes por semana.';
const heading='Atividade física recomendada para adultos';
const source={
 id:'who-guideline-summary-2020',sourceId:'who',
 title:'WHO guidelines on physical activity and sedentary behaviour',
 edition:'2020',officialUrl:'https://www.who.int/publications/i/item/9789240015128',
 license:'Resumo original de orientação pública — não reproduz o compêndio integral',
 reviewer:'Revisão de teste profissional',verifiedAt:'2026-11-04',
 reviewStatus:'approved',sections:[{heading,body:paragraph,sha256:await digest(paragraph)}],
 sha256:await digest(heading+'\n'+paragraph+'\n')
};
let ok=0;
const check=async(name,fn)=>{await fn();ok++;console.log('PASSOU:',name)};
await check('heartbeat do Cron fica persistido no SQLite sem aprovar monografias',async()=>{
 const start=await store.recordScheduledRun({
  status:'started',at:'2026-11-05T03:17:00.000Z',detail:'Coleta iniciada'
 });
 assert.equal(start.ok,true);
 const done=await store.recordScheduledRun({
  status:'finished',at:'2026-11-05T03:18:00.000Z',detail:'Falha de acesso externo registrada'
 });
 assert.equal(done.ok,true);
 const status=await store.status();
 assert.equal(status.scheduler.status,'finished');
 assert.equal(status.scheduler.lastRunAt,'2026-11-05T03:18:00.000Z');
 assert.equal(status.approvedDocuments,0);
});
await check('SQLite criou biblioteca científica e catálogo de 8 fontes',async()=>{
 const result=await store.status();
 assert.equal(result.approvedDocuments,0);
 assert.equal(result.overviewSections,13);
 assert.equal(result.status,'official_overviews_available');
 assert.ok(result.sources.filter(x=>x.status==='official_overview_available').length>=7);
 assert.ok(result.sources.length>=8);
 assert.equal(result.storage,'SQLite Durable Object');
});
await check('busca FTS5 recupera sínteses oficiais reais, não monografias fictícias',async()=>{
 const result=await store.search('fitoterapicos formulacoes');
 assert.ok(result.items.length>0);
 assert.ok(result.items.some(x=>x.evidenceTier==='official_overview'));
 assert.ok(result.items.every(x=>x.source.includes('Sinopse')||x.evidenceTier==='reviewed_document'));
 assert.equal((await store.status()).approvedDocuments,0);
});
await check('farmacopeia e Formulário Nacional permanecem com contagem de monografias zero',async()=>{
 const statuses=(await store.status()).sources;
 const formularies=statuses.filter(x=>['anvisa-fb','anvisa-fn','anvisa-fitoterapicos'].includes(x.id));
 assert.equal(formularies.length,3);
 assert.ok(formularies.every(x=>x.overviewSections>=2&&x.approvedDocuments===0));
});
await check('extração PDF aguarda revisão e não libera monografia',async()=>{
 const id='fn3-2026-000000000000';
 const started=await store.beginCompendiumExtraction({
   id,sourceId:'anvisa-fn',title:'Formulário Nacional demonstrativo',
   edition:'3ª edição 2026',
   officialUrl:'https://www.gov.br/anvisa/pt-br/assuntos/farmacopeia/formulario-nacional',
   mirrorUrl:'https://example.org/documento.pdf',pdfSha256:'a'.repeat(64),
   submittedBy:'teste@exemplo.org'
 });
 assert.equal(started.ok,true);
 const inserted=await store.addCompendiumSegments(id,[{
  heading:'Trecho importado de PDF e pendente de revisão',
  body:'A manipulação de cápsulas e o controle em processo exigem conferência de tabelas e unidades do documento oficial. O texto ainda não pode respaldar dose clínica de paciente.'
 }]);
 assert.equal(inserted.ok,true);
 const finished=await store.finishCompendiumExtraction(id,1);
 assert.equal(finished.status,'pending_review');
 const current=await store.status();
 assert.equal(current.pendingReviewDocuments,1);
 assert.equal(current.approvedDocuments,0);
});
await check('texto integral ainda não revisado aparece apenas como fonte contextual',async()=>{
 const result=await store.search('capsulas manipulacao');
 assert.ok(result.items.some(x=>x.evidenceTier==='extracted_unreviewed'));
 assert.ok(result.items.some(x=>x.source.includes('revisão profissional pendente')));
 assert.equal(result.reviewedCount,0);
});
await check('documento com hash falso não entra no SQLite',async()=>{
 const result=await store.importReviewed({...source,sha256:'0'.repeat(64)});
 assert.equal(result.ok,false);
 assert.equal((await store.status()).approvedDocuments,0);
});
await check('fonte não oficial é recusada',async()=>{
 const result=await store.importReviewed({...source,officialUrl:'https://not-trusted.example/faq'});
 assert.equal(result.ok,false);
});
await check('documento oficial e trecho verificados entram no SQLite REAL',async()=>{
 const result=await store.importReviewed(source);
 assert.equal(result.ok,true);
 const after=await store.status();
 assert.equal(after.approvedDocuments,1);
 assert.equal(after.approvedPassages,1);
});
await check('FTS5 recupera trecho oficial com metadados da edição',async()=>{
 const result=await store.search('atividade física adultos');
 assert.equal(result.status,'ok_reviewed_document');
 assert.ok(result.items.length>=1);
 const reviewed=result.items.find(x=>x.evidenceTier==='reviewed_document');
 assert.ok(reviewed,'A busca precisa retornar o documento revisado, junto das sinopses');
 assert.match(reviewed.abstract,/150 e 300 minutos/);
 assert.equal(reviewed.url,source.officialUrl);
});
await check('não retorna trecho quando a pergunta é alheia ao documento',async()=>{
 const result=await store.search('riboflavina enxaqueca');
 assert.equal(result.items.length,0);
});
console.log('SQLite REAL: '+ok+'/10 verificações concluídas, sem simulação do banco.');
db.close();
