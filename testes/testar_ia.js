'use strict';
const assert=require('node:assert/strict');
const {createPrivateKey,generateKeyPairSync,sign}=require('node:crypto');
const URL_WORKER='https://lifemag-ia-clinico.example.com';
const ACCOUNT='farmacia-teste.cloudflareaccess.com';
const AUD='aud-teste-lifemag';
const OLD_FETCH=globalThis.fetch;
const {publicKey,privateKey}=generateKeyPairSync('rsa',{modulusLength:2048});
const jwk=publicKey.export({format:'jwk'});jwk.kid='key-1';jwk.alg='RS256';jwk.use='sig';
const b64=v=>Buffer.from(JSON.stringify(v)).toString('base64url');
function jwt(email='farmaceutico@example.org',signatureValid=true){
  const now=Math.floor(Date.now()/1000);
  const header=b64({alg:'RS256',kid:'key-1'});
  const claims=b64({iss:'https://'+ACCOUNT,aud:[AUD],email,sub:'farmaceutico-1',exp:now+600,iat:now});
  const raw=header+'.'+claims;
  const signature=sign('RSA-SHA256',Buffer.from(raw),signatureValid?privateKey:
    generateKeyPairSync('rsa',{modulusLength:2048}).privateKey).toString('base64url');
  return raw+'.'+signature;
}
const mockArticles={resultList:{result:[
  {source:'MED',id:'12345678',title:'Review of riboflavin in migraine prevention',
   abstractText:'This review summarizes published clinical trials of riboflavin for migraine prophylaxis; evidence remains heterogeneous.',
   journalTitle:'Clinical Review',firstPublicationDate:'2026-07-01'},
  {source:'PPR',id:'99999999',title:'Unverified preprint',abstractText:'Not accepted'}
]}};
globalThis.fetch=async url=>{
  const address=String(url);
  if(address.endsWith('/cdn-cgi/access/certs'))return Response.json({keys:[jwk]});
  if(address.startsWith('https://www.ebi.ac.uk/europepmc/webservices/rest/search?'))return Response.json(mockArticles);
  throw Error('Domínio externo inesperado: '+address);
};
async function tests(){
 const {default:worker,searchEvidence,buildEuropePmcQuery}=await import('../worker/index.js');
 const env={ACCESS_TEAM_DOMAIN:ACCOUNT,ACCESS_AUD:AUD,ALLOWED_EMAILS:'farmaceutico@example.org',
  AI:{run:async()=>({response:'Resumo científico: literatura preliminar [1]. Revisão farmacêutica necessária.'})},
  ASSETS:{fetch:async()=>new Response('<!doctype html><html>OK</html>',{status:200})}};
 const request=(path,token,{method='GET',body}={})=>new Request(URL_WORKER+path,{method,
  headers:{'Cf-Access-Jwt-Assertion':token,'content-type':'application/json'},
  ...(body?{body:JSON.stringify(body)}:{})});
 const cases=[
  ['sem configurações: negado',async()=>assert.equal((await worker.fetch(request('/api/capabilities',jwt()),{})).status,401)],
  ['sem JWT: negado',async()=>assert.equal((await worker.fetch(new Request(URL_WORKER+'/api/capabilities'),env)).status,401)],
  ['assinatura JWT inválida: negado',async()=>assert.equal((await worker.fetch(request('/api/capabilities',jwt(undefined,false)),env)).status,401)],
  ['e-mail não autorizado: negado',async()=>assert.equal((await worker.fetch(request('/api/capabilities',jwt('outro@example.org')),env)).status,401)],
  ['JWT válido: capabilities sem prontuário',async()=>{
    const r=await worker.fetch(request('/api/capabilities',jwt()),env);
    assert.equal(r.status,200);
    const x=await r.json();assert.equal(x.ready,true);assert.equal(x.clinicalRecordStorage,false);
  }],
  ['termos clínicos em português são traduzidos para busca PubMed',async()=>{
    const q=buildEuropePmcQuery('Enxaqueca e prevenção com riboflavina e magnésio');
    assert.ok(q.includes('migraine'));assert.ok(q.includes('prevention'));
    assert.ok(q.includes('riboflavin'));assert.ok(q.includes('magnesium'));
  }],
  ['pesquisa retorna artigos MED com URL PubMed',async()=>{
    const out=await searchEvidence('migraine prevention');
    assert.equal(out.items.length,1);
    assert.equal(out.items[0].url,'https://pubmed.ncbi.nlm.nih.gov/12345678/');
  }],
  ['limpeza da consulta sem injeção de operadores',async()=>assert.ok(!buildEuropePmcQuery('headache OR (("').includes('('))],
  ['API rejeita campos de cadastro',async()=>{
    const r=await worker.fetch(request('/api/assist',jwt(),{method:'POST',body:{question:'migraine prophylaxis',patientName:'Pessoa'}}),env);
    assert.equal(r.status,400);
  }],
  ['API rejeita identificador CPF no texto',async()=>{
    const r=await worker.fetch(request('/api/assist',jwt(),{method:'POST',body:{question:'Paciente com CPF 123.456.789-01 e enxaqueca'}}),env);
    assert.equal(r.status,400);
  }],
  ['IA apresenta resposta com fontes verídicas e revisão obrigatória',async()=>{
    const r=await worker.fetch(request('/api/assist',jwt(),{method:'POST',body:{question:'Riboflavin for migraine prophylaxis in adults'}}),env);
    assert.equal(r.status,200);
    const x=await r.json();
    assert.equal(x.requiresProfessionalReview,true);
    assert.equal(x.sources.length,1);
    assert.equal(x.sources[0].url,'https://pubmed.ncbi.nlm.nih.gov/12345678/');
    assert.ok(!('abstract' in x.sources[0]));
  }],
  ['nenhum conteúdo científico: bloquear resposta',async()=>{
    globalThis.fetch=async url=>String(url).endsWith('/cdn-cgi/access/certs')?
      Response.json({keys:[jwk]}):Response.json({resultList:{result:[]}});
    const r=await worker.fetch(request('/api/assist',jwt(),{method:'POST',body:{question:'Questão clínica fictícia sem artigos'}}),env);
    assert.equal(r.status,422);
    globalThis.fetch=async url=>String(url).endsWith('/cdn-cgi/access/certs')?
      Response.json({keys:[jwk]}):Response.json(mockArticles);
  }]
 ];
 let passed=0;
 for(const [label,fn] of cases){
  try{await fn();passed++;console.log('PASSOU:',label)}
  catch(e){console.error('FALHOU:',label,e);process.exitCode=1}
 }
 console.log('Testes do serviço IA:',passed,'/',cases.length);
}
tests().finally(()=>{globalThis.fetch=OLD_FETCH});
