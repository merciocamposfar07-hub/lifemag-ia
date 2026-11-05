
/* LifeMag IA v0.5.3 — pesquisa científica autenticada, biblioteca SQLite e rascunhos para revisão; NÃO usar pacientes reais. */
'use strict';
const IMG = 'assets/icone-oficial-escuro.png';
const iconPaths = {
  home:'<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',
  patients:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  sparkles:'<path d="m12 3 1.9 5.7L20 11l-6.1 2.3L12 19l-1.9-5.7L4 11l6.1-2.3zM19 18l.6 1.4L21 20l-1.4.6L19 22l-.6-1.4L17 20l1.4-.6z"/>',
  files:'<rect x="4" y="4" width="12" height="16" rx="2"/><path d="M8 8h4M8 12h4M8 16h4M18 8h2v13H8"/>',
  prescription:'<rect x="5" y="2" width="14" height="20" rx="2"/><path d="M9 7h6M9 12h4M9 17h6"/>',
  bell:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21a2 2 0 0 0 4 0"/>',
  compare:'<path d="M7 3v12m0 0-4-4m4 4 4-4M17 21V9m0 0-4 4m4-4 4 4"/><path d="M3 3h18M3 21h18"/>',
  science:'<path d="M9 3h6M10 3v7L4 19a2 2 0 0 0 2 3h12a2 2 0 0 0 2-3l-6-9V3M7 17h10"/>',
  settings:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1-2 2-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21h-3v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1-2-2 .1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H6v-3h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1 2-2 .1.1a1.7 1.7 0 0 0 1.8.3 1.7 1.7 0 0 0 1-1.5V5h3v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1 2 2-.1.1a1.7 1.7 0 0 0-.3 1.8 1.7 1.7 0 0 0 1.5 1H21v3h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  arrow:'<path d="M5 12h14m-6-6 6 6-6 6"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>',
  shield:'<path d="m12 2 9 4v6c0 5-3.5 8-9 10-5.5-2-9-5-9-10V6zM9 12l2 2 4-4"/>',
  send:'<path d="m22 2-7 20-4-9-9-4zM22 2 11 13"/>',
  edit:'<path d="M12 20h9M16 3a2 2 0 0 1 3 3L8 17l-5 1 1-5z"/>',
  trash:'<path d="M3 6h18M8 6V4h8v2m3 0-1 15H6L5 6M10 10v7M14 10v7"/>',
  printer:'<path d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z"/>',
  calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18"/>',
  link:'<path d="M10 13a5 5 0 0 0 8 .4l3-3a5 5 0 0 0-7-7l-1.7 1.7M14 11a5 5 0 0 0-8-.4l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
  heart:'<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8z"/>',
  search:'<circle cx="10" cy="10" r="7"/><path d="m15 15 6 6"/>',
  info:'<circle cx="12" cy="12" r="10"/><path d="M12 11v6M12 7h.01"/>',
  check:'<path d="m4 12 5 5L20 6"/>',
  chart:'<path d="M4 20V4M4 20h17M8 16l4-5 4 3 5-8"/>',
};
const I = (name,size=20) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${iconPaths[name]||iconPaths.info}</svg>`;
const E = x => String(x??'').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const S = (name,value='',opts='')=>`<div class="field"><label for="${E(name)}">${E(opts||name)}</label><input id="${E(name)}" name="${E(name)}" value="${E(value)}"></div>`;
const data = readStore();
const VALID_PAGES = ['home','patients','conversation','editor','formulas','prescriptions','followup','simulator','science','docs','settings'];
const pageFromUrl = () => { const page = decodeURIComponent(location.hash.replace(/^#\//,'')); return VALID_PAGES.includes(page) ? page : 'home'; };
const ui = { page:pageFromUrl(), patientId:null, visitId:null, notices:[], search:'', toastTimer:0, doc:'prescription' };
const anonymousResearch={chat:[],currentDraftId:null};
const examSession={patientId:null,items:[]}; // seleção temporária, não persiste
const aiSession={ready:false,checked:false,busy:false,consensusReady:false,indexReady:false,message:'Servidor de IA ainda não conectado.'};
const scienceCheck={busy:false,diagnostics:null,error:null,lastCheck:null,searchBusy:false,searchQuery:'',libraryResults:null,searchError:null};
const anvisaImport={
  busy:false,activeId:null,error:null,latest:null,records:[],coverage:[],checked:false,batchReport:[]
};
const officialAnvisaDocuments=[
  ['fb8-volume-i','Farmacopeia Brasileira — Volume I','Métodos e textos gerais',true],
  ['fb8-volume-ii-dispositivos','Farmacopeia — Vol. II: Dispositivos médicos','Monografias de dispositivos',false],
  ['fb8-volume-ii-gases','Farmacopeia — Vol. II: Gases medicinais','Monografias de gases',false],
  ['fb8-volume-ii-hemocomponentes','Farmacopeia — Vol. II: Hemoderivados','Hemocomponentes e hemoderivados',false],
  ['fb8-volume-ii-insumos','Farmacopeia — Vol. II: Insumos e especialidades','Matérias-primas farmacêuticas',false],
  ['fb8-volume-ii-plantas','Farmacopeia — Vol. II: Plantas medicinais','Monografias vegetais',true],
  ['fb8-volume-ii-biologicos','Farmacopeia — Vol. II: Produtos biológicos','Monografias biológicas',false],
  ['fb8-volume-ii-radiofarmacos','Farmacopeia — Vol. II: Radiofármacos','Monografias de radiofármacos',false],
  ['fn3-2026','Formulário Nacional — 3ª edição','133 monografias',true],
  ['fffb3-2026','Formulário de Fitoterápicos — 3ª edição','85 espécies; 236 formulações',true]
];
async function refreshAnvisaIngestions(){
 if(!aiSession.indexReady)return;
 try{
  const response=await fetch('/api/science/anvisa-ingestions',{credentials:'same-origin'});
  const result=await response.json();
  anvisaImport.records=Array.isArray(result.records)?result.records:[];
  const check=await fetch('/api/science/anvisa-coverage',{credentials:'same-origin'});
  if(check.ok){const data=await check.json();anvisaImport.coverage=Array.isArray(data.coverage)?data.coverage:[]}
 }catch(_){anvisaImport.error='Não foi possível consultar o andamento dos compêndios.'}
 finally{anvisaImport.checked=true;render()}
}
async function prepareAnvisaBatch(){
 if(anvisaImport.busy||!aiSession.indexReady)return;
 if(!confirm('Tentar obter três PDFs públicos Anvisa 2026? O volume de plantas requer divisão por partes. O conteúdo ficará pendente de revisão.'))return;
 anvisaImport.busy=true;anvisaImport.error=null;anvisaImport.batchReport=[];
 render();
 const publicIds=officialAnvisaDocuments.filter(x=>x[3]&&x[0]!=='fb8-volume-ii-plantas').map(x=>x[0]);
 for(const id of publicIds){
  anvisaImport.activeId=id;render();
  try{
   const res=await fetch('/api/science/ingest-anvisa',{
    method:'POST',credentials:'same-origin',
    headers:{'content-type':'application/json'},
    body:JSON.stringify({id})
   });
   const result=await res.json();
   anvisaImport.batchReport.push({id,ok:res.ok,text:res.ok?
    String(result.sections||0)+' trechos extraídos para revisão':
    String(result.error||'Falha').slice(0,180)});
  }catch(_){anvisaImport.batchReport.push({id,ok:false,text:'Servidor indisponível nesta tentativa'})}
 }
 anvisaImport.busy=false;anvisaImport.activeId=null;
 try{
  const response=await fetch('/api/science/anvisa-ingestions',{credentials:'same-origin'});
  const data=await response.json();
  anvisaImport.records=Array.isArray(data.records)?data.records:[];
 }catch(_){}
 render();
}
async function uploadAnvisaParts(fileList){
 if(anvisaImport.busy||!aiSession.indexReady)return;
 const files=Array.from(fileList||[]);
 const manifestFile=files.find(x=>x.name==='manifesto-anvisa.json');
 if(!manifestFile){toast('Selecione manifesto-anvisa.json e todos os PDFs das partes.');return}
 let manifest,ordered;
 try{
  if(manifestFile.size>1024*1024)throw Error('Manifesto acima de 1 MB');
  manifest=JSON.parse(await manifestFile.text());
  if(manifest.schema!=='lifemag-anvisa-parts-v1'||
    !officialAnvisaDocuments.some(x=>x[0]===manifest.catalogId)||
    !/^[a-f0-9]{64}$/i.test(String(manifest.originalSha256||''))||
    !Number.isSafeInteger(manifest.totalPages)||manifest.totalPages<1||
    !Number.isSafeInteger(manifest.totalParts)||manifest.totalParts<1||manifest.totalParts>500||
    !Array.isArray(manifest.parts)||manifest.parts.length!==manifest.totalParts)
   throw Error('Manifesto inválido para catálogo Anvisa 2026');
  const pdfs=new Map(files.filter(x=>x.name.toLowerCase().endsWith('.pdf')).map(x=>[x.name,x]));
  if(pdfs.size!==manifest.totalParts)throw Error('Faltam PDFs correspondentes ao manifesto');
  ordered=manifest.parts.slice().sort((a,b)=>a.partNumber-b.partNumber);
  let page=1;
  for(let i=0;i<ordered.length;i++){
   const p=ordered[i],file=pdfs.get(p.filename);
   if(!file||p.partNumber!==i+1||p.partCount!==manifest.totalParts||
      p.pageStart!==page||!Number.isSafeInteger(p.pageEnd)||p.pageEnd<page||
      p.totalPages!==manifest.totalPages||file.size!==p.pdfBytes||
      file.size>40*1024*1024||!/^[a-f0-9]{64}$/i.test(String(p.pdfSha256||'')))
    throw Error('Arquivo ausente ou página inválida: '+String(p.filename));
   page=p.pageEnd+1;
  }
  if(page!==manifest.totalPages+1)throw Error('Manifesto não cobre todas as páginas');
 }catch(error){anvisaImport.error=String(error?.message||error).slice(0,230);render();return}
 if(!confirm('Importar '+manifest.totalParts+' partes e '+manifest.totalPages+
 ' páginas para revisão? Nenhuma dose será validada automaticamente.'))return;
 anvisaImport.busy=true;anvisaImport.activeId=manifest.catalogId;
 anvisaImport.error=null;anvisaImport.batchReport=[];render();
 try{
  for(const p of ordered){
   const file=files.find(f=>f.name===p.filename);
   const bytes=await file.arrayBuffer();
   const digest=await crypto.subtle.digest('SHA-256',bytes);
   const sha=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
   if(sha!==String(p.pdfSha256).toLowerCase())throw Error('SHA-256 divergente: '+p.filename);
   const body=new FormData();
   body.append('id',manifest.catalogId);body.append('file',file,file.name);
   for(const [k,v] of Object.entries({
     partNumber:p.partNumber,partCount:p.partCount,pageStart:p.pageStart,
     pageEnd:p.pageEnd,totalPages:p.totalPages,originalSha256:manifest.originalSha256,
     pdfSha256:p.pdfSha256
   }))body.append(k,String(v));
   const res=await fetch('/api/science/upload-anvisa-pdf',{
    method:'POST',credentials:'same-origin',body
   });
   const result=await res.json();
   if(!res.ok)throw Error('Parte '+p.partNumber+'/'+manifest.totalParts+': '+
    String(result.error||'Falha na conversão'));
   anvisaImport.batchReport.push({id:p.filename,ok:true,
    text:String(result.sections||0)+' trechos, páginas '+p.pageStart+'-'+p.pageEnd});
   render();
  }
  toast('Partes extraídas; conferir cobertura e revisar antes de usar clinicamente.');
 }catch(error){anvisaImport.error=String(error?.message||error).slice(0,250)}
 finally{
  anvisaImport.busy=false;anvisaImport.activeId=null;
  await refreshAnvisaIngestions();render();
 }
}

async function uploadAnvisaDocument(id,file){
 if(anvisaImport.busy||!officialAnvisaDocuments.some(x=>x[0]===id))return;
 if(!file||!file.name.toLowerCase().endsWith('.pdf')){toast('Selecione um PDF oficial');return}
 if(file.size>46*1024*1024){toast('O PDF ultrapassa 46 MiB. Divida o volume antes de enviar.');return}
 if(!confirm('Converter este PDF oficial e guardar o texto em quarentena científica para revisão?'))return;
 anvisaImport.busy=true;anvisaImport.activeId=id;
 anvisaImport.error=null;anvisaImport.latest=null;render();
 try{
  const data=new FormData();data.append('id',id);data.append('file',file,file.name);
  const res=await fetch('/api/science/upload-anvisa-pdf',{
   method:'POST',credentials:'same-origin',body:data});
  const result=await res.json();
  if(!res.ok)throw Error(String(result.error||'Falha ao converter PDF'));
  anvisaImport.latest=result;
  toast('PDF recebido: '+String(result.sections||0)+' trechos aguardando revisão.');
 }catch(error){anvisaImport.error=String(error?.message||'Erro de importação').slice(0,250)}
 finally{
  anvisaImport.busy=false;anvisaImport.activeId=null;
  try{
    const res=await fetch('/api/science/anvisa-ingestions',{credentials:'same-origin'});
    const data=await res.json();anvisaImport.records=Array.isArray(data.records)?data.records:[];
  }catch(_){}
  render();
 }
}
async function ingestAnvisaDocument(id){
 if(anvisaImport.busy||!officialAnvisaDocuments.some(x=>x[0]===id))return;
 if(!confirm('Preparar a extração do PDF oficial de 2026? O arquivo ficará em biblioteca privada aguardando revisão profissional, sem liberar doses automaticamente.'))return;
 anvisaImport.busy=true;anvisaImport.activeId=id;
 anvisaImport.error=null;anvisaImport.latest=null;render();
 try{
  const response=await fetch('/api/science/ingest-anvisa',{
   method:'POST',credentials:'same-origin',
   headers:{'content-type':'application/json'},
   body:JSON.stringify({id})
  });
  const result=await response.json();
  if(!response.ok)throw Error(String(result.error||'A extração não pôde ser concluída'));
  anvisaImport.latest=result;
  toast('Documento preparado em '+String(result.sections||0)+' trechos. Revisão pendente.');
 }catch(error){anvisaImport.error=String(error?.message||'Falha de importação').slice(0,250)}
 finally{
  anvisaImport.busy=false;anvisaImport.activeId=null;
  try{
   const res=await fetch('/api/science/anvisa-ingestions',{credentials:'same-origin'});
   const data=await res.json();anvisaImport.records=Array.isArray(data.records)?data.records:[];
  }catch(_){}
  render();
 }
}

async function initializeScientificAssistant(){
  // A versão GitHub Pages não possui backend: nunca envia dados para uma URL externa.
  if(location.protocol!=='https:'||!location.hostname||location.hostname.endsWith('.github.io'))return;
  try{
    const res=await fetch('/api/capabilities',{credentials:'same-origin',headers:{accept:'application/json'}});
    const info=await res.json();
    aiSession.ready=Boolean(res.ok&&info.authenticated&&info.ready);
    aiSession.consensusReady=Boolean(res.ok&&info.consensus==='key_configured');
    aiSession.indexReady=Boolean(res.ok&&['binding_configured','durable_sqlite_configured'].includes(info.internalScienceIndex));
    aiSession.message=aiSession.ready?'Motor habilitado. A recuperação das fontes e a geração serão verificadas a cada consulta.':'Serviço de IA ainda indisponível.';
  }catch(_){aiSession.message='Não foi possível verificar a conexão com a IA.'}
  aiSession.checked=true;
  if(ui.page==='conversation')render();
}
function allowedScientificReference(item){
  if(!item||typeof item.url!=='string')return false;
  try{
    const url=new URL(item.url);
    const hosts=new Set(['pubmed.ncbi.nlm.nih.gov','www.ncbi.nlm.nih.gov',
      'www.gov.br','gov.br','www.who.int','who.int','www.anvisa.gov.br','anvisa.gov.br',
      'consensus.app','www.consensus.app','doi.org','www.doi.org',
      'bibliotecadigital.anvisa.gov.br','bvsms.saude.gov.br']);
    return url.protocol==='https:'&&hosts.has(url.hostname);
  }catch(_){return false}
}
async function sendScientificQuestion(v,question,useConsensus=false){
  if(!aiSession.ready||aiSession.busy)return false;
  aiSession.busy=true;render();
  try{
    // Apenas mensagem digitada pelo farmacêutico. NÃO enviar fichas, nomes ou cadastros.
    // Rascunhos anônimos podem retomar uma discussão sobre a mesma composição,
    // sem enviar nomes, dados de cadastro, prontuários ou arquivos.
    const activeCase=v===anonymousResearch?(data.anonymousDrafts||[])
      .find(d=>d.id===v.currentDraftId):null;
    const context=activeCase?
      '\nComposição anônima anterior, NÃO validada: '+
      activeCase.ingredients.slice(0,10).map(x=>x.name+' '+x.dose+' '+x.unit).join('; ')+
      '. Forma: '+activeCase.presentation+'. Proposta anterior: '+activeCase.formulaName+
      '. Avalie novamente toda a segurança e evidência para a dúvida seguinte.':'';
    const questionWithContext=(question.slice(0,1800)+context.slice(0,650)).slice(0,2450);
    const response=await fetch('/api/assist',{method:'POST',credentials:'same-origin',
      headers:{'content-type':'application/json','accept':'application/json'},
      body:JSON.stringify({question:questionWithContext,useConsensus:useConsensus&&aiSession.consensusReady})});
    const result=await response.json();
    if(!response.ok)throw Error(String(result.error||'Pesquisa indisponível'));
    if(!result.requiresProfessionalReview||!Array.isArray(result.sources)||typeof result.answer!=='string')
      throw Error('Resposta incompleta. A análise não será registrada.');
    v.chat.push({id:uid('msg'),role:'assistant',text:result.answer.slice(0,16000),
      sources:result.sources.filter(allowedScientificReference).slice(0,8),
      draft:result.draft&&typeof result.draft==='object'?result.draft:null,
      createdAt:new Date().toISOString(),requiresProfessionalReview:true});
    if(v!==anonymousResearch)persist();
    toast('Resposta recebida. Verifique as fontes e revise clinicamente.');
    return true;
  }catch(error){
    const reason=String(error?.message||'Serviço científico indisponível').slice(0,160);
    if(v===anonymousResearch)v.chat.push({id:uid('msg'),role:'assistant',text:'A consulta não foi concluída: '+reason,sources:[]});
    toast(reason);return false;
  }
  finally{aiSession.busy=false;render()}
}

// A IA não assina nem libera prescrições. O farmacêutico escolhe importar um
// rascunho rastreável para revisão manual no Studio Magistral.
function importFormulaDraft(message){
  const v=visit(),d=message?.draft;
  if(!v||!d||d.decision!=='draft'||!Array.isArray(d.ingredients)||!d.ingredients.length||
      d.ingredients.some(x=>!x.dose_supported)||d.missing_information?.length||d.red_flags?.length){
    toast('Rascunho não elegível: confirme dados clínicos e doses antes de importar.');
    return;
  }
  if(v.ingredients.length&&!confirm('Substituir a composição atual por este rascunho da IA? A versão anterior será preservada no histórico.'))return;
  v.revisions.push({savedAt:new Date().toISOString(),origin:'before_ai_draft_import',
    ingredients:JSON.parse(JSON.stringify(v.ingredients)),formulaName:v.formulaName,posology:v.posology});
  v.formulaName=String(d.formula_name||'Proposta magistral');
  v.presentation=String(d.pharmaceutical_form||'');
  v.quantity=String(d.quantity||'');
  v.route=String(d.route||'');
  v.posology=String(d.posology||'');
  v.schedules=String(d.daily_schedule||'');
  v.meals=String(d.meal_relation||'');
  if(Number.isInteger(d.initial_duration_days)&&d.initial_duration_days>0)
    v.duration=d.initial_duration_days;
  v.observations=[
    'Rascunho para revisão — não é receita emitida.',
    d.extension_criteria?'Critérios de extensão: '+d.extension_criteria:'',
    (d.monitoring||[]).length?'Monitoramento: '+d.monitoring.join('; '):'',
    (d.interactions||[]).length?'Interações a verificar: '+d.interactions.join('; '):'',
    (d.contraindications||[]).length?'Contraindicações a verificar: '+d.contraindications.join('; '):''
  ].filter(Boolean).join('\n');
  v.ingredients=d.ingredients.map(x=>({
    id:uid('ing'),name:String(x.name||''),
    dose:String(x.dose_value||''),unit:String(x.dose_unit||'mg'),
    role:String(x.role||'OPCIONAL'),
    target:String(x.rationale||''),
    evidence:'Trechos recuperados: '+(x.references||[]).map(ref=>'['+ref+']').join(', ')+
      '. Dose textual encontrada, ainda requer verificação individual.'
  }));
  v.aiDraftPendingReview=true;
  v.aiDraftImportedAt=new Date().toISOString();
  persist();
  setPage('editor');
  toast('Rascunho importado. Revise composição, doses, posologia e interações.');
}

const persist = () => { try{writeStore(data);}catch(e){toast('Não foi possível salvar no navegador.');}};
const patient = () => data.patients.find(p=>p.id===ui.patientId) || null;
const visit = () => data.visits.find(v=>v.id===ui.visitId) || null;
const patientFor = v => data.patients.find(p=>p.id===v.patientId)||null;
const latestVisits = () => [...data.visits].sort((a,b)=>(b.date||'').localeCompare(a.date||''));
const getAlerts=()=>data.visits.filter(v=>v.duration && v.startDate && daysUntil(alertDate(v))<=0 && daysUntil(endDate(v))>=-2 && v.status!=='finalizado').sort((a,b)=>alertDate(a).localeCompare(alertDate(b)));
const navTop=[['home','Visão geral','home'],['patients','Pacientes','patients'],['conversation','Conversa inteligente','sparkles'],['editor','Studio Magistral','edit'],['formulas','Minhas fórmulas','files'],['prescriptions','Receituário','prescription']];
const navBottom=[['followup','Acompanhar','bell'],['conversation','IA','sparkles'],['science','Ciência','science'],['docs','Documentos','files']];
const renderBrand=()=>`<div class="brandline"><img class="logo-image" src="${IMG}" alt="Ícone oficial LifeMag IA"><div><div class="brandname">Life<em>Mag</em> <span>IA</span></div><div class="brandsub">Prescrição Magistral Inteligente</div></div></div>`;
function toast(message){let node=document.querySelector('.toast');if(node)node.remove();node=document.createElement('div');node.className='toast';node.textContent=message;document.body.appendChild(node);clearTimeout(ui.toastTimer);ui.toastTimer=setTimeout(()=>node.remove(),3100);}
function setPage(next){
  if(!VALID_PAGES.includes(next)) return;
  if(ui.page!==next) history.pushState({lifemagPage:next},'', '#/'+next);
  ui.page=next;
  render();
  scrollTo(0,0);
  // Ao entrar na Central Científica, consulta automaticamente as fontes (sem gasto de IA).
  if(next==='science'&&aiSession.ready&&!scienceCheck.lastCheck&&!scienceCheck.busy)
    void checkScientificServices('sources');
  if(next==='science'&&aiSession.indexReady&&!anvisaImport.checked)
    void refreshAnvisaIngestions();
}
function useVisit(v){ui.visitId=v.id;ui.patientId=v.patientId;}
function startVisit(pid){if(!pid){toast('Cadastre ou selecione um paciente antes de começar.');setPage('patients');return;}const v={id:uid('at'),patientId:pid,date:yyyyMmDd(),startDate:yyyyMmDd(),assessment:emptyClinicalAssessment(),duration:15,status:'em acompanhamento',formulaName:'Nova formulação',presentation:'Cápsulas',route:'Oral',quantity:'',posology:'',schedules:'',meals:'',observations:'',protocol:'',ingredients:[],chat:[],revisions:[]};data.visits.push(v);persist();useVisit(v);setPage('conversation');toast('Atendimento criado. Descreva a necessidade clínica.');}
function pageLabel(){return {home:'Início',patients:'Pacientes',conversation:'Conversa Inteligente',editor:'Studio Magistral',formulas:'Minhas fórmulas',prescriptions:'Receituário',followup:'Acompanhamento',simulator:'Simulador',science:'Central Científica',docs:'Documentos',settings:'Configurações'}[ui.page]||'LifeMag IA';}
function layout(){const count=getAlerts().length;return `<div class="app-shell ${ui.page==='home'?'is-home':''}">
<aside class="side">${renderBrand()}<div class="side-label">ESPAÇO CLÍNICO</div><nav aria-label="Navegação principal">${navTop.map(([p,label,ic])=>`<button class="nav-item ${p===ui.page?'active':''}" data-page="${p}">${I(ic)} ${label}</button>`).join('')}</nav><div class="side-label">FERRAMENTAS ESPECIALIZADAS</div><nav aria-label="Ferramentas">${navBottom.map(([p,label,ic])=>`<button class="nav-item ${p===ui.page?'active':''}" data-page="${p}">${I(ic)} ${label}${p==='followup'&&count?` <span class="badge warn">${count}</span>`:''}</button>`).join('')}<button class="nav-item ${ui.page==='simulator'?'active':''}" data-page="simulator">${I('compare')} Simulador</button><button class="nav-item ${ui.page==='settings'?'active':''}" data-page="settings">${I('settings')} Configurações</button></nav><div class="side-footer">${I('shield',16)} <strong>Protótipo de desenvolvimento</strong><br>Utilize apenas dados fictícios. Sem proteção de prontuários ou validação clínica.</div></aside>
<main class="main"><header class="topbar"><div class="mobile-brand">${renderBrand()}</div><span class="kicker">PAINEL CLÍNICO / ${E(pageLabel())}</span><div class="top-actions"><span class="badge neutral">v0.3.0</span><button class="round-icon" data-page="followup" aria-label="Acompanhamentos">${I('bell')}${count?`<span class="count-dot">${count}</span>`:''}</button><button class="round-icon" data-page="settings" aria-label="Foto e dados profissionais">${professionalPhotoSrc()?`<img class="profile-mini" src="${professionalPhotoSrc()}" alt="" />`:I('settings')}</button></div></header>${pageContent()}</main></div>
<nav class="bottomnav" aria-label="Navegação principal e ferramentas"><button class="${ui.page==='home'?'active':''}" data-page="home" aria-label="Voltar ao início">${I('home')}<span>Início</span></button>${navBottom.map(([p,label,ic])=>`<button class="${p===ui.page?'active':''} ${p==='conversation'?'ai-center':''}" data-page="${p}" ${p==='conversation'?'aria-label="Abrir Conversa Inteligente"':''}>${p==='conversation'?`<span class="ai-orb">${I('sparkles',29)}</span>`:I(ic)}<span>${label}</span></button>`).join('')}</nav>`;}
function pageHeader(title,desc,right=''){return `<div class="pageheader"><div><h1>${title}</h1><p>${desc}</p></div><div>${right}</div></div>`;}
function empty(title,desc,iconName='info'){return `<div class="empty">${I(iconName,32)}<strong>${E(title)}</strong><br>${E(desc)}</div>`;}
function professionalPhotoSrc() {
  const photo = data.settings?.photoData;
  return typeof photo === 'string' && /^data:image\/jpeg;base64,[a-z0-9+/=]+$/i.test(photo) ? photo : '';
}
function professionalPortrait() {
  const src = professionalPhotoSrc();
  return src
    ? `<img class="professional-portrait" src="${src}" alt="Foto do farmacêutico" />`
    : `<span class="professional-portrait portrait-placeholder" aria-label="Foto não configurada">${I('patients',34)}</span>`;
}
function home() {
  const due=getAlerts(), info=data.settings;
  const prof=E(info.professional||'Profissional farmacêutico');
  return `<div class="home-intro"><section class="welcome-panel" aria-label="Identificação do farmacêutico">
    <button class="portrait-button" type="button" data-page="settings" aria-label="Adicionar ou alterar foto profissional">${professionalPortrait()}</button>
    <div class="welcome-name"><strong>${prof}</strong><span>${E(info.role||'Farmacêutico Clínico')} · ${E(info.crf||'')}</span></div>
    <button class="welcome-notifications" type="button" data-page="followup" aria-label="Ver acompanhamentos">${I('bell',25)}${due.length?`<span class="count-dot">${due.length}</span>`:''}</button>
  </section>
  <section class="home-brand-banner"><div class="home-brand-main">${renderBrand()}<h1>Bem-vindo(a), ${prof}!</h1><p>Ciência, segurança e precisão para uma prescrição magistral mais eficiente e baseada em evidências.</p></div>
  <div class="tilegrid" aria-label="Acesso rápido">
  ${[['sparkles','Nova formulação','Crie fórmulas com apoio do assistente','new-visit'],['patients','Pacientes','Cadastre e consulte os atendimentos','patients'],['files','Minhas fórmulas','Acesse e edite formulações salvas','formulas'],['prescription','Receituário','Gere e personalize receituários','prescriptions']].map(([ic,title,desc,act])=>`<button class="tile" ${act==='new-visit'?'data-action="new-visit"':`data-page="${act}"`}><span class="icon-bg">${act==='new-visit'?`<img src="${IMG}" class="tile-logo" alt="" />`:I(ic,27)}</span><strong>${title}</strong><span>${desc}</span><span class="tile-chevron" aria-hidden="true">${I('arrow',17)}</span></button>`).join('')}
  </div>
  <button class="science-banner" data-page="science" type="button"><span class="science-banner-icon">${I('science',26)}</span><span><strong>Baseada em evidências</strong><small>Fontes científicas e atualizações em um só lugar.</small></span>${I('arrow',21)}</button>
  </section></div>
  <div class="section-heading"><h2>Seu acompanhamento</h2><button class="btn compact" data-page="followup">Ver todos ${I('arrow',17)}</button></div>
  <div class="cols-2"><div class="panel"><div class="panel-title"><h3>Atendimentos recentes</h3><span class="pill">${data.visits.length} no protótipo</span></div>${data.visits.length?latestVisits().slice(0,4).map(v=>visitRow(v)).join(''):empty('Nenhum atendimento salvo','Cadastre um paciente fictício para começar.','calendar')}</div><div class="panel"><div class="panel-title"><h3>Alertas previstos</h3><span class="badge ${due.length?'warn':'ok'}">${due.length?due.length+' atenção':'Sem alertas'}</span></div>${due.length?due.slice(0,3).map(v=>alertRow(v)).join(''):empty('Nenhum alerta vencendo','Os lembretes serão calculados pela data real de início.','bell')}<div class="notice blue">${I('info',17)} Demonstração local. Ainda sem IA clínica ou notificações externas.</div></div></div>`;
}
function patientCard(p){const visits=data.visits.filter(v=>v.patientId===p.id).length;return `<div class="person-row ${ui.patientId===p.id?'active':''}"><div><strong>${E(p.name)}</strong><br><span>${E(p.phone||'Sem telefone')} · ${visits} atendimento(s)</span></div><button class="btn compact" data-select-patient="${p.id}">${I('edit',15)} Editar</button></div>`;}
function patients(){const p=patient();return pageHeader('Pacientes','Cadastre informações essenciais e mantenha o histórico associado ao paciente.',`<button class="btn primary" data-action="new-visit">${I('plus')} Novo atendimento</button>`)+`<div class="top-panels"><div class="panel"><h3>Lista de pacientes</h3><div class="field"><label>Buscar pelo nome ou telefone</label><input id="patient-filter" value="${E(ui.search)}" placeholder="Buscar..." /></div><div class="menu-rows" id="patient-results" style="margin-top:13px">${data.patients.filter(x=>(x.name+' '+x.phone).toLowerCase().includes(ui.search.toLowerCase())).map(patientCard).join('')||empty('Nenhum paciente','Use o formulário para cadastrar.')}</div></div>
<div class="panel"><div class="panel-title"><h3>${p?'Cadastro selecionado':'Novo cadastro'}</h3>${p?`<button class="btn compact" data-action="clear-patient">Novo</button><button class="btn compact danger" data-action="delete-patient">Excluir cadastro</button>`:''}</div><form id="patient-form"><div class="form-grid">${field('name','Nome completo',p?.name||'',true)}${field('phone','Telefone',p?.phone||'',true,'tel')}${field('dob','Data de nascimento',p?.dob||'',false,'date')}${field('address','Endereço do paciente',p?.address||'')}${field('weight','Peso (kg)',p?.weight||'',false,'number')}${field('height','Altura (cm)',p?.height||'',false,'number')}<div class="field full"><label for="patient-notes">Observações gerais do cadastro (dados fictícios)</label><textarea id="patient-notes" name="notes" placeholder="Informações gerais; a avaliação clínica é preenchida a cada atendimento.">${E(p?.notes||'')}</textarea></div></div><div class="form-actions"><button class="btn primary" type="submit">${I('check')} ${p?'Salvar alterações':'Cadastrar paciente'}</button></div></form>${p?`<div class="form-actions clinical-start"><button class="btn primary" type="button" data-action="new-visit">${I('plus')} Iniciar avaliação clínica</button></div><hr class="divider"><h3>Atendimentos desse paciente</h3>${data.visits.filter(v=>v.patientId===p.id).map(visitRow).join('')||'<p class="muted small">Ainda não há atendimentos.</p>'}`:''}<div class="exam-selection"><h3>Exames e documentos (opcionais)</h3><p class="muted small">Escolha PDF ou imagem da biblioteca, ou tire uma foto. Nesta etapa a seleção é temporária: nenhum exame é salvo ou enviado. A vinculação definitiva exige armazenamento clínico protegido.</p><div class="btnrow"><label class="btn compact exam-picker">Biblioteca / arquivos<input id="patient-exam-gallery" type="file" accept="application/pdf,image/jpeg,image/png,image/heic,image/heif" multiple></label><label class="btn compact exam-picker">Tirar foto<input id="patient-exam-camera" type="file" accept="image/*" capture="environment"></label></div>${(examSession.patientId===p?.id||(!p&&examSession.patientId===null))&&examSession.items.length?'<p class="muted small" role="status">Pré-seleção temporária: '+examSession.items.map(x=>E(x.name)+' ('+Math.ceil(x.bytes/1024)+' KB)').join('; ')+'</p>':''}<p class="muted small">Os exames são opcionais e nunca bloqueiam o cadastro ou atendimento.</p></div><div class="notice blue">Somente demonstração com dados fictícios. Nenhum cadastro é importado de outro sistema.</div></div></div>`;}
function field(name,label,val='',required=false,type='text'){return `<div class="field"><label for="${name}">${label}${required?' *':''}</label><input id="${name}" name="${name}" type="${type}" ${type==='number'?'step="any"':''} value="${E(val)}" ${required?'required':''}></div>`;}
function visitRow(v){const p=patientFor(v);return `<div class="listline"><div><strong>${E(p?.name||'Paciente excluído')}</strong><p>${I('calendar',12)} ${fmtDate(v.date)} · ${E(p?.phone||'Sem telefone')} · ${E(v.formulaName||'Rascunho')}</p></div><div class="visit-actions"><button class="btn compact" data-review-visit="${v.id}">Avaliação</button><button class="btn compact" data-open-visit="${v.id}">Fórmula ${I('arrow',14)}</button></div></div>`;}
function alertRow(v){const p=patientFor(v),remain=daysUntil(endDate(v));return `<div class="listline"><div><strong>${E(p?.name||'Paciente')}</strong><p>${fmtDate(v.date)} · ${E(p?.phone||'—')} · Término ${fmtDate(endDate(v))}</p><span class="badge warn">${remain<0?'Reavaliação pendente':remain===0?'Termina hoje':remain+' dias restantes'}</span></div><button class="btn compact" data-open-visit="${v.id}">Abrir</button></div>`;}
function pickVisit(){const v=visit();return !v?`<div class="notice blue">Selecione um atendimento em <button class="btn compact" data-page="formulas">Minhas fórmulas</button> ou comece em <button class="btn compact" data-page="patients">Pacientes</button>.</div>`:'';}
function clinicalField(name,label,value,hint=''){return `<div class="field full"><label for="clinical-${name}">${label}</label><textarea id="clinical-${name}" name="${name}" rows="3" maxlength="5000" ${hint?`placeholder="${E(hint)}"`:''}>${E(value||'')}</textarea></div>`;}
function assessmentPanel(v){const a=normalizeClinicalAssessment(v.assessment);return `<details class="clinical-assessment panel" open><summary>Ficha de avaliação clínica — atendimento de ${fmtDate(v.date)}</summary><div class="notice blue">Preenchimento manual pelo farmacêutico. Esta versão aceita somente dados fictícios e não realiza diagnóstico automático.</div><form id="assessment-form"><div class="form-grid">${clinicalField('chiefComplaint','Motivo da consulta e objetivo clínico',a.chiefComplaint,'Descreva a necessidade apresentada')}${clinicalField('symptoms','Sintomas, duração e evolução',a.symptoms)}${clinicalField('clinicalHistory','Histórico e condições clínicas',a.clinicalHistory)}${clinicalField('medications','Medicamentos em uso',a.medications,'Inclua doses quando conhecidas')}${clinicalField('allergies','Alergias e reações adversas',a.allergies,'Informe não relatado, se for o caso')}${clinicalField('labResults','Exames e resultados relevantes',a.labResults)}${clinicalField('riskFactors','Contraindicações, restrições e fatores de risco',a.riskFactors)}${clinicalField('followUpPlan','Conduta planejada e reavaliação',a.followUpPlan)}</div><div class="form-actions"><button class="btn primary" type="submit">${I('check')} Salvar avaliação</button><button class="btn" type="button" data-page="editor">Abrir Studio Magistral ${I('arrow',16)}</button></div></form></details>`;}
function clinicalAssessmentSummary(v){const a=normalizeClinicalAssessment(v.assessment);return `<div class="clinical-summary"><p><strong>Objetivo:</strong> ${E(a.chiefComplaint||'Não informado')}</p><p><strong>Medicamentos:</strong> ${E(a.medications||'Não informado')}</p><p><strong>Alergias:</strong> ${E(a.allergies||'Não informado')}</p><p><strong>Riscos:</strong> ${E(a.riskFactors||'Não informado')}</p><button class="btn compact" type="button" data-page="conversation">Revisar avaliação clínica</button></div>`;}

function renderAnonymousDrafts(){
  const items=Array.isArray(data.anonymousDrafts)?data.anonymousDrafts:[];
  if(!items.length)return '';
  return '<section class="panel anonymous-drafts" aria-label="Rascunhos anônimos">'+
    '<h3>Rascunhos de formulações sem cadastro</h3>'+
    '<p class="muted small">Identifique apenas como Caso 01, Caso 02 etc. Não registre nomes ou exames reais neste armazenamento demonstrativo.</p>'+
    items.map(d=>'<div class="draft-list-item"><div><strong>'+E(d.label)+'</strong><p>'+
      E(d.formulaName)+' · '+E(String(d.ingredients?.length||0))+' substância(s)'+
      (d.linkedPatientId?' · já vinculado a cadastro demonstrativo':' · sem paciente')+'</p></div>'+
      '<div class="draft-buttons"><button type="button" class="btn compact" data-open-anon-draft="'+E(d.id)+'">Reabrir na IA</button>'+
      (d.linkedPatientId?'':(data.patients.length?
        '<select aria-label="Vincular a paciente de demonstração" data-draft-patient="'+E(d.id)+'">'+
        '<option value="">Selecionar paciente...</option>'+
        data.patients.map(p=>'<option value="'+E(p.id)+'">'+E(p.name)+'</option>').join('')+
        '</select><button type="button" class="btn compact" data-link-anon-draft="'+E(d.id)+'">Vincular e revisar</button>':
        '<button type="button" class="btn compact" data-page="patients">Cadastrar paciente</button>'))+
      '<button type="button" class="btn compact danger" data-delete-anon-draft="'+E(d.id)+'">Excluir</button></div></div>').join('')+'</section>';
}
function saveAnonymousCase(messageId){
  const message=anonymousResearch.chat.find(m=>m.id===messageId);
  if(!message?.draft){toast('A IA ainda não produziu um rascunho estruturado.');return}
  const count=(data.anonymousDrafts||[]).length+1;
  const label=prompt('Código do rascunho sem nome real (ex.: Caso 01):','Caso '+String(count).padStart(2,'0'));
  if(label===null)return;
  if(!/^Caso(?:\s|-)[0-9]{1,6}(?:-[A-Z])?$/i.test(String(label).trim())){
    toast('Use um código como Caso 01, sem nome ou identificação de paciente.');return
  }
  const d=createAnonymousFormulaDraft(data,message.draft,label,message.sources);
  if(!d){toast('Não foi possível salvar a proposta.');return}
  anonymousResearch.currentDraftId=d.id;
  persist();render();
  toast('Rascunho anônimo salvo para continuar ou vincular depois.');
}
function openAnonymousCase(draftId){
  const draft=(data.anonymousDrafts||[]).find(d=>d.id===draftId);
  if(!draft)return;
  anonymousResearch.currentDraftId=draft.id;
  ui.visitId=null;
  const details=[
    'Rascunho salvo: '+draft.label,
    'Formulação: '+draft.formulaName,
    ...draft.ingredients.map(x=>'• '+x.name+' '+x.dose+' '+x.unit+' ['+x.role+']'),
    'Posologia registrada: '+(draft.posology||'a definir'),
    'Duração prevista: '+(draft.duration||'a definir')+' dias',
    'Revisão profissional ainda necessária.'
  ].join('\n');
  anonymousResearch.chat=[{id:uid('msg'),role:'assistant',text:details,sources:draft.sources||[]}];
  setPage('conversation');
}
function linkAnonymousCase(draftId){
  const select=document.querySelector('[data-draft-patient="'+draftId+'"]');
  const patientId=select?.value;
  if(!patientId){toast('Selecione primeiro um paciente cadastrado.');return}
  if(!confirm('Vincular este rascunho ao cadastro demonstrativo selecionado? A revisão profissional continuará obrigatória.'))return;
  const v=linkAnonymousDraftToPatient(data,draftId,patientId);
  if(!v){toast('Não foi possível vincular o rascunho.');return}
  useVisit(v);
  persist();setPage('editor');
}
function deleteAnonymousCase(draftId){
  const record=(data.anonymousDrafts||[]).find(d=>d.id===draftId);
  if(!record)return;
  if(!confirm('Excluir definitivamente o rascunho '+record.label+'? Esta ação não apaga atendimentos já vinculados.'))return;
  data.anonymousDrafts=data.anonymousDrafts.filter(d=>d.id!==draftId);
  if(anonymousResearch.currentDraftId===draftId)anonymousResearch.currentDraftId=null;
  persist();render();
}
function deleteSelectedPatient(){
  const p=patient();
  if(!p)return;
  const count=data.visits.filter(v=>v.patientId===p.id).length;
  if(!confirm('EXCLUIR '+p.name+' e '+count+' atendimento(s) associado(s)? Essa exclusão é permanente neste protótipo.'))return;
  const result=deletePatientRecord(data,p.id);
  if(!result.deleted)return;
  for(const d of data.anonymousDrafts||[]){
    if(d.linkedPatientId===p.id){d.linkedPatientId=null;d.linkedVisitId=null}
  }
  ui.patientId=null;ui.visitId=null;
  if(examSession.patientId===p.id){examSession.patientId=null;examSession.items=[];}
  persist();render();toast('Cadastro e atendimentos demonstrativos excluídos.');
}

function scientificOnly(){
  const online=aiSession.ready;
  const indicator=online?'Motor de IA habilitado':'IA ainda indisponível';
  const history=anonymousResearch.chat.map(m=>{
    const label=m.role==='assistant'?'LIFEMAG IA — REVISÃO PROFISSIONAL':'FARMACÊUTICO';
    const sources=Array.isArray(m.sources)&&m.sources.length
      ?'<div class="chat-sources"><strong>Fontes recuperadas:</strong>'+
        m.sources.map(ref=>'<a target="_blank" rel="noopener noreferrer" href="'+E(ref.url)+'">'+E(ref.title||'PubMed')+'</a>').join('')+'</div>'
      :'';
    return '<article class="chat-bubble '+(m.role==='assistant'?'assistant':'user')+'"><div class="chat-label">'+label+'</div><div class="chat-text">'+E(m.text)+'</div>'+sources+(m.role==='assistant'&&m.draft?'<button type="button" class="btn compact" data-save-anon-draft="'+E(m.id)+'">Salvar proposta como rascunho anônimo</button>':'')+'</article>';
  }).join('');
  const disabled=aiSession.busy?'disabled':'';
  const submitLabel=aiSession.busy?'Consultando fontes...':I('send');
  return '<section class="research-page">'+
    pageHeader('Conversa Inteligente','Pesquisa científica integrada — sem cadastro de paciente.')+
    '<div class="panel research-panel">'+
    '<div class="research-title"><h3>O que deseja pesquisar?</h3>'+
    '<span class="research-indicator '+(online?'connected':'offline')+'">'+E(indicator)+'</span></div>'+
    '<p class="research-intro">Descreva o objetivo terapêutico e os dados clínicos anônimos disponíveis. A IA entregará primeiro uma proposta magistral estruturada, sujeita à revisão profissional.</p>'+
    '<form id="research-form" class="chat-input research-input">'+
    '<textarea name="message" maxlength="2500" rows="3" required placeholder="Ex.: Adulto de 35 anos, sem medicamentos e sem alergias conhecidas, com enxaqueca. Quais opções magistrais têm evidências e doses estudadas?"></textarea>'+
    '<button type="submit" class="btn primary" '+disabled+' aria-label="Gerar proposta de formulação baseada em evidências">'+submitLabel+'</button>'+
    '<label class="consensus-option"><input type="checkbox" name="useConsensus" value="on" '+(aiSession.consensusReady?'':'disabled')+'/> Incluir Consensus nesta consulta'+(aiSession.consensusReady?' (consome chamadas da cota)':' (API ainda não configurada)')+'</label></form>'+
    '<p class="research-privacy">Somente perguntas anônimas. Sem idade, medicamentos, alergias ou evidência suficiente, a IA deve indicar o que falta antes de liberar doses.</p>'+
    (history?'<div class="research-history" role="log" aria-live="polite">'+history+'</div>':'')+
    '</div>'+
    renderAnonymousDrafts()+
    '<details class="research-visits"><summary>Atendimentos e formulações (opcional)</summary>'+pickVisit()+'</details>'+
    '</section>';
}
function conversation(){const v=visit();if(!v)return scientificOnly();const p=patientFor(v);return pageHeader('Conversa Inteligente',`Paciente: ${E(p?.name||'—')} · Atendimento em ${fmtDate(v.date)}`,`<button class="btn primary" data-page="editor">${I('edit')} Abrir Studio Magistral</button>`)+assessmentPanel(v)+`<div class="cols-2" style="grid-template-columns:minmax(0,1.4fr) minmax(240px,.7fr)"><div class="panel"><div class="chat-shell clinical-chat"><div class="chat-bubble assistant"><div class="chat-label">ASSISTENTE LIFEMAG</div>Registre o objetivo clínico e as informações relevantes. ${aiSession.ready?'O serviço científico está conectado. Utilize apenas questões clínicas anônimas. As fontes recuperadas precisam de revisão farmacêutica.':'A integração com IA científica ainda não foi conectada nesta versão. Você pode criar e revisar a formulação manualmente no Studio Magistral.'}</div>${(v.chat||[]).map(m=>`<div class="chat-bubble ${m.role==='assistant'?'assistant':'user'}"><div class="chat-label">${m.role==='assistant'?'LIFEMAG IA — REVISÃO FARMACÊUTICA OBRIGATÓRIA':'FARMACÊUTICO'}</div><div class="chat-text">${E(m.text)}</div>${m.role==='assistant'&&Array.isArray(m.sources)&&m.sources.length?`<div class="chat-sources"><strong>Fontes científicas recuperadas:</strong>${m.sources.map(src=>`<a href="${E(src.url)}" target="_blank" rel="noopener noreferrer">${E(src.title||'Artigo PubMed')} — ${E(src.date||'')}</a>`).join('')}</div>`:''}${m.draft?.decision==='draft'&&m.draft?.ingredients?.length&&m.draft.ingredients.every(x=>x.dose_supported)&&!(m.draft.missing_information||[]).length?`<button type="button" class="btn compact" data-import-draft="${E(m.id)}">Levar proposta ao Studio Magistral (rascunho)</button>`:''}</div>`).join('')}<form class="chat-input" id="chat-form"><textarea name="message" required maxlength="2500" placeholder="${aiSession.ready?'Digite uma questão clínica ANÔNIMA, sem nome, CPF ou prontuário...':'Descreva objetivos fictícios; servidor científico ainda não conectado...'}"></textarea><button class="btn primary" type="submit" ${aiSession.busy?'disabled':''} aria-label="${aiSession.ready?'Consultar IA e PubMed':'Registrar observação'}">${aiSession.busy?'Analisando...':I('send')}</button></form></div></div>
<div class="panel"><h3>Atendimento atual</h3><div class="info-columns"><div class="stat"><b>${v.ingredients.length}</b><span>Substâncias</span></div><div class="stat"><b>${Number(v.duration)||'—'}</b><span>Dias</span></div><div class="stat"><b>${(v.revisions||[]).length}</b><span>Versões</span></div></div><div class="accent-band" style="margin-top:16px"><strong>Motor / Coadjuvante</strong><p class="muted small" style="margin:7px 0 0">A função clínica, alvo sintomático e evidências ficarão aqui e no editor — nunca no PDF da receita.</p></div><div class="notice">Nenhuma formulação terapêutica será inventada neste protótipo. Sugestões automatizadas dependerão de fontes, validação de interações e revisão profissional.</div><div class="btnrow"><button class="btn primary" data-page="editor">${I('plus')} Criar formulação</button><button class="btn" data-page="science">${I('science')} Fontes</button></div></div></div>`;}
function editor(){const v=visit();if(!v)return pageHeader('Studio Magistral','Editor de formulação com revisão profissional.')+pickVisit();const p=patientFor(v);const reviewNotice=v.aiDraftPendingReview?'<div class="notice blue"><strong>Rascunho importado da IA — revisão farmacêutica pendente.</strong><p>Confira composição, doses, interações, contraindicações, horários e quantidade antes de emitir qualquer documento.</p><button type="button" class="btn primary" data-action="confirm-ai-review">Confirmar revisão clínica concluída</button></div>':'';return reviewNotice+pageHeader('Studio Magistral',`${E(p?.name||'—')} · ${fmtDate(v.date)}`,`<div class="btnrow"><button class="btn subtle" data-page="conversation">${I('sparkles')} Voltar à conversa</button><button class="btn subtle" data-page="simulator">${I('compare')} Comparar versões</button></div>`)+`<div class="top-panels" style="grid-template-columns:minmax(0,1.4fr) minmax(280px,.8fr)"><div class="panel"><h3>Composição magistral</h3><form id="formula-form"><div class="form-grid">${field('formulaName','Nome da formulação',v.formulaName||'')}${field('presentation','Forma farmacêutica',v.presentation||'')}${field('quantity','Quantidade para manipular',v.quantity||'')}${field('route','Via de administração',v.route||'')}${field('posology','Posologia',v.posology||'')} ${field('schedules','Horários',v.schedules||'')}${field('meals','Relação com refeições',v.meals||'')}${field('duration','Duração do tratamento (dias)',v.duration||15,false,'number')}${field('date','Data do atendimento',v.date||yyyyMmDd(),false,'date')}${field('startDate','Data efetiva de início',v.startDate||v.date,false,'date')}<div class="field full"><label>Orientações adicionais (aparecem na receita)</label><textarea name="observations">${E(v.observations||'')}</textarea></div></div><hr class="divider"/><div class="panel-title"><h3>Substâncias e concentração</h3><button type="button" class="btn compact" data-action="add-ingredient">${I('plus')} Adicionar</button></div><div class="ingredients">${v.ingredients.length?v.ingredients.map(ingredientRow).join(''):empty('Fórmula vazia','Adicione ingredientes para começar.','science')}</div><div class="form-actions"><button type="submit" class="btn primary">${I('check')} Salvar formulação</button></div></form></div>
<div class="panel"><h3>Revisão clínica interna</h3>${clinicalAssessmentSummary(v)}<p class="muted small">Motor, coadjuvante, função por sintoma, riscos e evidências são campos internos e não entram no PDF.</p>${v.ingredients.length?v.ingredients.map(ing=>`<div class="source"><div class="row-between"><strong>${E(ing.name||'Ingrediente')}</strong><span class="badge">${E(ing.role||'Não classificado')}</span></div><p>${E(ing.target||'Alvo clínico ainda não informado.')}</p><p class="muted">${E(ing.evidence||'Evidência não registrada/validada.')}</p></div>`).join(''):empty('Sem análise','Cadastre os componentes e suas justificativas.')}<hr class="divider"/><h3>Protocolo complementar (opcional)</h3><div class="field"><label>Atividade física e hábitos alimentares — texto educativo</label><textarea id="protocol-text" rows="5" placeholder="Intensidade progressiva, preferências, alimentação saudável...">${E(v.protocol||'')}</textarea></div><button class="btn compact" data-action="save-protocol" style="margin-top:9px">Salvar protocolo</button><div class="notice blue">O PDF mantém apenas informações do paciente e prescrição; a análise MOTOR/COADJUVANTE é interna.</div></div></div>`;}
function ingredientRow(ing){return `<div class="ingredient-row" data-ingredient-id="${ing.id}"><div class="ingredient-header"><span class="badge ${ing.role==='MOTOR'?'ok':'neutral'}">${E(ing.role||'A definir')}</span><button type="button" class="btn compact danger" data-remove-ingredient="${ing.id}" title="Remover substância">${I('trash')}</button></div><div class="two-col-row"><div class="field"><label>Substância</label><input data-ing-field="name" value="${E(ing.name||'')}" placeholder="Nome"></div><div class="field"><label>Dose</label><input data-ing-field="dose" value="${E(ing.dose||'')}" placeholder="Ex.: 200"></div><div class="field"><label>Unidade</label><select data-ing-field="unit">${['mg','mcg','g','UI','%','mL'].map(x=>`<option ${ing.unit===x?'selected':''}>${x}</option>`).join('')}</select></div><div></div></div><details class="ingredient-details"><summary>Análise exclusiva do farmacêutico</summary><div class="field" style="margin-top:10px"><label>Classificação da função</label><select data-ing-field="role"><option value="">Selecionar</option><option ${ing.role==='MOTOR'?'selected':''}>MOTOR</option><option ${ing.role==='COADJUVANTE'?'selected':''}>COADJUVANTE</option></select></div><div class="field"><label>Sintomas/alvos clínicos e justificativa</label><textarea data-ing-field="target">${E(ing.target||'')}</textarea></div><div class="field"><label>Fonte, força de evidência e alertas</label><textarea data-ing-field="evidence">${E(ing.evidence||'')}</textarea></div></details></div>`;}
function formulas(){return pageHeader('Minhas fórmulas','Formulações podem começar anônimas e ser vinculadas depois, após revisão.',`<button class="btn primary" data-action="new-visit">${I('plus')} Nova formulação</button>`)+`<div class="panel"><h3>Histórico de formulações</h3>${data.visits.length?latestVisits().map(visitRow).join(''):empty('Nenhuma formulação vinculada','Você pode iniciar uma proposta anônima pela IA.','files')}</div>`+renderAnonymousDrafts();}
function prescriptions(){return pageHeader('Receituário','Emissão demonstrativa e revisão antes de imprimir ou salvar em PDF.',`<button class="btn" data-page="docs">Outros documentos</button>`)+`<div class="panel"><div class="notice">Todos os documentos produzidos nesta versão trazem a identificação de RASCUNHO — SEM ASSINATURA. Não utilizar para atendimento real.</div>${data.visits.length?latestVisits().map(v=>`<div class="listline"><div><strong>${E(v.formulaName)}</strong><p>${E(patientFor(v)?.name||'—')} · ${fmtDate(v.date)} · ${v.ingredients.length} substância(s)</p></div><button class="btn compact" data-print-visit="${v.id}">${I('printer')} Abrir modelo</button></div>`).join(''):empty('Nenhum receituário','É necessário criar e salvar uma formulação.')}</div>`;}
function followup(){return pageHeader('Acompanhamento','Lembrete 3 dias antes do término, calculado pela data real de início.',`<button class="btn" data-action="test-sound">${I('bell')} Testar som</button>`)+`<div class="panel"><div class="notice blue">O aviso visual funciona no protótipo quando você abre o aplicativo. Push em segundo plano e som automático dependem de infraestrutura e permissões ainda não implementadas.</div>${data.visits.length?latestVisits().map(v=>{const p=patientFor(v),t=endDate(v),a=alertDate(v),d=daysUntil(t);return `<div class="listline"><div><strong>${E(p?.name||'—')}</strong><p>Atendimento: ${fmtDate(v.date)} · ${E(p?.phone||'—')}</p><p>Início: ${fmtDate(v.startDate)} · Término: ${fmtDate(t)} · Aviso: ${fmtDate(a)}</p><span class="badge ${daysUntil(a)<=0?'warn':'neutral'}">${d<0?'Data ultrapassada':d+' dia(s) restantes'}</span></div><div class="btnrow"><button class="btn compact" data-open-visit="${v.id}">Ver</button><button class="btn compact" data-complete="${v.id}">${v.status==='finalizado'?'Reabrir':'Concluir'}</button></div></div>`;}).join(''):empty('Nenhum tratamento','Os atendimentos aparecerão aqui.','bell')}</div>`;}
function simulator(){const v=visit();return pageHeader('Simulador de Formulações','Compare alterações entre versões salvas, sem simular ganhos clínicos inexistentes.')+`<div class="panel"><div class="field"><label>Selecione uma formulação</label><select id="sim-visit"><option value="">Selecionar...</option>${data.visits.map(x=>`<option value="${x.id}" ${v?.id===x.id?'selected':''}>${E(patientFor(x)?.name)} — ${E(x.formulaName)}</option>`).join('')}</select></div><hr class="divider"/>${!v?empty('Selecione uma fórmula','Compare versões após registrar pelo menos duas revisões.', 'compare'): (v.revisions?.length||0)<2?empty('Sem comparação disponível','Salve a mesma formulação após editar seus componentes para registrar versões.', 'compare'):diffVersions(v)}</div>`;}
function diffVersions(v){const old=v.revisions.at(-2),newer=v.revisions.at(-1);if(!old||!newer)return '';const fmt=i=>`${E(i.name||'—')} ${E(i.dose||'')} ${E(i.unit||'')}`;const ia=old.ingredients||[],ib=newer.ingredients||[];let a=new Map(ia.map(x=>[x.id,x])),b=new Map(ib.map(x=>[x.id,x]));let diffs=[];for(const [id,item] of b){if(!a.has(id))diffs.push(`Adicionada: ${fmt(item)}`);else if(JSON.stringify([item.name,item.dose,item.unit])!==JSON.stringify([a.get(id).name,a.get(id).dose,a.get(id).unit]))diffs.push(`Alterada: ${fmt(a.get(id))} → ${fmt(item)}`);}for(const [id,item]of a){if(!b.has(id))diffs.push(`Removida: ${fmt(item)}`);}return `<div class="row-between"><h3>Últimas versões</h3><span class="badge">${v.revisions.length} revisões</span></div><p class="muted small">${fmtDate(old.savedAt?.slice(0,10))} → ${fmtDate(newer.savedAt?.slice(0,10))}</p>${diffs.length?diffs.map(d=>`<div class="source">${d}</div>`).join(''):'<p class="muted">Não houve mudança de substâncias e doses entre estas versões.</p>'}<div class="notice">Comparações de eficácia, interações e benefício incremental ainda exigem o motor científico a ser implementado.</div>`;}
const sources=[['PubMed / NCBI','Pesquisa clínica, doses, mecanismos, segurança e estudos','https://pubmed.ncbi.nlm.nih.gov/','Farmacologia'],['Farmacopeia Brasileira (8ª)','Padrões oficiais de qualidade; monografias ainda não indexadas automaticamente','https://www.gov.br/anvisa/pt-br/assuntos/farmacopeia/farmacopeia-brasileira','Farmacologia'],['Formulário Nacional (3ª)','Fórmulas oficinais, bases e preparo; acesso ao documento oficial','https://www.gov.br/anvisa/pt-br/assuntos/farmacopeia/formulario-nacional','Farmacologia'],['Formulário de Fitoterápicos (3ª)','Preparações fitoterápicas oficiais e advertências','https://www.gov.br/anvisa/pt-br/assuntos/farmacopeia/formulario-fitoterapico','Farmacologia'],['Compêndios Anvisa 2026','Página oficial de acesso às novas edições, incluindo Farmacopeia Homeopática (4ª)','https://www.gov.br/anvisa/pt-br/assuntos/noticias-anvisa/2026/entram-em-vigor-os-novos-compendios-da-farmacopeia-brasileira','Farmacologia'],['Conitec / PCDT','Protocolos clínicos e diretrizes','https://www.gov.br/conitec/pt-br','Farmacologia'],['OMS / WHO','Diretrizes de atividade física e saúde','https://www.who.int/','Atividade física'],['ACSM','Treinamento resistido, força e condicionamento','https://acsm.org/','Atividade física'],['Guia de Atividade Física do Brasil','Ministério da Saúde — recomendações nacionais','https://www.gov.br/saude/pt-br','Atividade física'],['Guia Alimentar do Brasil','Ministério da Saúde — educação alimentar','https://www.gov.br/saude/pt-br','Alimentação']];
function science(){
 const statusRows=[
  ['PubMed / Europe PMC',aiSession.ready?
   'Busca científica online configurada; teste a recuperação para confirmar o resultado atual.':
   'Serviço ainda não identificado como disponível neste domínio.'],
  ['Farmacopeia, Formulário Nacional e Fitoterápicos',
   'Consulta online automática às páginas oficiais. O servidor tenta importar automaticamente os dez arquivos, com prioridade para plantas medicinais. O PDF de ~55 MB recebe tentativa específica; erro de memória ou conversão exige processamento externo segmentado.'],
  ['Conitec / PCDT, OMS e guias brasileiros','Referências catalogadas, sem conteúdo indexado e aprovado.'],
  ['Consensus',aiSession.consensusReady?'Chave configurada; pesquisa opcional e sujeita à cota.':
   'Chave da API ainda não configurada; o Consensus conectado ao ChatGPT é independente.']
 ];
 const result=scienceCheck.diagnostics;
 let checkResult='';
 if(result){
   const x=result;
   if(x.pubmed){
     checkResult='<div class="listline"><strong>Versão do servidor: '+E(x.version||'não identificada')+'</strong></div>'+
      '<div class="listline"><strong>PubMed: '+E(x.pubmed.status)+
      '</strong><p>'+E(String(x.pubmed.articles||0))+' artigos com resumo recuperados'+
      (x.pubmed.sample?': '+E(x.pubmed.sample.title):'')+'</p></div>'+
      '<div class="listline"><strong>Anvisa online: '+E(x.anvisaOnline?.status||'não verificado')+
      '</strong><p>'+E(String(x.anvisaOnline?.reachable||0))+'/'+E(String(x.anvisaOnline?.checked||0))+
      ' páginas oficiais acessíveis; conteúdo institucional, não monografia integral.</p></div>'+
      '<div class="listline"><strong>Agendamento Cloudflare</strong><p>'+
        (x.officialIndex?.scheduler?
         E(x.officialIndex.scheduler.status)+' · '+E(x.officialIndex.scheduler.lastRunAt)+
         ' · '+E(x.officialIndex.scheduler.detail||''):
         'Nenhuma execução do agendamento registrada no SQLite')+
      '</p></div>'+
      (Array.isArray(x.officialIndex?.autoSync)&&x.officialIndex.autoSync.length?
       '<div class="listline"><strong>Sincronização automática de PDFs</strong>'+
       x.officialIndex.autoSync.map(v=>'<p>'+E(v.documentId)+': '+E(v.status)+
       ' · '+E(v.checkedAt)+' · '+E(v.message||'sem mensagem')+'</p>').join('')+'</div>':
       '<div class="listline"><strong>PDFs em sincronização</strong><p>Nenhuma tentativa registrada; confirmar implantação do Worker e do agendamento.</p></div>')+
      '<div class="listline"><strong>Índice oficial: '+E(x.officialIndex?.status||'desconhecido')+
      '</strong><p>'+E(String(x.officialIndex?.approvedDocuments||0))+' monografias/documentos completos aprovados; '+
      E(String(x.officialIndex?.approvedPassages||0))+' trechos revisados; '+
      E(String(x.officialIndex?.pendingReviewDocuments||0))+' compêndios extraídos aguardando revisão; '+
      E(String(x.officialIndex?.overviewSections||0))+' sínteses institucionais pesquisáveis (não monografias completas)</p></div>'+
      (Array.isArray(x.officialIndex?.sources)?x.officialIndex.sources.map(src=>'<div class="listline"><strong>'+E(src.name)+'</strong><p>'+E(src.status)+' · '+E(String(src.approvedDocuments||0))+' documentos aprovados · '+E(String(src.overviewSections||0))+' sínteses disponíveis</p></div>').join(''):'')+
      '<div class="listline"><strong>Consensus: '+E(x.consensus?.status||'indisponível')+
      '</strong><p>Não são consumidas chamadas do Consensus neste diagnóstico.</p></div>'+
      '<div class="listline"><strong>Workers AI: '+E(x.workersAI?.status||'indisponível')+
      '</strong><p>Binding identificado; a execução real é verificada no teste do motor.</p></div>';
   }else if(x.stages){
     checkResult='<div class="listline"><strong>Autoteste completo: '+(x.passed?'concluído':'não concluído')+
      '</strong><p>PubMed: '+E(x.stages.pubmed)+
      ' · Workers AI: '+E(x.stages.workersAI)+
      ' · Fontes: '+E(String(x.sourceCount||0))+
      ' · Resultado: '+E(x.draftDecision||'sem estrutura')+
      (x.reason?' · '+E(x.reason):'')+'</p></div>';
   }
 }
 const busy=scienceCheck.busy?'disabled':'';
 return pageHeader('Central de Atualização Científica','Conexões científicas automáticas do motor magistral · v0.5.3.')+
 '<div class="notice blue"><strong>Consulta científica automática:</strong> o LifeMag IA pesquisa artigos PubMed, o índice privado e páginas oficiais da Anvisa, sem você selecionar PDFs. Páginas institucionais não substituem monografias nem validam doses. O teste do motor usa somente caso fictício.</div>'+
 '<div class="panel"><h3>Diagnóstico de conexão</h3>'+
 '<p class="muted small">Verifique a recuperação de artigos gratuitamente. O autoteste completo também executa o modelo de IA e consome parte da franquia Workers AI.</p>'+
 '<div class="btnrow"><button type="button" class="btn primary" data-science-check="sources" '+busy+'>Verificar fontes</button>'+
 '<button type="button" class="btn" data-science-check="model" '+busy+'>Testar IA com caso fictício</button>'+
 '<button type="button" class="btn" data-science-sync="start" '+busy+'>Atualizar compêndios agora</button></div>'+
 (scienceCheck.busy?'<p class="muted small">Consultando serviços...</p>':'')+
 (scienceCheck.error?'<div class="notice">'+E(scienceCheck.error)+'</div>':'')+
 (checkResult?'<div class="science-check-result" aria-live="polite">'+checkResult+'</div>':'')+
 '</div>'+
 '<details class="panel anvisa-import" style="margin-top:14px"><summary><strong>Ferramentas técnicas de importação (opcionais)</strong></summary><div><h3>Importação dos compêndios da Anvisa — edições 2026</h3>'+
 '<p class="muted small">O Worker converterá os PDFs em texto para a biblioteca privada. A extração preserva conteúdo para pesquisa, mas tabelas, unidades e capítulos devem ser conferidos antes de liberar doses. Limite atual: 46 MiB por PDF.</p>'+
 '<button type="button" class="btn primary" data-anvisa-batch="start" '+(anvisaImport.busy||!aiSession.indexReady?'disabled':'')+'>Tentar obter as 3 cópias públicas menores</button>'+
 '<label class="btn compact anvisa-picker">Importar volume dividido (manifesto + PDFs)'+
 '<input type="file" data-anvisa-parts accept=".pdf,.json,application/pdf,application/json" multiple '+
 (anvisaImport.busy||!aiSession.indexReady?'disabled':'')+'></label>'+
 '<p class="muted small">Para volumes acima de 46 MiB, divida por páginas e selecione o manifesto e todas as partes.</p>'+
 officialAnvisaDocuments.map(([id,title,desc,hasMirror])=>{
   const job=anvisaImport.records.find(x=>x.id.startsWith(id+'-'));
   const disabled=anvisaImport.busy||!aiSession.indexReady;
   return '<div class="listline anvisa-row"><div><strong>'+E(title)+'</strong><p>'+E(desc)+
    ' · '+(job?E(job.status)+' — '+E(String(job.sections||0))+' trechos convertidos':'ainda não extraído')+
    '</p></div><div class="anvisa-actions">'+
    (hasMirror?'<button type="button" class="btn compact" data-ingest-anvisa="'+E(id)+'" '+
    (disabled?'disabled':'')+'>'+(anvisaImport.activeId===id?'Processando...':'Obter cópia pública')+'</button>':'')+
    '<label class="btn compact anvisa-picker">Selecionar PDF oficial'+
    '<input type="file" data-anvisa-pdf="'+E(id)+'" accept="application/pdf,.pdf" '+
    (disabled?'disabled':'')+'></label></div></div>';
 }).join('')+
 (anvisaImport.coverage.length?'<div class="anvisa-report">'+
  anvisaImport.coverage.map(c=>'<p><strong>'+E(c.sourceId)+':</strong> '+
  E(String(c.importedParts))+'/'+E(String(c.expectedParts))+' partes, '+
  E(String(c.coveredPages))+'/'+E(String(c.totalPages))+' páginas — '+
  (c.completeExtraction?'extração completa, revisão pendente':'extração parcial')+
  '</p>').join('')+'</div>':'')+
 (anvisaImport.batchReport.length?'<div class="anvisa-report" role="status">'+anvisaImport.batchReport.map(item=>'<p><strong>'+E(item.id)+':</strong> '+E(item.text)+'</p>').join('')+'</div>':'')+
 (anvisaImport.error?'<p role="alert" class="notice">'+E(anvisaImport.error)+'</p>':'')+
 (anvisaImport.latest?'<p role="status" class="notice blue">Texto recebido: '+
  E(String(anvisaImport.latest.sections||0))+' trechos; revisão documental pendente.</p>':'')+
 '</div></details>'+
'<div class="panel scientific-search" style="margin-top:14px"><h3>Pesquisar conteúdo científico</h3>'+
 '<p class="muted small">Busque no conteúdo já indexado, por exemplo: fitoterápicos, cápsulas, atividade física ou Guia Alimentar. Sinopses não equivalem a monografias integrais nem validam doses.</p>'+
 '<form id="science-search-form"><div class="field"><label for="science-search-query">Tema científico (sem dados de paciente)</label>'+
 '<input id="science-search-query" name="scienceQuery" maxlength="120" minlength="4" required value="'+E(scienceCheck.searchQuery)+'" placeholder="Ex.: Farmacopeia, fitoterápicos, alimentação"></div>'+
 '<button type="submit" class="btn primary" '+(scienceCheck.searchBusy?'disabled':'')+'>'+ 
 (scienceCheck.searchBusy?'Consultando…':'Pesquisar fontes científicas')+'</button></form>'+
 (scienceCheck.searchError?'<p role="alert" class="muted">'+E(scienceCheck.searchError)+'</p>':'')+
 (scienceCheck.libraryResults?'<div class="science-library-results" aria-live="polite"><p class="muted small">'+
 E(String(scienceCheck.libraryResults.results?.length||0))+' resultados · '+E(String(scienceCheck.libraryResults.reviewedCount||0))+
 ' trechos de documentos revisados · '+E(String(scienceCheck.libraryResults.unreviewedCount||0))+' trechos de PDF ainda não conferidos · '+E(String(scienceCheck.libraryResults.overviewCount||0))+
 ' sinopses institucionais · '+E(String(scienceCheck.libraryResults.anvisaOnline?.retrievedContext||0))+' páginas oficiais online relacionadas · '+E(String(scienceCheck.libraryResults.pubmedOnline?.articles||0))+' artigos PubMed recuperados online</p>'+
 (scienceCheck.libraryResults.results||[]).map(x=>'<article class="listline"><div><strong>'+E(x.title)+
 '</strong><p>'+E(x.evidenceTier==='reviewed_document'?'Documento revisado':x.evidenceTier==='extracted_unreviewed'?'PDF oficial extraído — revisão pendente; não valida dose':x.evidenceTier==='official_web_context'?'Página consultada online — não é monografia integral':x.evidenceTier==='clinical_literature'?'Artigo PubMed com resumo (avaliar qualidade do estudo)':'Sinopse institucional (não é dose clínica)')+
 ' · '+E(x.journal||'Fonte oficial')+'</p><p>'+E(String(x.abstract||'').slice(0,800))+'</p>'+
 '<a target="_blank" rel="noopener noreferrer" href="'+E(x.url)+'">Consultar fonte oficial</a></div></article>').join('')+
 '</div>':'')+'</div>'+
'<div class="panel" style="margin-top:14px"><h3>Conexões científicas</h3>'+
 statusRows.map(([name,status])=>'<div class="listline"><div><strong>'+E(name)+'</strong><p>'+E(status)+'</p></div></div>').join('')+'</div>'+
 '<details class="panel" style="margin-top:14px"><summary><strong>Incorporar documento oficial revisado</strong></summary>'+
 '<p class="muted small">Importação de manifesto JSON com edição, URL oficial, licença, conteúdo e SHA-256 conferidos. Não envie PDF bruto, documentos de pacientes ou material ainda não revisado.</p>'+
 '<form id="science-import-form"><div class="field"><label for="science-manifest-file">Manifesto científico revisado (.json)</label>'+
 '<input id="science-manifest-file" name="manifestFile" type="file" accept=".json,application/json" required></div>'+
 '<label class="consensus-option"><input type="checkbox" name="attestation" value="yes" required/> Confirmo a revisão profissional, a origem oficial e a autorização de uso do conteúdo.</label>'+
 '<div class="form-actions"><button class="btn primary" type="submit" '+(aiSession.indexReady?'':'disabled')+'>Importar para biblioteca científica</button></div></form></details>'+
 '<div class="panel" style="margin-top:14px"><h3>Catálogo de fontes oficiais</h3>'+
 sources.map(([name,desc,url,area])=>'<div class="listline"><div><strong>'+E(name)+'</strong><p>'+E(desc)+' · '+E(area)+'</p></div><a class="btn compact" href="'+url+'" target="_blank" rel="noopener noreferrer">Abrir fonte '+I('arrow',14)+'</a></div>').join('')+'</div>';
}
async function requestAnvisaSynchronization(){
 if(scienceCheck.busy)return;
 scienceCheck.busy=true;scienceCheck.error=null;render();
 try{
  const response=await fetch('/api/science/sync-anvisa',{
   method:'POST',credentials:'same-origin',
   headers:{'content-type':'application/json'},body:'{}'
  });
  const data=await response.json();
  if(!response.ok)throw Error(String(data.error||'Erro ao agendar a coleta'));
  toast(data.status==='already_scheduled'?
   'A coleta automática já está agendada.':
   data.status==='recently_started'?
   'A coleta científica foi iniciada recentemente.':
   'Coleta dos compêndios agendada no servidor, sem arquivos manuais.');
 }catch(error){scienceCheck.error=String(error?.message||error).slice(0,220)}
 finally{scienceCheck.busy=false;render()}
}

async function searchScientificLibrary(form){
 if(scienceCheck.searchBusy)return;
 const value=String(form.elements.namedItem('scienceQuery')?.value||'').trim();
 if(value.length<4||value.length>120){toast('Informe um tema com 4 a 120 caracteres.');return}
 scienceCheck.searchBusy=true;
 scienceCheck.searchQuery=value;
 scienceCheck.searchError=null;scienceCheck.libraryResults=null;render();
 try{
   const res=await fetch('/api/science/search?q='+encodeURIComponent(value),{
     method:'GET',credentials:'same-origin',headers:{accept:'application/json'}});
   const json=await res.json();
   if(!res.ok)throw Error(json.error||'Não foi possível pesquisar o índice');
   scienceCheck.libraryResults=json;
 }catch(error){scienceCheck.searchError=String(error?.message||'Pesquisa indisponível')}
 finally{scienceCheck.searchBusy=false;render()}
}
async function checkScientificServices(kind){
 if(scienceCheck.busy)return;
 if(!aiSession.ready){toast('Serviço protegido da IA não está disponível neste domínio.');return}
 scienceCheck.busy=true;scienceCheck.error=null;scienceCheck.diagnostics=null;render();
 try{
   const res=await fetch(kind==='model'?'/api/selftest':'/api/source-status',{
     method:kind==='model'?'POST':'GET',credentials:'same-origin',headers:{accept:'application/json'}});
   const json=await res.json();
   scienceCheck.diagnostics=json;
   if(!res.ok)scienceCheck.error=String(json.reason||json.error||'Falha ao verificar serviço científico');
 }catch(_){scienceCheck.error='Não foi possível consultar o diagnóstico da Cloudflare.'}
 finally{scienceCheck.busy=false;scienceCheck.lastCheck=new Date().toISOString();render()}
}
function docs(){const v=visit();return pageHeader('Documentos Clínicos','Modelos clean, com ícone oficial, farmácia e profissional identificados.')+`<div class="panel"><div class="field"><label>Atendimento para o documento</label><select id="doc-visit"><option value="">Selecione...</option>${data.visits.map(x=>`<option value="${x.id}" ${v?.id===x.id?'selected':''}>${E(patientFor(x)?.name||'Paciente')} · ${fmtDate(x.date)}</option>`).join('')}</select></div><div class="notice blue">Documentos desta fase são rascunhos demonstrativos. A declaração de comparecimento não valida presença real sem conferência.</div><div class="tilegrid" style="grid-template-columns:repeat(2,minmax(0,1fr));margin-top:15px">${[['clinical','Ficha clínica','Cadastro e avaliação'],['prescription','Receituário','Um documento para paciente e manipulação'],['attendance','Comparecimento','Data e horários efetivos'],['service','Serviço farmacêutico','Declaração do serviço executado'],['protocol','Protocolo complementar','Atividade física e alimentação educativa']].map(([doc,title,desc])=>`<button class="tile" data-doc="${doc}" style="min-height:130px"><span class="icon-bg">${I('files')}</span><strong>${title}</strong><span>${desc}</span></button>`).join('')}</div></div>`;}
function settings() {
  const s=data.settings;
  return pageHeader('Identidade profissional','Personalize sua foto, saudação e dados utilizados nos documentos demonstrativos.')+
  `<div class="panel"><div class="profile-edit"><div>${professionalPortrait()}</div><div><h2>Sua foto profissional</h2><p>Ela aparecerá no cabeçalho e na tela inicial do LifeMag IA. Nesta versão, fica salva somente neste navegador.</p><label class="btn primary upload-label" for="professional-photo-input">${I('edit',17)} Escolher foto</label><input class="profile-photo-input" id="professional-photo-input" type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" /><button class="btn" type="button" data-action="remove-photo">Remover foto</button></div></div>
  <form id="settings-form"><div class="form-grid">${field('professional','Nome do farmacêutico',s.professional)}${field('role','Atuação',s.role)}${field('crf','Registro CRF',s.crf)}${field('contact','Contato profissional',s.contact)}${field('workplace','Estabelecimento',s.workplace)}${field('address','Endereço institucional',s.address)}${field('businessPhone','Telefone do estabelecimento',s.businessPhone)}${field('cnpj','CNPJ (somente confirmado)',s.cnpj)}${field('professionalAddress','Endereço profissional',s.professionalAddress)}</div><div class="notice">Utilize somente dados fictícios de pacientes nesta demonstração. A foto e a identificação são armazenadas localmente, sem sincronização entre aparelhos.</div><div class="form-actions"><button class="btn primary" type="submit">${I('check')} Salvar identidade</button><button class="btn" type="button" data-page="home">${I('home',17)} Voltar ao início</button><button class="btn danger" type="button" data-action="clear-demo">Limpar dados da demonstração</button></div></form></div>`;
}
function processProfessionalPhoto(file) {
  if(!file) return;
  const allowed=['image/jpeg','image/png','image/webp','image/heic','image/heif'];
  if(!allowed.includes(file.type) || file.size>8*1024*1024) {
    toast('Escolha uma foto JPG, PNG, WebP ou HEIC de até 8 MB.'); return;
  }
  const reader=new FileReader();
  reader.onerror=()=>toast('Não foi possível ler a foto.');
  reader.onload=()=>{
    const img=new Image();
    img.onerror=()=>toast('Formato de foto não suportado neste navegador.');
    img.onload=()=>{
      try{
        const size=256, canvas=document.createElement('canvas');
        canvas.width=size; canvas.height=size;
        const ctx=canvas.getContext('2d');
        if(!ctx) throw Error('canvas');
        const dim=Math.min(img.width,img.height);
        ctx.drawImage(img,(img.width-dim)/2,(img.height-dim)/2,dim,dim,0,0,size,size);
        const photo=canvas.toDataURL('image/jpeg',0.83);
        if(!/^data:image\/jpeg;base64,/i.test(photo)) throw Error('encoding');
        const prev=data.settings.photoData;
        data.settings.photoData=photo;
        try{writeStore(data);}catch(error){data.settings.photoData=prev;throw error;}
        render();toast('Foto profissional atualizada.');
      }catch(error){toast('Não foi possível armazenar a foto neste navegador.');}
    };
    img.src=reader.result;
  };
  reader.readAsDataURL(file);
}
function pageContent(){switch(ui.page){case'patients':return patients();case'conversation':return conversation();case'editor':return editor();case'formulas':return formulas();case'prescriptions':return prescriptions();case'followup':return followup();case'simulator':return simulator();case'science':return science();case'docs':return docs();case'settings':return settings();default:return home();}}
function render(){document.getElementById('app').innerHTML=layout();}
function readForm(form){return Object.fromEntries(new FormData(form).entries());}
function trimForm(obj){for(const k of Object.keys(obj))if(typeof obj[k]==='string')obj[k]=obj[k].trim();return obj;}
function saveFormula(form){const v=visit();if(!v)return;const next=trimForm(readForm(form));if(Number(next.duration)<1||Number(next.duration)>3650){toast('A duração deve ser maior que zero.');return;}Object.assign(v,next);v.duration=Number(next.duration)||15;v.revisions.push({ savedAt:new Date().toISOString(), ingredients:JSON.parse(JSON.stringify(v.ingredients)), formulaName:v.formulaName, posology:v.posology });persist();toast('Formulação salva com versão registrada.');render();}
function preview(doc,chosen=visit()){const v=chosen,p=v&&patientFor(v);if(!v||!p){toast('Selecione primeiro um atendimento.');return;}if(doc==='prescription'&&v.aiDraftPendingReview){toast('Receituário bloqueado: conclua primeiro a revisão farmacêutica da proposta da IA.');setPage('editor');return;}if(doc==='service'&&(!data.settings.cnpj||!data.settings.businessPhone)){toast('Preencha CNPJ e telefone institucional confirmados antes deste modelo.');setPage('settings');return;}if(doc==='prescription'&&(!v.ingredients.length||!v.posology||!v.quantity)){toast('Complete substâncias, quantidade e posologia antes do receituário.');setPage('editor');return;}ui.doc=doc;document.getElementById('print-root').innerHTML=renderPaper(doc,v,p);window.print();}
function renderPaper(doc,v,p){const s=data.settings, names={clinical:'FICHA CLÍNICA / CADASTRO',prescription:'RECEITUÁRIO MAGISTRAL',attendance:'DECLARAÇÃO DE COMPARECIMENTO',service:'DECLARAÇÃO DE SERVIÇO FARMACÊUTICO',protocol:'PROTOCOLO COMPLEMENTAR'};const line=(label,value)=>`<div class="print-section"><span class="print-label">${label}:</span> ${E(value||'—')}</div>`;const header=`<div class="print-head"><img src="${IMG}" alt="Logo oficial LifeMag IA"/><div><strong>LifeMag IA</strong><small>Prescrição Magistral Inteligente</small><div class="print-institution"><b>${E(s.workplace)}</b><br>${E(s.address)}<br>${E(s.professional)} — ${E(s.role)} — ${E(s.crf)}</div></div></div>`;const common=line('Paciente',p.name)+line('Data do atendimento',fmtDate(v.date))+line('Telefone',p.phone);let body='';if(doc==='prescription'){body=common+line('Endereço do paciente',p.address)+`<table class="print-table"><thead><tr><th>Substância</th><th>Dose</th></tr></thead><tbody>${v.ingredients.map(i=>`<tr><td>${E(i.name)}</td><td>${E(i.dose)} ${E(i.unit||'mg')}</td></tr>`).join('')}</tbody></table>`+line('Apresentação',v.presentation)+line('Via de administração',v.route)+line('Quantidade para manipular',v.quantity)+line('Posologia',v.posology)+line('Horários',v.schedules)+line('Relação com refeições',v.meals)+line('Duração',v.duration+' dias')+line('Orientações',v.observations);}else if(doc==='clinical'){body=common+line('Nascimento',fmtDate(p.dob))+line('Endereço',p.address)+line('Peso (kg)',p.weight)+line('Altura (cm)',p.height)+line('Observações gerais do cadastro',p.notes)+line('Motivo da consulta e objetivo clínico',normalizeClinicalAssessment(v.assessment).chiefComplaint)+line('Sintomas e evolução',normalizeClinicalAssessment(v.assessment).symptoms)+line('Histórico clínico',normalizeClinicalAssessment(v.assessment).clinicalHistory)+line('Medicamentos em uso',normalizeClinicalAssessment(v.assessment).medications)+line('Alergias e reações',normalizeClinicalAssessment(v.assessment).allergies)+line('Exames e resultados',normalizeClinicalAssessment(v.assessment).labResults)+line('Restrições e riscos',normalizeClinicalAssessment(v.assessment).riskFactors)+line('Plano de acompanhamento',normalizeClinicalAssessment(v.assessment).followUpPlan);}else if(doc==='attendance'){body=common+line('Horário de entrada','_________')+line('Horário de saída','_________')+`<p>Declaramos, para fins de comprovação, que a pessoa identificada compareceu ao atendimento farmacêutico no período efetivamente confirmado.</p>`;}else if(doc==='service'){body=common+line('CNPJ',s.cnpj)+line('Telefone institucional',s.businessPhone)+line('Serviço efetivamente realizado','_____________________________________________')+line('Resultado/observações','_____________________________________________');}else{body=common+line('Formulação vinculada',v.formulaName)+line('Orientações educativas complementares',v.protocol||'Não informado')+`<p>Intensidade progressiva, iniciando leve e evoluindo gradualmente conforme condicionamento e tolerância, se aplicável.</p>`;}return `<article class="print-page">${header}<h1 class="print-h">${names[doc]}</h1><p class="print-note"><b>RASCUNHO DE TESTE — NÃO ASSINADO — NÃO VÁLIDO PARA USO CLÍNICO</b></p>${body}<div class="print-foot"><div class="print-sign"><b>${E(s.professional)}</b><br>${E(s.role)} — ${E(s.crf)}<br><small>Campo reservado à assinatura válida</small></div></div></article>`;}
function handleClick(event){const b=event.target.closest('[data-science-sync],[data-page],[data-action],[data-select-patient],[data-review-visit],[data-open-visit],[data-add-ingredient],[data-remove-ingredient],[data-print-visit],[data-complete],[data-doc],[data-science-check],[data-import-draft],[data-save-anon-draft],[data-open-anon-draft],[data-link-anon-draft],[data-delete-anon-draft],[data-ingest-anvisa],[data-anvisa-batch]');if(!b)return;if(b.dataset.importDraft){const v=visit();importFormulaDraft(v?.chat?.find(m=>m.id===b.dataset.importDraft));return;}if(b.dataset.saveAnonDraft){saveAnonymousCase(b.dataset.saveAnonDraft);return}
if(b.dataset.openAnonDraft){openAnonymousCase(b.dataset.openAnonDraft);return}
if(b.dataset.linkAnonDraft){linkAnonymousCase(b.dataset.linkAnonDraft);return}
if(b.dataset.deleteAnonDraft){deleteAnonymousCase(b.dataset.deleteAnonDraft);return}
if(b.dataset.anvisaBatch){void prepareAnvisaBatch();return;}
if(b.dataset.ingestAnvisa){void ingestAnvisaDocument(b.dataset.ingestAnvisa);return;}
if(b.dataset.scienceSync){void requestAnvisaSynchronization();return;}
if(b.dataset.scienceCheck){void checkScientificServices(b.dataset.scienceCheck);return;}if(b.dataset.page){setPage(b.dataset.page);return;}if(b.dataset.selectPatient){ui.patientId=b.dataset.selectPatient;ui.visitId=null;render();return;}if(b.dataset.reviewVisit){const v=data.visits.find(x=>x.id===b.dataset.reviewVisit);if(v){useVisit(v);setPage('conversation');}return;}if(b.dataset.openVisit){const v=data.visits.find(x=>x.id===b.dataset.openVisit);if(v){useVisit(v);setPage('editor');}return;}if(b.dataset.printVisit){const v=data.visits.find(x=>x.id===b.dataset.printVisit);if(v){useVisit(v);preview('prescription',v);}return;}if(b.dataset.doc){preview(b.dataset.doc);return;}if(b.dataset.removeIngredient){const v=visit();if(!v)return;v.ingredients=v.ingredients.filter(i=>i.id!==b.dataset.removeIngredient);if(v.aiDraftImportedAt)v.aiDraftPendingReview=true;persist();render();return;}if(b.dataset.complete){const v=data.visits.find(x=>x.id===b.dataset.complete);if(v){v.status=v.status==='finalizado'?'em acompanhamento':'finalizado';persist();render();}return;}
const a=b.dataset.action;if(a==='delete-patient'){deleteSelectedPatient();return;}if(a==='new-visit')startVisit(ui.patientId||(data.patients.length===1?data.patients[0]?.id:null));if(a==='clear-patient'){ui.patientId=null;render();}if(a==='add-ingredient'){const v=visit();if(v){v.ingredients.push({id:uid('ing'),name:'',dose:'',unit:'mg',role:'',target:'',evidence:''});if(v.aiDraftImportedAt)v.aiDraftPendingReview=true;persist();render();}}if(a==='confirm-ai-review'){const v=visit();if(!v?.aiDraftPendingReview)return;if(!v.ingredients.length||!v.quantity||!v.posology){toast('Complete composição, quantidade e posologia antes de confirmar.');return;}if(!confirm('Confirma ter revisado clinicamente doses, interações, contraindicações, formulação e orientações? Isso não constitui assinatura digital.'))return;v.aiDraftPendingReview=false;v.aiDraftReviewedAt=new Date().toISOString();persist();render();toast('Revisão registrada. Documentos ainda exigem assinatura profissional.');return;}if(a==='save-protocol'){const v=visit();if(v){v.protocol=document.getElementById('protocol-text')?.value||'';persist();toast('Protocolo educativo salvo.');}}if(a==='test-sound'){try{const AC=window.AudioContext||window.webkitAudioContext;if(!AC)throw Error();const c=new AC(),o=c.createOscillator(),g=c.createGain();o.type='sine';o.frequency.value=660;g.gain.setValueAtTime(.10,c.currentTime);g.gain.exponentialRampToValueAtTime(.001,c.currentTime+.25);o.connect(g);g.connect(c.destination);o.start();o.stop(c.currentTime+.25);o.onended=()=>c.close();toast('Som de demonstração reproduzido.');}catch(e){toast('Som indisponível neste navegador.');}}if(a==='remove-photo'){delete data.settings.photoData;persist();render();toast('Foto removida.');}if(a==='clear-demo'){if(confirm('Apagar os dados locais desta demonstração?')){localStorage.removeItem(STORAGE_KEY);Object.assign(data,initialState());ui.patientId=null;ui.visitId=null;setPage('home');toast('Demonstração limpa.');}}}
async function submitScientificManifest(form){
 if(!aiSession.indexReady){toast('Biblioteca científica ainda não está conectada.');return}
 const file=form.elements.namedItem('manifestFile')?.files?.[0];
 const confirmed=!!form.elements.namedItem('attestation')?.checked;
 if(!file||!confirmed){toast('Selecione manifesto revisado e confirme a responsabilidade profissional.');return}
 if(file.size>500000){toast('Manifesto excede 500 KB. Divida o documento.');return}
 try{
  const manifest=JSON.parse(await file.text());
  if(manifest.reviewStatus!=='approved'||!Array.isArray(manifest.sections)||
     !manifest.sections.length)
    throw Error('Manifesto sem aprovação ou trechos revisados');
  const hash=async input=>{
    const bytes=new TextEncoder().encode(String(input));
    const buffer=await crypto.subtle.digest('SHA-256',bytes);
    return Array.from(new Uint8Array(buffer),n=>n.toString(16).padStart(2,'0')).join('');
  };
  let allContent='';
  for(const section of manifest.sections){
    section.sha256=await hash(String(section.body||'').trim());
    allContent+=String(section.heading||'').trim()+'\n'+String(section.body||'').trim()+'\n';
  }
  manifest.sha256=await hash(allContent);
  const res=await fetch('/api/science/import-reviewed',{method:'POST',
   credentials:'same-origin',headers:{'content-type':'application/json','accept':'application/json'},
   body:JSON.stringify({manifest,attestation:true})});
  const outcome=await res.json();
  if(!res.ok)throw Error(String(outcome.error||'Manifesto não aprovado'));
  toast('Documento oficial importado. Trechos aprovados: '+String(outcome.sections||0));
  scienceCheck.lastCheck=null;
  void checkScientificServices('sources');
 }catch(error){
  toast('Falha na importação: '+String(error?.message||'Arquivo inválido').slice(0,120));
 }
}
function handleSubmit(event){
  const f=event.target;
  if(!f.matches('#patient-form,#settings-form,#chat-form,#research-form,#formula-form,#assessment-form,#science-import-form,#science-search-form'))return;
  event.preventDefault();
  if(f.id==='science-search-form'){void searchScientificLibrary(f);return;}
  if(f.id==='science-import-form'){void submitScientificManifest(f);return;}
  if(f.id==='patient-form'){
    const val=trimForm(readForm(f));
    if(!val.name||!val.phone){toast('Nome completo e telefone são obrigatórios.');return;}
    if(val.dob&&(!parseISODate(val.dob)||val.dob>yyyyMmDd())){toast('Revise a data de nascimento.');return;}
    const existing=findPotentialDuplicatePatient(data.patients,val,ui.patientId||'');
    if(existing){
      ui.patientId=existing.id;
      render();
      toast('Cadastro semelhante já existente. Registro selecionado; confira os dados antes de continuar.');
      return;
    }
    if(!ui.patientId||!patient()){
      const id=uid('pac');
      data.patients.push({id,...val});
      ui.patientId=id;
    }else Object.assign(patient(),val);
    persist();
    render();
    toast('Cadastro demonstrativo salvo. Para continuar, toque em Iniciar avaliação clínica.');
  }else if(f.id==='assessment-form'){
    const v=visit();
    if(!v||!patientFor(v)){toast('Selecione um atendimento válido.');return;}
    v.assessment=normalizeClinicalAssessment(trimForm(readForm(f)));
    v.assessmentUpdatedAt=new Date().toISOString();
    persist();
    render();
    toast('Avaliação clínica demonstrativa salva neste atendimento.');
  }else if(f.id==='settings-form'){
    Object.assign(data.settings,trimForm(readForm(f)));
    persist();
    render();
    toast('Identificação profissional salva.');
  }else if(f.id==='research-form'){
    const val=trimForm(readForm(f));
    if(!val.message||aiSession.busy)return;
    const question=val.message.slice(0,2500);
    anonymousResearch.chat.push({id:uid('msg'),role:'user',text:question,createdAt:new Date().toISOString()});
    render();
    if(aiSession.ready)void sendScientificQuestion(anonymousResearch,question,val.useConsensus==='on');
    else toast('A IA ainda não está disponível neste endereço.');
  }else if(f.id==='chat-form'){
    const val=trimForm(readForm(f));
    if(!val.message)return;
    const v=visit();if(!v)return;
    if(aiSession.busy)return;
    v.chat.push({id:uid('msg'),role:'user',text:val.message.slice(0,2500),createdAt:new Date().toISOString()});
    persist();render();
    if(aiSession.ready)void sendScientificQuestion(v,val.message.slice(0,2500),val.useConsensus==='on');
    else toast('Observação registrada; serviço de IA indisponível neste endereço.');
  }else if(f.id==='formula-form')saveFormula(f);
}
function handleChange(e){const control=e.target;
if(control.hasAttribute('data-anvisa-parts')){
 const files=Array.from(control.files||[]);if(files.length)void uploadAnvisaParts(files);
 return;
}
if(control.dataset.anvisaPdf){
 const file=control.files?.[0];if(file)void uploadAnvisaDocument(control.dataset.anvisaPdf,file);
 return;
}
if(['patient-exam-gallery','patient-exam-camera'].includes(control.id)){
 const files=Array.from(control.files||[]).slice(0,6);
 const selected=files.filter(file=>file.size<=10*1024*1024&&
  ['application/pdf','image/jpeg','image/png','image/heic','image/heif'].includes(file.type));
 examSession.patientId=patient()?.id||null;
 examSession.items=selected.map(file=>({name:String(file.name||'Arquivo').slice(0,110),bytes:file.size}));
 render();
 toast(selected.length?'Pré-seleção temporária; exames NÃO foram anexados nem salvos.':
  'Utilize PDF ou imagem de até 10 MB.');
 return;
}
if(control.id==='professional-photo-input'){processProfessionalPhoto(control.files?.[0]);return;}if(control.dataset.ingField){const outer=control.closest('[data-ingredient-id]');const v=visit();const x=v?.ingredients.find(i=>i.id===outer.dataset.ingredientId);if(x){x[control.dataset.ingField]=control.value;if(v.aiDraftImportedAt)v.aiDraftPendingReview=true;persist();}return;}if(control.closest?.('#formula-form') && control.name){const v=visit();if(v){v[control.name]=control.value;if(v.aiDraftImportedAt)v.aiDraftPendingReview=true;persist();}return;}if(control.id==='sim-visit'){const v=data.visits.find(x=>x.id===control.value);if(v){useVisit(v);render();}}if(control.id==='doc-visit'){const v=data.visits.find(x=>x.id===control.value);if(v){useVisit(v);render();}}}
window.addEventListener('popstate',()=>{ui.page=pageFromUrl();render();scrollTo(0,0);});
document.addEventListener('click',handleClick);document.addEventListener('submit',handleSubmit);document.addEventListener('change',handleChange);document.addEventListener('input',e=>{if(e.target.id==='patient-filter'){ui.search=e.target.value;const root=document.getElementById('patient-results');if(root)root.innerHTML=data.patients.filter(x=>(x.name+' '+x.phone).toLowerCase().includes(ui.search.toLowerCase())).map(patientCard).join('')||empty('Nenhum resultado','Revise a busca.');}});
// Uma demonstração contém apenas dados explicitamente criados pelo usuário; não há pacientes reais embutidos.
render();
void initializeScientificAssistant();

