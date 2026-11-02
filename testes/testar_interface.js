'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
const js = read('src/app.js');
const css = read('src/style.css');
const html = read('index.html');
const cases = [
  ['identidade LifeMag IA mantida', () => assert.match(html, /<title>LifeMag IA/)],
  ['ícone oficial preservado', () => assert.match(js, /assets\/icone-oficial-escuro\.png/)],
  ['página inicial personalizada', () => assert.match(js, /Bem-vindo\(a\)/)],
  ['identificação e registro profissional', () => assert.match(js, /welcome-name[\s\S]*info\.crf/)],
  ['atalho de início no cabeçalho', () => assert.match(js, /class="home-shortcut"[\s\S]*data-page="home"/)],
  ['início presente na barra inferior', () => assert.match(js, /class="bottomnav"[\s\S]*data-page="home"/)],
  ['barreiras contra rotas desconhecidas', () => assert.match(js, /VALID_PAGES\.includes\(next\)/)],
  ['navegação do Safari usa histórico', () => assert.match(js, /popstate/)],
  ['seletor de foto profissional', () => assert.match(js, /id="professional-photo-input"/)],
  ['foto reduzida para 256 pixels', () => assert.match(js, /const size=256, canvas=/)],
  ['formato de foto seguro JPEG', () => assert.match(js, /toDataURL\('image\/jpeg'/)],
  ['remover foto disponível', () => assert.match(js, /data-action="remove-photo"/)],
  ['fonte dos campos evita zoom iOS', () => assert.match(css, /\.field input[\s\S]*font-size:16px/)],
  ['barra inferior oferece cinco destinos', () => assert.match(css, /repeat\(5,minmax\(0,1fr\)\)/)],
  ['cores de texto escuro', () => assert.match(css, /--muted:#435f79/)],
  ['aviso de protótipo mantido', () => assert.match(js, /Sem proteção de prontuários ou validação clínica/)],
];
let failures=0;
for (const [name, check] of cases) {
  try { check(); console.log('PASSOU: '+name); }
  catch(e) { failures++; console.error('FALHOU: '+name+' — '+e.message); }
}
console.log('Verificações de interface: '+cases.length+'; falhas: '+failures);
if(failures) process.exitCode=1;
