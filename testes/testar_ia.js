'use strict';
const assert=require('node:assert/strict');
const URL_WORKER='https://lifemag-ia-clinico.example.com';
const originalFetch=globalThis.fetch;
const mockArticles={resultList:{result:[
  {source:'MED',id:'12345678',title:'Review of riboflavin in migraine prevention',
   abstractText:'This review summarizes published clinical trials of riboflavin for migraine prophylaxis; evidence remains heterogeneous.',
   journalTitle:'Clinical Review',firstPublicationDate:'2026-07-01'},
  {source:'PPR',id:'99999999',title:'Unverified preprint',abstractText:'Not accepted'}
]}};
let noArticles=false;
globalThis.fetch=async url=>{
  if(String(url).startsWith('https://www.ebi.ac.uk/europepmc/webservices/rest/search?'))
    return Response.json(noArticles?{resultList:{result:[]}}:mockArticles);
  throw Error('Domínio externo inesperado');
};
async function tests(){
 const {default:worker,searchEvidence,buildEuropePmcQuery}=await import('../worker/index.js');
 const env={
  AI:{run:async()=>({response:'Revisão bibliográfica preliminar [1]. Validação profissional necessária.'})}
 };
 const access={
  access:{aud:'aud-exclusivo-lifemag',getIdentity:async()=>({email:'farmaceutico@example.org'})}
 };
 const ctxBadEmail={access:{aud:'aud-exclusivo-lifemag',getIdentity:async()=>({email:'inválido'})}};
 const request=(path,{method='GET',body,headers={}}={})=>new Request(URL_WORKER+path,{method,
  headers:{'content-type':'application/json',...headers},
  ...(body?{body:JSON.stringify(body)}:{})});
 const cases=[
  ['sem Access: nenhum arquivo ou API permitido',async()=>{
    assert.equal((await worker.fetch(request('/'),env,{})).status,401);
    assert.equal((await worker.fetch(request('/api/capabilities'),env,{})).status,401);
  }],
  ['cabeçalho falsificado não concede acesso',async()=>{
    const r=await worker.fetch(request('/api/capabilities',{headers:{
      'Cf-Access-Jwt-Assertion':'token-falso',
      'Cf-Access-Authenticated-User-Email':'farmaceutico@example.org'
    }}),env,{});
    assert.equal(r.status,401);
  }],
  ['contexto sem audience ou e-mail: negado',async()=>{
    assert.equal((await worker.fetch(request('/api/capabilities'),env,{access:{getIdentity:async()=>({email:'farmaceutico@example.org'})}})).status,401);
    assert.equal((await worker.fetch(request('/api/capabilities'),env,ctxBadEmail)).status,401);
  }],
  ['falha na recuperação da identidade: negado',async()=>{
    const ctx={access:{aud:'aud-exclusivo-lifemag',getIdentity:async()=>{throw Error('erro')}}};
    assert.equal((await worker.fetch(request('/api/capabilities'),env,ctx)).status,401);
  }],
  ['com Access válido: API disponível sem configuração manual',async()=>{
    const r=await worker.fetch(request('/api/capabilities'),env,access);
    assert.equal(r.status,200);const x=await r.json();
    assert.equal(x.authenticated,true);assert.equal(x.ready,true);
    assert.equal(x.clinicalRecordStorage,false);
  }],
  ['filtro opcional de e-mails bloqueia demais usuários',async()=>{
    const r=await worker.fetch(request('/api/capabilities'),{...env,ALLOWED_EMAILS:'outro@example.org'},access);
    assert.equal(r.status,401);
  }],
  ['HTML é protegido e servido pelo mesmo Worker',async()=>{
    const r=await worker.fetch(request('/'),env,access);
    assert.equal(r.status,200);
    assert.ok((await r.text()).includes('LifeMag IA'));
    assert.ok(r.headers.get('content-security-policy').includes('frame-ancestors'));
  }],
  ['arquivos JS privados disponíveis apenas autenticados',async()=>{
    const r=await worker.fetch(request('/src/app.js'),env,access);
    assert.equal(r.status,200);
    assert.ok((await r.text()).includes('function conversation()'));
    assert.equal((await worker.fetch(request('/src/app.js'),env,{})).status,401);
  }],
  ['rota desconhecida não dá acesso a arquivos do repositório',async()=>{
    assert.equal((await worker.fetch(request('/database/schema-inicial.sql'),env,access)).status,404);
  }],
  ['termos clínicos em português geram pesquisa bibliográfica',async()=>{
    const q=buildEuropePmcQuery('Enxaqueca e prevenção com riboflavina e magnésio');
    assert.ok(q.includes('migraine'));assert.ok(q.includes('prevention'));
    assert.ok(q.includes('riboflavin'));assert.ok(q.includes('magnesium'));
  }],
  ['busca retorna PMID de artigo indexado',async()=>{
    const out=await searchEvidence('migraine prevention');
    assert.equal(out.items.length,1);
    assert.equal(out.items[0].url,'https://pubmed.ncbi.nlm.nih.gov/12345678/');
  }],
  ['limpeza da consulta desarma operadores',async()=>
    assert.ok(!buildEuropePmcQuery('headache OR (("').includes('('))],
  ['API rejeita campos identificadores de paciente',async()=>{
    const r=await worker.fetch(request('/api/assist',{method:'POST',
      body:{question:'migraine prophylaxis',patientName:'Pessoa'}}),env,access);
    assert.equal(r.status,400);
  }],
  ['API rejeita CPF evidente no texto',async()=>{
    const r=await worker.fetch(request('/api/assist',{method:'POST',
      body:{question:'Paciente com CPF 123.456.789-01 e enxaqueca'}}),env,access);
    assert.equal(r.status,400);
  }],
  ['IA apresenta análise com referências e revisão obrigatória',async()=>{
    const r=await worker.fetch(request('/api/assist',{method:'POST',
      body:{question:'Riboflavin for migraine prophylaxis in adults'}}),env,access);
    assert.equal(r.status,200);const x=await r.json();
    assert.equal(x.requiresProfessionalReview,true);
    assert.equal(x.sources.length,1);
    assert.equal(x.sources[0].url,'https://pubmed.ncbi.nlm.nih.gov/12345678/');
    assert.ok(!('abstract' in x.sources[0]));
  }],
  ['ausência de estudos impede resposta não fundamentada',async()=>{
    noArticles=true;
    const r=await worker.fetch(request('/api/assist',{method:'POST',
      body:{question:'Questão clínica fictícia sem artigos'}}),env,access);
    assert.equal(r.status,422);
    noArticles=false;
  }]
 ];
 let passed=0;
 for(const [label,fn] of cases){
   try{await fn();passed++;console.log('PASSOU:',label)}
   catch(e){console.error('FALHOU:',label,e);process.exitCode=1}
 }
 console.log('Testes IA Cloudflare:',passed,'/',cases.length);
}
tests().finally(()=>{globalThis.fetch=originalFetch});
