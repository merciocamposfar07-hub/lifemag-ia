
/* LifeMag IA — armazenamento temporário de PROTÓTIPO. NÃO utilizar com dados reais de saúde. */
const STORAGE_KEY = 'lifemag-prototype-v0.1.0';
const initialState = () => ({
  schema: 1,
  patients: [],
  visits: [],
  settings: {
    professional: 'Dr. Mércio Campos', role: 'Farmacêutico Clínico', crf: 'CRF-PE 07880',
    workplace: 'Farmácia Barata do Trabalhador', address: 'Av. São José, 44 — Centro — Chã Grande/PE',
    businessPhone: '', cnpj: '', professionalAddress: '', contact: '',
  },
});
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
function addDays(iso, delta) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso||'')) return '';
  const [y,m,d]=iso.split('-').map(Number);
  const date=new Date(y,m-1,d,12,0,0);
  if (Number.isNaN(date.getTime())) return '';
  date.setDate(date.getDate()+delta);
  return yyyyMmDd(date);
}
const endDate = (visit) => addDays(visit.startDate || visit.date, Math.max(1,Number(visit.duration)||1)-1);
const alertDate = (visit) => addDays(endDate(visit), -3);
function daysUntil(iso, now=yyyyMmDd()) {
  if (!iso) return Infinity;
  const asUTC = s => Date.UTC(...s.split('-').map((n,i)=>i===1?Number(n)-1:Number(n)));
  return Math.round((asUTC(iso)-asUTC(now))/86400000);
}
const fmtDate = iso => iso && /^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso.split('-').reverse().join('/') : '—';

