'use strict';
const assert=require('node:assert/strict');
const {mkdtempSync,writeFileSync,rmSync}=require('node:fs');
const {tmpdir}=require('node:os');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const folder=mkdtempSync(path.join(tmpdir(),'lifemag-d1-check-'));
const exe=path.join(__dirname,'..','scripts','preparar-indice-cientifico.mjs');
function run(doc){
 const p=path.join(folder,'manifesto.json');
 writeFileSync(p,JSON.stringify(doc));
 return spawnSync(process.execPath,[exe,p],{encoding:'utf8'});
}
const example={
 id:'anvisa-exemplo-ficticio',sourceId:'anvisa-fb',
 title:'Documento fictício para verificação de importação',edition:'edição demonstrativa',
 officialUrl:'https://www.gov.br/anvisa/pt-br/assuntos/farmacopeia',
 license:'Uso demonstrativo, nenhuma publicação real',reviewedBy:'Farmaceutico revisor ficticio',
 verifiedAt:'2026-11-04',reviewStatus:'approved',sections:[{
  heading:'Trecho exclusivamente fictício',
  body:'Texto fictício para verificar geração SQL e integridade das fontes. Nenhuma dose real ou recomendação clínica.'}]
};
const cases=[
 ['SQL gerado sem BEGIN nem COMMIT explícitos',()=>{
  const r=run(example);assert.equal(r.status,0,r.stderr);
  assert.match(r.stdout,/INSERT INTO scientific_documents/);
  assert.match(r.stdout,/INSERT INTO scientific_passages/);
  assert.doesNotMatch(r.stdout,/^BEGIN TRANSACTION;|^COMMIT;/m);
 }],
 ['revisão ausente impede importação',()=>{
  const r=run({...example,reviewStatus:'draft'});assert.notEqual(r.status,0);
 }],
 ['domínio não oficial impede importação',()=>{
  const r=run({...example,officialUrl:'https://exemplo.com/recomendacao'});assert.notEqual(r.status,0);
 }],
 ['documento sem trechos é recusado',()=>{
  const r=run({...example,sections:[]});assert.notEqual(r.status,0);
 }]
];
let passed=0,failed=0;
try{
 for(const [name,fn] of cases){
  try{fn();passed++;console.log('PASSOU:',name)}
  catch(e){failed++;process.exitCode=1;console.error('FALHOU:',name,e.message)}
 }
 console.log('Testes de importação D1:',passed,'/',cases.length,'falhas:',failed);
}finally{rmSync(folder,{recursive:true,force:true})}
