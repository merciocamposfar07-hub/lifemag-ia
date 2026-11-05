// Estrutura magistral para REVISÃO profissional. Não é prescrição nem assinatura.
export const FORMULA_SCHEMA={
 type:'object',properties:{
  decision:{type:'string',enum:['draft','preliminary_draft','insufficient_info','insufficient_evidence','red_flags']},
  objective:{type:'string'},formula_name:{type:'string'},quantity:{type:'string'},
  pharmaceutical_form:{type:'string'},route:{type:'string'},
  ingredients:{type:'array',items:{type:'object',properties:{
   name:{type:'string'},chemical_form:{type:'string'},dose_value:{type:'string'},
   dose_unit:{type:'string'},role:{type:'string',enum:['MOTOR','COADJUVANTE','OPCIONAL']},
   rationale:{type:'string'},references:{type:'array',items:{type:'string'}}
  },required:['name','chemical_form','dose_value','dose_unit','role','rationale','references']}},
  posology:{type:'string'},meal_relation:{type:'string'},daily_schedule:{type:'string'},
  initial_duration_days:{type:'integer'},reassessment_days:{type:'integer'},
  extension_criteria:{type:'string'},
  monitoring:{type:'array',items:{type:'string'}},interactions:{type:'array',items:{type:'string'}},
  contraindications:{type:'array',items:{type:'string'}},
  missing_information:{type:'array',items:{type:'string'}},
  red_flags:{type:'array',items:{type:'string'}},
  limitations:{type:'array',items:{type:'string'}}
 },required:['decision','objective','formula_name','pharmaceutical_form','route','ingredients',
 'quantity','posology','meal_relation','daily_schedule','initial_duration_days','reassessment_days',
 'extension_criteria','monitoring','interactions','contraindications',
 'missing_information','red_flags','limitations']
};
const plain=s=>String(s??'').replace(/[<>]/g,'').trim().slice(0,850);
const list=(v,n=12)=>Array.isArray(v)?v.slice(0,n).map(plain).filter(Boolean):[];
function doseSupported(x,sources){
 const number=String(x.dose_value||'').trim().replace(',','.');
 const unit=String(x.dose_unit||'').toLowerCase().trim();
 if(!/^\d{1,6}(?:\.\d{1,4})?$/.test(number))return false;
 if(!['mg','mcg','µg','μg','g','ui','iu','%'].includes(unit))return false;
 const escaped=number.replace('.','[.,]');
 const alternatives=unit==='mcg'||unit==='µg'||unit==='μg'?'(?:mcg|µg|μg|micrograms?)':
  unit==='iu'||unit==='ui'?'(?:ui|iu|international units?)':unit==='%'?'%':unit;
 const pattern=new RegExp('(^|[^\\d])'+escaped+'\\s*'+alternatives+'(?:\\b|$)','i');
 const sourceMap=new Map(sources.map(z=>[String(z.id),z]));
 return list(x.references,6).some(ref=>{
  const source=sourceMap.get(ref.replace(/[\[\]]/g,''));
  // Sinopses de catálogos não validam dose, posologia ou manipulação.
  if(!source||['official_overview','extracted_unreviewed','official_web_context'].includes(source.evidenceTier))return false;
  const topic=(String(source.title||'')+' '+String(source.abstract||'')).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const ingredient=String(x.name||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const synonyms={riboflavina:'riboflavin',magnesio:'magnesium',cafeina:'caffeine',berberina:'berberine',coenzima:'coenzyme',melatonina:'melatonin',cromo:'chromium',zinco:'zinc',tirosina:'tyrosine'};
  const root=ingredient.split(/\s+/).filter(Boolean)[0]||'';
  const associated=root.length>=4&&(topic.includes(root)||topic.includes(synonyms[root]||'#n/a'));
  return associated&&pattern.test(String(source.abstract||''));
 });
}
export function missingClinicalBasics(question){
  const normalized=String(question||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .toLowerCase();
  const missing=[];
  if(!/\b(?:\d{1,3}\s*anos?|adult[oa]s?|idos[oa]s?|crianc[as]|adolescente)\b/.test(normalized))
    missing.push('Faixa etária ou idade');
  if(!/\b(?:sexo\s*[:=]?\s*(?:masculino|feminino)|paciente\s+(?:homem|mulher)|homem|mulher|masculino|feminino)\b/.test(normalized))
    missing.push('Sexo para individualização clínica');
  if(!/(?:\b(?:peso\s*[:=]?\s*|pesa\s+)\d{2,3}(?:[.,]\d+)?\s*(?:kg|quilos?)?\b|\b\d{2,3}(?:[.,]\d+)?\s*(?:kg|quilos?|de peso)\b)/.test(normalized))
    missing.push('Peso corporal em kg');
  if(!/\b(?:medicac|medicament|remedi|farmac|suplement|em uso|sem medicac|nao usa medicac|nao toma remedi)/.test(normalized))
    missing.push('Medicamentos e suplementos em uso, ou confirmação de ausência');
  if(!/\b(?:alergi|hipersensibil|sem alergi|nega alergi)/.test(normalized))
    missing.push('Alergias e reações anteriores');
  if(!/\b(?:comorb|doenc|antecedent|historico clin|sem doenc|saudavel|patolog)/.test(normalized))
    missing.push('Comorbidades, antecedentes e fatores de risco');
  return missing;
}

// Sintomas comuns não constituem, isoladamente, sinais de urgência.
// A triagem faz perguntas breves antes de pesquisar ou sugerir doses.
const normalizeClinical=s=>String(s||'').normalize('NFD')
  .replace(/[\u0300-\u036f]/g,'').toLowerCase();
const fatiguePattern=/\b(?:fadig\w*|cansac\w*|indisposic\w*|astenia|fraqueza)\b/;
const urgentPatterns=[
 /\b(?:dor (?:no|do) peito|dor toracica)\b/,
 /\b(?:falta de ar|dispneia)\b/,
 /\b(?:desmaios?|sincope)\b/,
 /\b(?:confusao mental|perda de consciencia)\b/,
 /\b(?:sangramento intenso|fraqueza subita)\b/
];
function explicitUrgentSigns(question){
 const q=normalizeClinical(question);
 const found=[];
 for(const re of urgentPatterns){
  const match=re.exec(q);
  if(!match)continue;
  const before=q.slice(Math.max(0,match.index-22),match.index);
  if(/\b(?:nega|sem|nao tem|nao apresenta|ausencia de)\s*(?:qualquer\s*)?$/.test(before))continue;
  found.push(match[0]);
 }
 return found;
}
export function screenClinicalQuestion(question){
 const q=normalizeClinical(question);
 if(!fatiguePattern.test(q))return null;
 const urgent=explicitUrgentSigns(question);
 const missing=[];
 const basics=missingClinicalBasics(question);
 if(basics.includes('Faixa etária ou idade'))missing.push('Qual a idade do paciente?');
 if(basics.includes('Sexo para individualização clínica'))missing.push('Qual o sexo do paciente?');
 if(basics.includes('Peso corporal em kg'))missing.push('Qual o peso em kg?');
 if(basics.includes('Medicamentos e suplementos em uso, ou confirmação de ausência'))
  missing.push('Usa medicamentos ou suplementos?');
 if(basics.includes('Alergias e reações anteriores'))missing.push('Há alergias conhecidas?');
 if(basics.includes('Comorbidades, antecedentes e fatores de risco'))
  missing.push('Possui doenças prévias, diagnóstico conhecido ou outras condições relevantes?');
 if(!/\b(?:ha\s+\d|desde\s+|durante\s+|inicio\s+|comecou\s+|semanas?|meses?|dias?|anos?\s+de\s+fadiga)\b/.test(q))
  missing.push('Há quanto tempo começaram a fadiga e o cansaço?');
 if(!/\b(?:sono|dorme|dormindo|dormiu|insonia|apneia|descanso)\b/.test(q))
  missing.push('Como estão o sono, o descanso e a rotina de trabalho?');
 // Exames são úteis quando existentes, mas não são exigidos em todas as situações.
 if(!/\b(?:exames?|hemograma|ferritina|tsh|glicemia|b12|vitamina|laboratorio)\b/.test(q))
  missing.push('Existem exames recentes ou sinais associados (febre, perda de peso, falta de ar)?');
 if(!urgent.length)return null;
 const raw={
  decision:urgent.length?'red_flags':'insufficient_info',
  objective:'Avaliar causas de fadiga e indisposição',
  formula_name:'Avaliação farmacêutica em andamento',
  quantity:'',pharmaceutical_form:'',route:'',
  ingredients:[],posology:'',meal_relation:'',daily_schedule:'',
  initial_duration_days:0,reassessment_days:0,extension_criteria:'',
  monitoring:[],interactions:[],contraindications:[],
  missing_information:urgent.length?[]:missing,
  red_flags:urgent,
  limitations:['Não atribuir fadiga a uma deficiência ou indicar doses terapêuticas sem avaliação clínica.']
 };
 return normalizeDraft(raw,[],question);
}

export function normalizeDraft(raw,sources=[],question=''){

 if(!raw||typeof raw!=='object'||Array.isArray(raw))return null;
 let decision=['draft','preliminary_draft','insufficient_info','insufficient_evidence','red_flags']
   .includes(raw.decision)?raw.decision:'insufficient_info';
 const ids=new Set(sources.map(x=>String(x.id)));
 const ingredients=(Array.isArray(raw.ingredients)?raw.ingredients:[]).slice(0,12).map(x=>{
  const refs=list(x?.references,6).map(a=>a.replace(/[\[\]]/g,'')).filter(a=>ids.has(a));
  const item={name:plain(x?.name),chemical_form:plain(x?.chemical_form),
   dose_value:plain(x?.dose_value),dose_unit:plain(x?.dose_unit),
   role:['MOTOR','COADJUVANTE','OPCIONAL'].includes(x?.role)?x.role:'OPCIONAL',
   rationale:plain(x?.rationale),references:refs};
  return {...item,dose_supported:doseSupported(item,sources)};
 }).filter(x=>x.name&&x.references.length);
 const missing=list(raw.missing_information),redFlags=list(raw.red_flags);
 // O modelo não pode inventar sinal de alerta apenas porque uma causa exige
 // investigação. Para fadiga inespecífica, a urgência precisa estar descrita.
 if(question&&fatiguePattern.test(normalizeClinical(question))&&
    redFlags.length&&!explicitUrgentSigns(question).length){
   redFlags.length=0;
   if(!missing.includes('Esclarecer duração, antecedentes, sono e sinais associados'))
    missing.push('Esclarecer duração, antecedentes, sono e sinais associados');
   decision='insufficient_info';
 }
 // Uma pergunta sobre sintomas isolados não autoriza prescrever doses individualizadas.
 if(question&&['draft','preliminary_draft'].includes(decision)){
   for(const required of missingClinicalBasics(question)){
     if(!missing.includes(required))missing.push(required);
   }
 }

 const unverified=ingredients.filter(x=>!x.dose_supported).map(x=>x.name);
 if(redFlags.length)decision='red_flags';
 else if((!ingredients.length||unverified.length)&&['draft','preliminary_draft'].includes(decision))decision='insufficient_evidence';
 else if(missing.length&&decision==='draft')decision='preliminary_draft';
 const positiveDays=x=>Number.isInteger(x)&&x>0&&x<=365?x:null;
 return {
  decision,objective:plain(raw.objective),formula_name:plain(raw.formula_name),quantity:plain(raw.quantity),
  pharmaceutical_form:plain(raw.pharmaceutical_form),route:plain(raw.route),ingredients,
  posology:plain(raw.posology),meal_relation:plain(raw.meal_relation),
  daily_schedule:plain(raw.daily_schedule),
  initial_duration_days:positiveDays(raw.initial_duration_days),
  reassessment_days:positiveDays(raw.reassessment_days),
  extension_criteria:plain(raw.extension_criteria),monitoring:list(raw.monitoring),
  interactions:list(raw.interactions),contraindications:list(raw.contraindications),
  missing_information:missing,red_flags:redFlags,limitations:list(raw.limitations),
  dose_support_gaps:unverified,requiresProfessionalReview:true,canIssuePrescription:false
 };
}
export function draftAsText(d){
 if(!d)return '';
 const headline={
  draft:'PROPOSTA MAGISTRAL PARA REVISÃO',
  preliminary_draft:'PROPOSTA PRELIMINAR — REVISÃO FARMACÊUTICA OBRIGATÓRIA',
  insufficient_info:'DADOS CLÍNICOS INSUFICIENTES — FORMULAÇÃO NÃO LIBERADA',
  insufficient_evidence:'EVIDÊNCIA INSUFICIENTE — NÃO LIBERAR RECEITA',
  red_flags:'SINAIS DE ALERTA — FORMULAÇÃO NÃO LIBERADA'
 }[d.decision]||'AVALIAÇÃO FARMACÊUTICA';
 if(d.decision==='insufficient_info'||d.decision==='red_flags'){
  const lines=[
   d.decision==='red_flags'?'ATENÇÃO — AVALIAR SINAIS DE ALERTA':
    'AVALIAÇÃO CLÍNICA EM ANDAMENTO',
   'Objetivo: '+(d.objective||'Avaliar a necessidade clínica')
  ];
  if(d.decision==='red_flags'){
   lines.push('Sinais relatados: '+d.red_flags.join('; '));
   lines.push('É necessário atendimento clínico oportuno; não iniciar formulação para mascarar esses sintomas.');
  }else{
   lines.push('Os dados recebidos permitem iniciar a análise, mas ainda não fundamentam uma formulação individualizada.');
   if(d.missing_information.length){
    lines.push('INFORMAÇÕES PARA CONTINUAR:');
    for(const item of d.missing_information.slice(0,7))
     lines.push('• '+item);
   }
   lines.push('Responda na mesma conversa. O LifeMag IA deve considerar os dados já fornecidos.');
  }
  lines.push('Não é receituário nem diagnóstico médico.');
  return lines.join('\n');
 }
 const lines=[headline,d.formula_name||'Formulação em avaliação',
  'Objetivo: '+(d.objective||'não definido'),
  'Forma farmacêutica: '+(d.pharmaceutical_form||'a definir')+
    ' | Via: '+(d.route||'a definir'),'COMPOSIÇÃO:'];
 if(!d.ingredients.length)lines.push('Sem substâncias suficientemente fundamentadas.');
 for(const item of d.ingredients){
  const dose=item.dose_supported?(d.decision==='draft'?item.dose_value+' '+item.dose_unit:'Dose estudada '+item.dose_value+' '+item.dose_unit+' — ainda não individualizada'):'DOSE NÃO CONFIRMADA NAS FONTES';
  lines.push('• '+item.name+' ('+(item.chemical_form||'forma química pendente')+') — '+
    dose+' ['+item.role+']. '+item.rationale+
    ' Fontes: '+item.references.map(r=>'['+r+']').join(', '));
 }
 lines.push('QUANTIDADE PARA MANIPULAR: '+(d.decision==='draft'?(d.quantity||'a definir'):'a confirmar na revisão'));
 lines.push(d.decision==='preliminary_draft'?
  'POSOLOGIA ESTUDADA (NÃO INDIVIDUALIZADA): '+(d.posology||'a definir') :
  'POSOLOGIA: '+(d.decision==='draft'?(d.posology||'a definir'):'NÃO DEFINIDA — confirmar dados clínicos e evidências'));
 lines.push('REFEIÇÕES: '+(['draft','preliminary_draft'].includes(d.decision)?(d.meal_relation||'a definir'):'a definir'));
 lines.push('HORÁRIOS: '+(['draft','preliminary_draft'].includes(d.decision)?(d.daily_schedule||'a definir'):'a definir'));
 lines.push('DURAÇÃO INICIAL: '+(['draft','preliminary_draft'].includes(d.decision)&&d.initial_duration_days?d.initial_duration_days+' dias (sujeito a revisão)':'a definir'));
 lines.push('REAVALIAÇÃO: '+(['draft','preliminary_draft'].includes(d.decision)&&d.reassessment_days?d.reassessment_days+' dias':'a definir'));
 lines.push('CRITÉRIOS DE PRORROGAÇÃO: '+(d.extension_criteria||'a definir'));
 const section=(title,values)=>{if(values.length)lines.push(title+': '+values.join('; '));};
 section('MONITORAMENTO',d.monitoring);section('INTERAÇÕES A AVALIAR',d.interactions);
 section('CONTRAINDICAÇÕES',d.contraindications);
 section('INFORMAÇÕES RECOMENDADAS PARA REVISÃO',d.missing_information);
 section('SINAIS DE ALERTA',d.red_flags);
 section('DOSES NÃO COMPROVADAS',d.dose_support_gaps);
 section('LIMITAÇÕES',d.limitations);
 lines.push('NÃO É RECEITUÁRIO. O farmacêutico deve verificar posologia, doses, interações, contraindicações e monitoramento.');
 return lines.join('\n');
}
