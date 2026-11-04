'use strict';
const assert=require('node:assert/strict');
let worker;
const origin='https://lifemag-ia-clinico.example.com';
const verified={access:{aud:'aud-do-lifemag',getIdentity:async()=>({email:'farmaceutico@example.org'})}};
const oldFetch=globalThis.fetch;
const abstract='In adults with episodic migraine, randomized clinical studies evaluated riboflavin 400 mg daily for prophylaxis and tolerability compared with placebo.';
globalThis.fetch=async url=>{
 if(String(url).startsWith('https://www.ebi.ac.uk/europepmc/webservices/rest/search?'))
  return Response.json({resultList:{result:[{
   source:'MED',id:'12345678',title:'Randomized study of riboflavin in migraine prophylaxis',
   abstractText:abstract,pubYear:'2025',journalTitle:'Clinical Journal'}]}});
 throw Error('Consulta inesperada no teste');
};
let aiCalls=0;
const formula={decision:'draft',objective:'Profilaxia da enxaqueca',
 formula_name:'Riboflavina',quantity:'30 cápsulas',pharmaceutical_form:'cápsulas',
 route:'oral',ingredients:[{name:'Riboflavina',chemical_form:'Riboflavina',dose_value:'400',
 dose_unit:'mg',role:'MOTOR',rationale:'Estudo clínico',references:['1']}],
 posology:'1 vez ao dia',meal_relation:'a confirmar',daily_schedule:'manhã',
 initial_duration_days:30,reassessment_days:15,extension_criteria:'reavaliação',
 monitoring:[],interactions:[],contraindications:[],missing_information:[],
 red_flags:[],limitations:['Evidência resumida']};
const fakeDatabase={prepare:sql=>({first:async()=>({
 documents:sql.includes('COUNT(DISTINCT')?2:0,passages:4
})})};
const env={AI:{run:async()=>{aiCalls++;return {response:formula}}},
 SCIENCE_DB:fakeDatabase};
const createRequest=(route,method='GET')=>new Request(origin+route,{method});
async function tests(){
 ({default:worker}=await import('../worker/index.js'));
 const cases=[
  ['sem Access, endpoint de diagnóstico não é público',async()=>{
   assert.equal((await worker.fetch(createRequest('/api/source-status'),env,{})).status,401);
  }],
  ['diagnóstico não executa nem cobra IA automaticamente',async()=>{
   aiCalls=0;
   const response=await worker.fetch(createRequest('/api/source-status'),env,verified);
   assert.equal(response.status,200);const payload=await response.json();
   assert.equal(payload.pubmed.status,'ok');
   assert.equal(payload.pubmed.articles,1);
   assert.equal(payload.officialIndex.approvedDocuments,2);
   assert.equal(payload.officialIndex.approvedPassages,4);
   assert.equal(payload.consensus.status,'not_configured');
   assert.equal(aiCalls,0);
  }],
  ['autoteste usa dados fictícios e chama IA quando solicitado',async()=>{
   aiCalls=0;
   const response=await worker.fetch(createRequest('/api/selftest','POST'),env,verified);
   const payload=await response.json();
   assert.equal(response.status,200);
   assert.equal(payload.passed,true);
   assert.equal(payload.sourceCount,1);
   assert.equal(payload.draftDecision,'draft');
   assert.equal(aiCalls,1);
   assert.equal(payload.stages.consensus,'not_tested_no_call');
  }],
  ['autoteste não dá sucesso quando IA não está vinculada',async()=>{
   const response=await worker.fetch(createRequest('/api/selftest','POST'),{},verified);
   const payload=await response.json();
   assert.equal(response.status,503);
   assert.equal(payload.passed,false);
  }]
 ];
 let passed=0,failed=0;
 for(const [label,fn] of cases){
  try{await fn();passed++;console.log('PASSOU:',label)}
  catch(error){failed++;process.exitCode=1;console.error('FALHOU:',label,error)}
 }
 console.log('Diagnóstico científico:',passed,'/',cases.length,'falhas:',failed);
}
tests().finally(()=>{globalThis.fetch=oldFetch});
