'use strict';
const assert=require('node:assert/strict');
async function main(){
  const {normalizeDraft,draftAsText,FORMULA_SCHEMA,missingClinicalBasics,screenClinicalQuestion}=await import('../worker/clinical-draft.js');
  const evidence=[{id:'1',abstract:'In adults with migraine, riboflavin 400 mg per day was evaluated for prophylaxis.',url:'https://pubmed.ncbi.nlm.nih.gov/12345678/'}];
  const basic=()=>({
    decision:'draft',objective:'Profilaxia da enxaqueca',formula_name:'Riboflavina',quantity:'30 cápsulas',
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
  await check('caso gravado: idade, sexo, peso informal, alergias e medicamentos são reconhecidos',async()=>{
    const input='Homem de 41 anos, 68,0 de peso, não tem alergias e não faz uso de medicação contínua. Sente indisposição, cansaço, fadiga. Qual formulação sugerida?';
    const missing=missingClinicalBasics(input);
    assert.ok(!missing.includes('Sexo para individualização clínica'));
    assert.ok(!missing.includes('Faixa etária ou idade'));
    assert.ok(!missing.includes('Peso corporal em kg'));
    assert.ok(!missing.includes('Alergias e reações anteriores'));
    assert.ok(!missing.includes('Medicamentos e suplementos em uso, ou confirmação de ausência'));
    assert.ok(missing.includes('Comorbidades, antecedentes e fatores de risco'));
  });
  await check('fadiga isolada não vira falso sinal de alarme nem receita vazia',async()=>{
    const input='Homem de 41 anos, 68,0 de peso, não tem alergias e não faz uso de medicação contínua. Sente indisposição, cansaço, fadiga. Qual formulação sugerida?';
    assert.equal(screenClinicalQuestion(input),null);
    assert.equal(screenClinicalQuestion('Cansaço, fadiga e indisposição'),null);
  });
  await check('esclarecimentos na mesma conversa retomam avaliação, não reiniciam idade e peso',async()=>{
    const input='Homem de 41 anos, 68,0 de peso, sem alergias, não usa medicamentos, não possui doenças conhecidas. Sente fadiga. Há 3 semanas, dorme bem. Exames recentes disponíveis.';
    assert.equal(screenClinicalQuestion(input),null);
  });
  await check('negação de falta de ar não inventa sinal de alerta',async()=>{
    const input='Homem de 41 anos, 68 kg, sem alergias, sem medicamentos, com fadiga, sem falta de ar';
    assert.equal(screenClinicalQuestion(input),null);
  });
  await check('dor no peito relatada com fadiga exige avaliação prioritária',async()=>{
    const input='Homem de 41 anos, 68 kg, sem alergias, sem medicamentos, com fadiga e dor no peito';
    assert.equal(screenClinicalQuestion(input).decision,'red_flags');
  });
  await check('modelo que inventa sinal de alerta não ultrapassa triagem clínica',async()=>{
    const fake=basic();
    fake.decision='red_flags';fake.red_flags=['necessidade de investigar causa da fadiga'];
    const input='Homem de 41 anos, 68 kg, sem alergias, sem medicamentos, com fadiga';
    const out=normalizeDraft(fake,evidence,input);
    assert.equal(out.decision,'insufficient_info');
    assert.deepEqual(out.red_flags,[]);
  });
  await check('schema exige todos campos e composição',async()=>{
    assert.ok(FORMULA_SCHEMA.required.includes('ingredients'));
    assert.ok(FORMULA_SCHEMA.required.includes('meal_relation'));
  });
  await check('dose numérica só é respaldada quando citada nos resumos',async()=>{
    const d=normalizeDraft(basic(),evidence);
    assert.equal(d.decision,'draft');assert.equal(d.ingredients[0].dose_supported,true);
    assert.equal(d.canIssuePrescription,false);
  });
  await check('quantidade para manipular integra o relatório e schema',async()=>{
    const d=normalizeDraft(basic(),evidence);
    assert.ok(FORMULA_SCHEMA.required.includes('quantity'));
    assert.equal(d.quantity,'30 cápsulas');
    assert.ok(draftAsText(d).includes('QUANTIDADE PARA MANIPULAR'));
  });
  await check('dose de outra substância não valida ingrediente diferente',async()=>{
    const unrelated=[{id:'1',title:'Magnesium clinical trial',
      abstract:'Magnesium 400 mg daily was evaluated for migraine prophylaxis.'}];
    const d=normalizeDraft(basic(),unrelated);
    assert.equal(d.ingredients[0].dose_supported,false);
    assert.equal(d.decision,'insufficient_evidence');
  });
  await check('sinopse oficial não pode fundamentar dose terapêutica',async()=>{
    const overview=[{id:'O1',title:'Formulário de Fitoterápicos',
      abstract:'Resumo institucional menciona cafeína 400 mg apenas como exemplo, não é ensaio clínico.',
      evidenceTier:'official_overview',
      url:'https://www.gov.br/anvisa/pt-br/assuntos/farmacopeia/formulario-fitoterapico'}];
    const raw=basic();raw.ingredients[0].name='Cafeína';raw.ingredients[0].references=['O1'];
    const d=normalizeDraft(raw,overview);
    assert.equal(d.ingredients[0].dose_supported,false);
    assert.equal(d.decision,'insufficient_evidence');
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
  await check('dados clínicos mínimos incluem sexo e peso para dose individual',async()=>{
    const full='Mulher, 35 anos, 70 kg, sem medicamentos, sem alergias, sem doenças conhecidas: enxaqueca';
    const insufficient='35 anos, sem medicamentos, sem alergias, sem doenças conhecidas: enxaqueca';
    assert.equal(normalizeDraft(basic(),evidence,full).decision,'draft');
    const limited=normalizeDraft(basic(),evidence,insufficient);
    assert.equal(limited.decision,'preliminary_draft');
    assert.ok(limited.missing_information.includes('Sexo para individualização clínica'));
    assert.ok(limited.missing_information.includes('Peso corporal em kg'));
  });
  await check('falta de informações clínicas bloqueia liberação',async()=>{
    const raw=basic();raw.missing_information=['medicamentos em uso'];
    const d=normalizeDraft(raw,evidence);assert.equal(d.decision,'preliminary_draft');
    assert.equal(d.canIssuePrescription,false);
    assert.match(draftAsText(d),/POSOLOGIA ESTUDADA/);
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
