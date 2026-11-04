
/* LifeMag IA — armazenamento temporário de PROTÓTIPO. NÃO utilizar com dados reais de saúde. */
const STORAGE_KEY = 'lifemag-prototype-v0.1.0';
const initialState = () => ({
  schema: 1,
  patients: [],
  visits: [],
  // Apenas rascunhos ANÔNIMOS de formulações; sem cadastro ou exames reais.
  anonymousDrafts: [],
  settings: {
    professional: 'Dr. Mércio Campos', role: 'Farmacêutico Clínico', crf: 'CRF-PE 07880',
    workplace: 'Farmácia Barata do Trabalhador', address: 'Av. São José, 44 — Centro — Chã Grande/PE',
    businessPhone: '', cnpj: '', professionalAddress: '', contact: '',
  },
});
// Avaliação clínica independente por atendimento. Apenas testes fictícios nesta versão.
const CLINICAL_ASSESSMENT_FIELDS = [
  'chiefComplaint','symptoms','clinicalHistory','medications',
  'allergies','labResults','riskFactors','followUpPlan'
];
function emptyClinicalAssessment(){
  return Object.fromEntries(CLINICAL_ASSESSMENT_FIELDS.map(field=>[field,'']));
}
function normalizeClinicalAssessment(value){
  const source=value && typeof value==='object'&&!Array.isArray(value)?value:{};
  return Object.fromEntries(CLINICAL_ASSESSMENT_FIELDS.map(field=>[
    field,typeof source[field]==='string'?source[field].trim().slice(0,5000):''
  ]));
}
function findPotentialDuplicatePatient(patients,candidate,excludedId=''){
  const normalizedName=v=>String(v||'').normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR').replace(/\s+/g,' ').trim();
  const digits=v=>String(v||'').replace(/\D/g,'');
  const name=normalizedName(candidate?.name);
  const dob=String(candidate?.dob||'');
  const phone=digits(candidate?.phone);
  if(!name)return null;
  return (patients||[]).find(p=>{
    if(p.id===excludedId||normalizedName(p.name)!==name)return false;
    const sameBirth=dob && p.dob && String(p.dob)===dob;
    const samePhone=phone && digits(p.phone)===phone;
    return Boolean(sameBirth||samePhone);
  })||null;
}

// Exclusão definitiva do cadastro demonstrativo com atendimentos associados.
function deletePatientRecord(state,patientId){
  const found=(state.patients||[]).find(p=>p.id===patientId);
  if(!found)return {deleted:false,visitCount:0};
  const count=(state.visits||[]).filter(v=>v.patientId===patientId).length;
  state.patients=state.patients.filter(p=>p.id!==patientId);
  state.visits=state.visits.filter(v=>v.patientId!==patientId);
  return {deleted:true,visitCount:count};
}
function createAnonymousFormulaDraft(state,source,label){
  const title=String(label||'').trim().slice(0,75);
  if(!title||!source||typeof source!=='object'||!Array.isArray(source.ingredients))
    return null;
  // Não persistir conversa, nome de paciente, CPF, exame, nem dados clínicos.
  const safe={id:uid('draft'),label:title,
    createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),
    formulaName:String(source.formula_name||'Proposta em revisão').slice(0,140),
    quantity:String(source.quantity||'').slice(0,120),
    presentation:String(source.pharmaceutical_form||'').slice(0,100),
    route:String(source.route||'').slice(0,100),
    posology:String(source.posology||'').slice(0,600),
    schedules:String(source.daily_schedule||'').slice(0,240),
    meals:String(source.meal_relation||'').slice(0,240),
    duration:Number.isInteger(source.initial_duration_days)?source.initial_duration_days:0,
    ingredients:source.ingredients.slice(0,16).map(x=>({
      name:String(x.name||'').slice(0,140),
      dose:String(x.dose_value||'').slice(0,50),
      unit:String(x.dose_unit||'mg').slice(0,12),
      role:String(x.role||'OPCIONAL').slice(0,24),
      target:String(x.rationale||'').slice(0,300),
      evidence:(x.references||[]).slice(0,8).join(', ').slice(0,150),
      doseSupported:x.dose_supported===true
    })),
    draftStatus:String(source.decision||'draft').slice(0,40),
    linkedPatientId:null
  };
  if(!Array.isArray(state.anonymousDrafts))state.anonymousDrafts=[];
  state.anonymousDrafts.push(safe);
  return safe;
}
function linkAnonymousDraftToPatient(state,draftId,patientId){
  const draft=(state.anonymousDrafts||[]).find(x=>x.id===draftId);
  const person=(state.patients||[]).find(x=>x.id===patientId);
  if(!draft||!person||draft.linkedPatientId)return null;
  const today=yyyyMmDd();
  const v={id:uid('at'),patientId:person.id,date:today,startDate:today,
    assessment:emptyClinicalAssessment(),duration:draft.duration||15,
    status:'em acompanhamento',formulaName:draft.formulaName,
    presentation:draft.presentation,route:draft.route,quantity:draft.quantity,
    posology:draft.posology,schedules:draft.schedules,meals:draft.meals,
    observations:'Rascunho importado de discussão anônima — revisão farmacêutica obrigatória.',
    protocol:'',ingredients:draft.ingredients.map(x=>({
      id:uid('ing'),name:x.name,dose:x.dose,unit:x.unit,role:x.role,
      target:x.target,evidence:x.evidence
    })),chat:[],revisions:[],
    aiDraftImportedAt:new Date().toISOString(),aiDraftPendingReview:true,
    originDraftId:draft.id};
  state.visits.push(v);
  draft.linkedPatientId=person.id;
  draft.linkedVisitId=v.id;
  draft.updatedAt=new Date().toISOString();
  return v;
}

function readStore() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return value && value.schema === 1 && Array.isArray(value.patients) && Array.isArray(value.visits)
      ? { ...initialState(), ...value, settings: { ...initialState().settings, ...value.settings } }
      : initialState();
  } catch (_) { return initialState(); }
}
function writeStore(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
function uid(prefix='id') {
  if (globalThis.crypto?.randomUUID) return `${prefix}_${crypto.randomUUID()}`;
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}
function yyyyMmDd(date = new Date()) {
  const y = date.getFullYear(), m=String(date.getMonth()+1).padStart(2,'0'), d=String(date.getDate()).padStart(2,'0');
  return `${y}-${m}-${d}`;
}
// Rejeita datas inexistentes (ex.: 31/02) antes de calcular seguimentos.
function parseISODate(iso) {
  if (typeof iso !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d, 12, 0, 0);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d
    ? date : null;
}
function addDays(iso, delta) {
  const date = parseISODate(iso);
  if (!date || !Number.isInteger(delta)) return '';
  date.setDate(date.getDate() + delta);
  return yyyyMmDd(date);
}
const endDate = (visit) => addDays(visit.startDate || visit.date, Math.max(1, Number(visit.duration) || 1) - 1);
const alertDate = (visit) => addDays(endDate(visit), -3);
function daysUntil(iso, now = yyyyMmDd()) {
  const target = parseISODate(iso);
  const base = parseISODate(now);
  if (!target || !base) return Infinity;
  const asUTC = date => Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.round((asUTC(target) - asUTC(base)) / 86400000);
}
const fmtDate = iso => parseISODate(iso) ? iso.split('-').reverse().join('/') : '—';

