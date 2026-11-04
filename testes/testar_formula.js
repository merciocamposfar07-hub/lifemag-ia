'use strict';
const assert=require('node:assert/strict');
async function main(){
  const {normalizeDraft,draftAsText,FORMULA_SCHEMA}=await import('../worker/clinical-draft.js');
  const evidence=[{id:'1',abstract:'In adults with migraine, riboflavin 400 mg per day was evaluated for prophylaxis.',url:'https://pubmed.ncbi.nlm.nih.gov/12345678/'}];
  const basic=()=>({
    decision:'draft',objective:'Profilaxia da enxaqueca',formula_name:'Riboflavina',
    pharmaceutical_form:'Cápsula',route:'oral',
    ingredients:[{name:'Riboflavina',chemical_form:'riboflavina',dose_value:'400',
      dose_unit:'mg',role:'MOTOR',rationale:'Investigada em adultos',references:['1']}],
    posology:'a definir após avaliação clínica',meal_relation:'a definir',
    daily_schedule:'a definir',initial_duration_days:30,reassessment_days:15,
    extension_criteria:'reavaliar',monitoring:['eventos adversos'],interactions:[],
    contraindications:[],missing_information:[],red_flags:[],limitations:['resumo apenas']
  });
  let passed=0,fail=0;
  async function check(name,fn){try{await fn();passed++;console.log('PASSOU:',name)}catch(e){fail++;console.error('FALHOU:',name,e);process.exitCode=1}}
  await check('schema exige todos campos e composição',async()=>{
    assert.ok(FORMULA_SCHEMA.required.includes('ingredients'));
    assert.ok(FORMULA_SCHEMA.required.includes('meal_relation'));
  });
  await check('dose numérica só é respaldada quando citada nos resumos',async()=>{
    const d=normalizeDraft(basic(),evidence);
    assert.equal(d.decision,'draft');assert.equal(d.ingredients[0].dose_supported,true);
    assert.equal(d.canIssuePrescription,false);
  });
  await check('dose não encontrada é marcada como não confirmada',async()=>{
    const raw=basic();raw.ingredients[0].dose_value='700';
    const d=normalizeDraft(raw,evidence);
    assert.equal(d.decision,'insufficient_evidence');
    assert.equal(d.ingredients[0].dose_supported,false);
    assert.ok(draftAsText(d).includes('DOSE NÃO CONFIRMADA NAS FONTES'));
  });
  await check('fonte inventada não entra em composição',async()=>{
    const raw=basic();raw.ingredients[0].references=['404'];
    const d=normalizeDraft(raw,evidence);
    assert.equal(d.ingredients.length,0);assert.equal(d.decision,'insufficient_evidence');
  });
  await check('sinais de alarme bloqueiam proposta pronta',async()=>{
    const raw=basic();raw.red_flags=['sinal de alarme'];
    const d=normalizeDraft(raw,evidence);assert.equal(d.decision,'red_flags');
  });
  await check('falta de informações clínicas bloqueia liberação',async()=>{
    const raw=basic();raw.missing_information=['medicamentos em uso'];
    const d=normalizeDraft(raw,evidence);assert.equal(d.decision,'insufficient_info');
  });
  await check('ingredientes mantêm MOTOR/COADJUVANTE/OPCIONAL somente',async()=>{
    const raw=basic();raw.ingredients[0].role='SUPER EFEITO';
    const d=normalizeDraft(raw,evidence);assert.equal(d.ingredients[0].role,'OPCIONAL');
  });
  await check('duração e reavaliação não podem ser arbitrariamente longas',async()=>{
    const raw=basic();raw.initial_duration_days=50000;raw.reassessment_days=-5;
    const d=normalizeDraft(raw,evidence);
    assert.equal(d.initial_duration_days,null);assert.equal(d.reassessment_days,null);
  });
  await check('relatório inclui forma, refeição, horários e revisão',async()=>{
    const d=normalizeDraft(basic(),evidence);const text=draftAsText(d);
    for(const word of ['POSOLOGIA','REFEIÇÕES','HORÁRIOS','DURAÇÃO','REAVALIAÇÃO','NÃO É RECEITUÁRIO'])
      assert.ok(text.includes(word),word);
  });
  console.log('Testes de proposta magistral:',passed,'passaram; falhas:',fail);
}
main().catch(err=>{console.error(err);process.exitCode=1});
