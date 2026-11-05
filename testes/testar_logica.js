'use strict';
// Testes de lógica do protótipo. Não validam eficácia nem segurança clínica.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const cache = new Map();
const localStorage = {
  getItem: key => cache.has(key) ? cache.get(key) : null,
  setItem: (key, value) => cache.set(key, String(value)),
};
const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'store.js'), 'utf8');
const api = vm.runInNewContext(
  source + '\n;({ initialState, readStore, writeStore, uid, yyyyMmDd, parseISODate, addDays, endDate, alertDate, daysUntil, fmtDate, deletePatientRecord, createAnonymousFormulaDraft, linkAnonymousDraftToPatient });',
  { localStorage, crypto: { randomUUID: () => 'id-teste' } },
);

const cases = [
  ['data local', () => assert.equal(api.yyyyMmDd(new Date(2026, 10, 2, 12)), '2026-11-02')],
  ['virada do mês', () => assert.equal(api.addDays('2026-11-30', 1), '2026-12-01')],
  ['virada do ano', () => assert.equal(api.addDays('2026-12-31', 1), '2027-01-01')],
  ['ano bissexto', () => assert.equal(api.addDays('2024-02-28', 1), '2024-02-29')],
  ['ano não bissexto', () => assert.equal(api.addDays('2025-02-28', 1), '2025-03-01')],
  ['data impossível rejeitada', () => assert.equal(api.addDays('2026-02-31', 1), '')],
  ['mês inválido rejeitado', () => assert.equal(api.addDays('2026-13-01', 1), '')],
  ['delta fracionário rejeitado', () => assert.equal(api.addDays('2026-11-02', 0.5), '')],
  ['duração 15 dias, início inclusivo', () =>
    assert.equal(api.endDate({ startDate: '2026-11-02', duration: 15 }), '2026-11-16')],
  ['lembrete três dias antes do término', () =>
    assert.equal(api.alertDate({ startDate: '2026-11-02', duration: 15 }), '2026-11-13')],
  ['contagem de dias', () => assert.equal(api.daysUntil('2026-11-17', '2026-11-02'), 15)],
  ['datas inválidas não criam contagem', () =>
    assert.equal(api.daysUntil('2026-02-31', '2026-11-02'), Infinity)],
  ['formatação de data', () => assert.equal(api.fmtDate('2026-11-02'), '02/11/2026')],
  ['formatação inválida', () => assert.equal(api.fmtDate('2026-02-31'), '—')],
  ['estado inicial vazio', () => {
    const s = api.initialState();
    assert.equal(s.patients.length, 0);
    assert.equal(s.visits.length, 0);
  }],
  ['salvar e ler somente dados fictícios', () => {
    const s = api.initialState();
    s.patients.push({ id: 'ficticio-1', name: 'Paciente fictício' });
    api.writeStore(s);
    assert.equal(api.readStore().patients[0].name, 'Paciente fictício');
  }],
  ['exclusão de cadastro fictício remove seus atendimentos, preserva outros', () => {
    const state=api.initialState();
    state.patients=[{id:'a',name:'Pessoa de teste A'},{id:'b',name:'Pessoa de teste B'}];
    state.visits=[{id:'v1',patientId:'a'},{id:'v2',patientId:'b'},{id:'v3',patientId:'a'}];
    const result=api.deletePatientRecord(state,'a');
    assert.equal(result.deleted,true);
    assert.equal(result.visitCount,2);
    assert.equal(state.patients.length,1);
    assert.equal(state.visits.length,1);
    assert.equal(state.visits[0].patientId,'b');
  }],
  ['exclusão de cadastro desconhecido não remove nada', () => {
    const state=api.initialState();state.patients=[{id:'a',name:'Teste'}];
    assert.equal(api.deletePatientRecord(state,'inexistente').deleted,false);
    assert.equal(state.patients.length,1);
  }],
  ['rascunho anônimo salva apenas composição sem nomes ou exames', () => {
    const state=api.initialState();
    const original={decision:'draft',formula_name:'Fórmula de teste',quantity:'30 cápsulas',
      pharmaceutical_form:'Cápsulas',route:'oral',posology:'uma tomada',
      initial_duration_days:15,patientName:'PROIBIDO',cpf:'12345678900',
      examAttachments:[{name:'exame-clinico.pdf'}],
      ingredients:[{name:'Riboflavina',dose_value:'400',dose_unit:'mg',role:'MOTOR',
      rationale:'estudo',references:['1'],dose_supported:true}]};
    const draft=api.createAnonymousFormulaDraft(state,original,'Caso 01');
    assert.ok(draft);
    assert.equal(state.anonymousDrafts.length,1);
    assert.equal(draft.ingredients[0].dose,'400');
    assert.equal('patientName' in draft,false);
    assert.equal('cpf' in draft,false);
    assert.equal('examAttachments' in draft,false);
  }],
  ['proposta anônima vincula a paciente demonstrativo mantendo revisão pendente', () => {
    const state=api.initialState();
    state.patients.push({id:'p-demo',name:'Paciente fictício',phone:'000'});
    const draft=api.createAnonymousFormulaDraft(state,{
      decision:'draft',formula_name:'Fórmula simulada',ingredients:[{
      name:'Magnésio',dose_value:'200',dose_unit:'mg',role:'MOTOR',references:['1']}]
    },'Caso 02');
    const visit=api.linkAnonymousDraftToPatient(state,draft.id,'p-demo');
    assert.ok(visit);
    assert.equal(visit.patientId,'p-demo');
    assert.equal(visit.aiDraftPendingReview,true);
    assert.equal(state.visits.length,1);
    assert.equal(draft.linkedVisitId,visit.id);
    assert.equal(api.linkAnonymousDraftToPatient(state,draft.id,'p-demo'),null);
  }],
  ['custo-benefício exclui opcionais automaticamente e mantém motor e coadjuvante', () => {
    const st=api.initialState();
    st.patients.push({id:'p-test',name:'Paciente simulado',phone:'000'});
    const d=api.createAnonymousFormulaDraft(st,{decision:'preliminary_draft',
      formula_name:'B12 com opções',ingredients:[
       {name:'Vitamina B12',dose_value:'1000',dose_unit:'mcg',role:'MOTOR',
        references:['NICE-B12'],dose_supported:true},
       {name:'Vitamina D3',dose_value:'600',dose_unit:'UI',role:'OPCIONAL',
        references:['NIH-D'],dose_supported:true}
      ]},'Caso 05');
    assert.equal(d.ingredients.length,2);
    const visit=api.linkAnonymousDraftToPatient(st,d.id,'p-test');
    assert.ok(visit);
    assert.equal(visit.ingredients.length,1);
    assert.equal(visit.ingredients[0].name,'Vitamina B12');
    assert.match(visit.observations,/OPCIONAIS/);
    assert.equal(visit.aiDraftPendingReview,true);
  }],
  ['recuperação de armazenamento corrompido', () => {
    localStorage.setItem('lifemag-prototype-v0.1.0', '{invalido');
    assert.equal(api.readStore().patients.length, 0);
  }],
];

let failures = 0;
for (const [name, test] of cases) {
  try {
    test();
    console.log('PASSOU:', name);
  } catch (error) {
    failures++;
    console.error('FALHOU:', name, error.message);
  }
}
console.log('Resultado: ' + cases.length + ' testes, ' + failures + ' erro(s).');
if (failures) process.exitCode = 1;
