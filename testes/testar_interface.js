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

  ['cabeçalho e card em um único conjunto', () => assert.match(js, /class="home-intro"[\s\S]*class="welcome-panel"[\s\S]*class="home-brand-banner"/)],
  ['sem texto extra no cabeçalho', () => assert.equal(js.includes('ESPAÇO CLÍNICO</div><strong>'), false)],
  ['foto compacta no celular', () => assert.match(css, /flex:0 0 49px/)],
  ['card branco sobreposto ao azul', () => assert.match(css, /margin:-19px 13px 0/)],
  ['card com cantos superiores arredondados', () => assert.match(css, /border-radius:33px 33px 26px 26px/)],
  ['faixa azul sem aparência de cartão', () => assert.match(css, /border-radius:0;[\s\S]*background:linear-gradient\(105deg,#062b45/)],
  ['identificação e registro profissional', () => assert.match(js, /welcome-name[\s\S]*info\.crf/)],
  ['sem botão Início duplicado no cabeçalho', () => assert.equal(js.includes('class="home-shortcut"'), false)],
  ['marca do topo apenas visual', () => assert.equal(js.includes('class="brand-home"'), false)],
  ['início presente na barra inferior', () => assert.match(js, /class="bottomnav"[\s\S]*data-page="home"/)],
  ['IA no terceiro espaço da barra', () => assert.match(js, /\['followup','Acompanhar','bell'\],\['conversation','IA','sparkles'\]/)],
  ['IA abre a conversa', () => assert.match(js, /class="bottomnav"[\s\S]*data-page="\$\{p\}"/)],
  ['IA central recebe destaque', () => assert.match(css, /\.bottomnav \.ai-center \.ai-orb/)],
  ['home móvel sem cabeçalho duplicado', () => assert.match(css, /\.app-shell\.is-home \.topbar\{display:none\}/)],
  ['sem alegação de IA clínica conectada', () => assert.match(js, /A conexão com o modelo de inteligência artificial ainda não está ativa/)],
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
