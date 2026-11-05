'use strict';
const assert=require('node:assert/strict');
async function main(){
 const {quickB12VitaminDGuidance}=await import('../worker/quick-nutrients.js');
 const check=(name,run)=>{run();console.log('PASSOU: '+name)};
 check('caso do vídeo recebe orientação em uma única mensagem',()=>{
  const r=quickB12VitaminDGuidance('Homem 41 anos, 68 kg, fadiga. B12 em 200, vitamina D em 30.');
  assert.ok(r);assert.equal(r.model,'curated_nutrient_guidance_v1');
  assert.equal(r.requiresProfessionalReview,true);
  assert.equal(r.draft.decision,'preliminary_draft');
  assert.equal(r.draft.canIssuePrescription,false);
  assert.ok(r.answer.includes('1.000 mcg'));
  assert.ok(r.answer.includes('600 UI/dia'));
  assert.ok(r.answer.includes('30 ng/mL'));
  assert.ok(r.answer.includes('Unidades presumidas'));
  assert.ok(r.sources.some(x=>x.url.includes('nice.org.uk')));
  assert.ok(r.sources.some(x=>x.url.includes('ods.od.nih.gov')));
 });
 check('unidades especificadas não são tratadas como presumidas',()=>{
  const r=quickB12VitaminDGuidance('B12 200 pg/mL; vitamina D 30 ng/mL');
  assert.ok(r);assert.ok(!r.answer.includes('Unidades presumidas'));
 });
 check('doses em mcg e UI não são confundidas com laudos',()=>{
  assert.equal(quickB12VitaminDGuidance('B12 200 mcg e vitamina D 30 UI'),null);
 });
 check('resultados fora do escopo não geram tratamento padronizado',()=>{
  assert.equal(quickB12VitaminDGuidance('B12 80 pg/ml e D 5 ng/ml'),null);
  assert.equal(quickB12VitaminDGuidance('B12 400 pg/ml D 30 ng/ml'),null);
  assert.equal(quickB12VitaminDGuidance('B12 200 pg/ml D 75 ng/ml'),null);
 });
 check('não recomenda dose de ataque de vitamina D',()=>{
  const r=quickB12VitaminDGuidance('B12 200, D 30');
  assert.ok(r);
  assert.ok(!r.answer.includes('50.000'));
  assert.ok(/não há indicação de dose de ataque/i.test(r.answer));
  assert.equal(r.draft.ingredients[1].role,'OPCIONAL');
 });
 console.log('Interpretação rápida de vitaminas: verificações concluídas');
}
main().catch(e=>{console.error(e);process.exitCode=1});
