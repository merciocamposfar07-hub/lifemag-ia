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
  source + '\n;({ initialState, readStore, writeStore, uid, yyyyMmDd, parseISODate, addDays, endDate, alertDate, daysUntil, fmtDate });',
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
