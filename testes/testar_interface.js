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

  ['balão branco inclui os quatro cartões', () => assert.match(js, /class="home-brand-banner"[\s\S]*class="tilegrid" aria-label="Acesso rápido"/)],

  ['balão branco chega até as bordas da tela', () => assert.match(css, /v0\.1\.8[\s\S]*\.app-shell\.is-home \.home-brand-banner\{[\s\S]*margin:-25px 0 0;/)],
  ['curva apenas nos cantos superiores', () => assert.match(css, /v0\.1\.8[\s\S]*border-radius:42px 42px 0 0;/)],
  ['fundo azul não continua sob o balão inteiro', () => assert.match(css, /v0\.1\.8[\s\S]*\.home-intro\{[\s\S]*background:#fff;/)],
  ['azul desenhado somente atrás do arco', () => assert.match(css, /v0\.1\.8[\s\S]*\.home-intro::before\{[\s\S]*height:145px;/)],
  ['balão sem borda nem sombra lateral', () => assert.match(css, /v0\.1\.8[\s\S]*border:0;[\s\S]*border-radius:42px 42px 0 0;[\s\S]*box-shadow:none;/)],
  ['balão branco contém também a faixa de evidências', () => assert.match(js, /class="science-banner"[\s\S]*<\/section><\/div>\s*<div class="section-heading"><h2>Seu acompanhamento/)],
  ['sem título Acesso rápido separado do balão', () => assert.equal(js.includes('<h2>Acesso rápido</h2>'), false)],
  ['descrição inicial em fonte 18px', () => assert.match(css, /\.home-brand-banner p\{font-size:18px/)],
  ['cartões com texto escuro e legível', () => assert.match(css, /\.home-brand-banner \.tile>span:not\(\.icon-bg\):not\(\.tile-chevron\)\{font-size:16px/)],
  ['barra inferior com fundo branco opaco', () => assert.match(css, /\.bottomnav\{\s*background:#fff;/)],
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
  ['IA só habilita após verificação autenticada', () => assert.match(js, /aiSession\.ready=Boolean\(res\.ok&&info\.authenticated&&info\.ready\)/)],
  ['pesquisa anônima disponível sem cadastrar paciente', () => assert.match(js, /if\(!v\)return scientificOnly\(\)/)],
  ['Central Científica permite diagnóstico sem cadastrar paciente', () => assert.match(js, /data-science-check="sources"/)],
  ['Central Científica permite pesquisar textos oficiais recuperados', () => {
    assert.match(js,/id="science-search-form"/);
    assert.match(js,/\/api\/science\/search\?q=/);
    assert.match(js,/Sinopse institucional \(não é dose clínica\)/);
  }],

  ['autoteste da IA exige acionamento explícito', () => assert.match(js, /data-science-check="model"/)],
  ['diagnóstico não é confundido com liberação de prontuário', () => assert.match(js, /not_ready_do_not_enter_real_patients|O teste do motor usa somente caso fictício/)],
  ['pesquisa avulsa não grava prontuário no navegador', () => assert.match(js, /if\(v!==anonymousResearch\)persist\(\)/)],
  ['questionamento científico usa API no mesmo domínio', () => assert.match(js, /fetch\('\/api\/assist'/)],

  ['histórico e campo compõem a mesma conversa, em ordem legível', () => {
    const isolated=js.slice(js.indexOf('function scientificOnly()'),js.indexOf('function conversation(){'));
    assert.ok(isolated.indexOf('class="research-thread"')>0);
    assert.ok(isolated.indexOf('class="research-history"')<isolated.indexOf('<form id="research-form"'));
    assert.match(css,/\.research-page \.research-history\{[\s\S]*?overflow-y:auto/);
  }],
  ['histórico privado é recuperado e persistido pelo banco clínico', () => {
    assert.match(js,/anonymousResearch\.chat=Array\.isArray\(data\.researchMessages\)/);
    assert.match(js,/function persistResearchConversation\(\)/);
    assert.match(js,/persistResearchConversation\(\);render\(\)/);
    assert.match(js,/data-reset-research/);
  }],
  ['tela IA não usa altura forçada do chat antigo', () => {
    const isolated=js.slice(js.indexOf('function scientificOnly()'),js.indexOf('function conversation(){'));
    assert.doesNotMatch(isolated,/chat-shell/);
    assert.match(css,/\.research-page \.research-input\{[\s\S]*?margin-top:0;/);
  }],
  ['estilos do modo científico só atingem a Conversa Inteligente', () => {
    assert.match(css,/\.research-page \.research-panel\{/);
    assert.match(css,/v0\.1\.8 — geometria final do topo/);
  }],


  ['campo de IA horizontal e com largura mínima no Safari', () => {
    assert.match(css,/\.research-page #research-form\.research-input\{[\s\S]*?display:grid;/);
    assert.match(css,/grid-template-columns:minmax\(0,1fr\) 58px/);
    assert.match(css,/writing-mode:horizontal-tb/);
  }],
  ['checkbox Consensus não ocupa largura do texto de IA', () => assert.match(css,/\.research-page #research-form\.research-input \.consensus-option\{[\s\S]*grid-column:1\/-1;/)],
  ['cadastro selecionado pode ser editado e excluído', () => {
    assert.match(js,/data-action="delete-patient"/);
    assert.match(js,/data-select-patient/);
    assert.match(js,/deletePatientRecord\(data,p\.id\)/);
  }],
  ['botões opcionais de arquivo e câmera no cadastro', () => {
    assert.match(js,/id="patient-exam-gallery"/);
    assert.match(js,/id="patient-exam-camera"/);
    assert.match(js,/capture="environment"/);
  }],
  ['exames não são persistidos em localStorage nesta fase', () => {
    assert.match(js,/nenhum exame é salvo ou enviado/);
    assert.doesNotMatch(js,/persist\(examSession/);
  }],
  ['conversa oferece atalho para preparar revisão magistral sem trocar de telas', () => {
    assert.match(js,/data-fast-recipe/);
    assert.match(js,/id="quick-recipe-form"/);
    assert.match(js,/linkAnonymousDraftToPatient\(data,saved\.id,pid\)/);
    assert.match(js,/useVisit\(v\);setPage\('editor'\)/);
    assert.match(css,/\.research-page \.quick-recipe-form/);
  }],
  ['rascunho anônimo pode ser salvo e reaberto na IA', () => {
    assert.match(js,/data-save-anon-draft/);
    assert.match(js,/data-open-anon-draft/);
    assert.match(js,/createAnonymousFormulaDraft\(data,message\.draft,label,message\.sources\)/);
  }],
  ['rascunho anônimo pode ser vinculado a paciente após cadastro', () => {
    assert.match(js,/data-link-anon-draft/);
    assert.match(js,/linkAnonymousDraftToPatient\(data,draftId,patientId\)/);
    assert.match(js,/aiDraftPendingReview/);
  }],
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
