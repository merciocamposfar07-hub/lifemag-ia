'use strict';
// Testes do fluxo clínico demonstrativo. NÃO atestam prontuário protegido nem segurança terapêutica.
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const store=fs.readFileSync(path.join(root,'src/store.js'),'utf8');
const app=fs.readFileSync(path.join(root,'src/app.js'),'utf8');
const disk=new Map();
const events={};
const shell={innerHTML:''};
const fakeDocument={
  getElementById:id=>id==='app'?shell:{innerHTML:''},
  querySelector:()=>null,
  createElement:()=>({textContent:'',className:'',remove(){}}),
  body:{appendChild(){}},
  addEventListener:(name,fn)=>events[name]=fn,
};
class FakeFormData{
  constructor(form){this.values=form.values||{}}
  *entries(){yield* Object.entries(this.values)}
}
const ctx={
  localStorage:{getItem:k=>disk.get(k)??null,setItem:(k,v)=>disk.set(k,String(v)),removeItem:k=>disk.delete(k)},
  crypto:{randomUUID:()=>String(Math.random()).slice(2)},
  document:fakeDocument,
  window:{addEventListener:(name,fn)=>events[name]=fn},
  history:{pushState(){}},
  location:{hash:''},
  scrollTo(){},
  setTimeout(){return 1},
  clearTimeout(){},
  FormData:FakeFormData,
  console,
  confirm:()=>false,
};
const api=vm.runInNewContext(store+'\n'+app+'\n;({ data,ui,initialState,emptyClinicalAssessment,normalizeClinicalAssessment,findPotentialDuplicatePatient,startVisit,handleSubmit,handleClick,patients,conversation,editor,renderPaper,readStore });',ctx);
const cases=[];
function test(name,fn){cases.push([name,fn])}
function formSubmit(id,values){api.handleSubmit({target:{id,values,matches:()=>true},preventDefault(){}})}
test('cadastro inicial não contém pacientes pré-carregados',()=>{
  assert.equal(api.data.patients.length,0);
  assert.equal(api.data.visits.length,0);
});
test('cadastro manual cria paciente fictício',()=>{
  formSubmit('patient-form',{name:'Paciente Fictício',phone:'81999990000',dob:'1991-05-10',address:'Local fictício'});
  assert.equal(api.data.patients.length,1);
  assert.equal(api.data.patients[0].name,'Paciente Fictício');
  assert.ok(api.ui.patientId);
});
test('cadastro não cria atendimento automaticamente',()=>assert.equal(api.data.visits.length,0));
test('nome equivalente detecta provável duplicata sem misturar pessoas por telefone',()=>{
  const found=api.findPotentialDuplicatePatient(api.data.patients,{name:'Paciente Ficticio',phone:'(81) 99999-0000',dob:'1991-05-10'});
  assert.ok(found);
  const distinct=api.findPotentialDuplicatePatient(api.data.patients,{name:'Outra Pessoa',phone:'81999990000',dob:'1991-05-10'});
  assert.equal(distinct,null);
});
test('cadastro repetido não duplica o mesmo paciente',()=>{
  api.ui.patientId=null;
  formSubmit('patient-form',{name:'Paciente Ficticio',phone:'81999990000',dob:'1991-05-10'});
  assert.equal(api.data.patients.length,1);
});
test('avaliação pertence ao atendimento e começa vazia',()=>{
  api.startVisit(api.data.patients[0].id);
  assert.equal(api.data.visits.length,1);
  assert.equal(api.data.visits[0].patientId,api.data.patients[0].id);
  assert.equal(api.data.visits[0].assessment.chiefComplaint,'');
});
test('salvar avaliação preserva objetivo, fármacos, alergias e riscos',()=>{
  formSubmit('assessment-form',{chiefComplaint:'Objetivo fictício',medications:'Medicamento fictício',allergies:'Não relatado no teste',riskFactors:'Restrição fictícia'});
  const a=api.data.visits[0].assessment;
  assert.equal(a.chiefComplaint,'Objetivo fictício');
  assert.equal(a.medications,'Medicamento fictício');
  assert.equal(a.allergies,'Não relatado no teste');
  assert.equal(a.riskFactors,'Restrição fictícia');
  assert.ok(api.data.visits[0].assessmentUpdatedAt);
});
test('o histórico preserva avaliação entre atendimentos distintos',()=>{
  api.startVisit(api.data.patients[0].id);
  assert.equal(api.data.visits.length,2);
  assert.equal(api.data.visits[1].assessment.chiefComplaint,'');
  assert.equal(api.data.visits[0].assessment.chiefComplaint,'Objetivo fictício');
});
test('reabrir atendimento escolhe avaliação original',()=>{
  const old=api.data.visits[0];
  api.handleClick({target:{closest:()=>({dataset:{reviewVisit:old.id}})}});
  assert.equal(api.ui.visitId,old.id);
  assert.equal(api.ui.page,'conversation');
});
test('editor mostra contexto e dados não informados sem inferi-los',()=>{
  const html=api.editor();
  assert.ok(html.includes('Objetivo fictício'));
  assert.ok(html.includes('Restrição fictícia'));
  assert.ok(!html.includes('Sem alergias'));
});
test('ficha clínica demonstrativa inclui avaliação do atendimento',()=>{
  const html=api.renderPaper('clinical',api.data.visits[0],api.data.patients[0]);
  assert.ok(html.includes('Motivo da consulta e objetivo clínico'));
  assert.ok(html.includes('Objetivo fictício'));
  assert.ok(html.includes('Medicamento fictício'));
  assert.ok(html.includes('RASCUNHO DE TESTE'));
});
test('armazenamento permanece local e não vinculado ao Portal CSC',()=>{
  assert.equal(api.readStore().patients.length,1);
  assert.equal(api.readStore().visits.length,2);
  assert.ok(!store.includes('portalTacs'));
});
let failures=0;
for(const [name,fn] of cases){
  try{fn();console.log('PASSOU:',name)}catch(e){failures++;console.error('FALHOU:',name,e.message)}
}
console.log('Testes do fluxo clínico:',cases.length,'falhas:',failures);
if(failures)process.exitCode=1;
