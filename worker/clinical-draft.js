// Estrutura magistral para REVISÃO profissional. Não é prescrição nem assinatura.
export const FORMULA_SCHEMA={
 type:'object',properties:{
  decision:{type:'string',enum:['draft','insufficient_info','insufficient_evidence','red_flags']},
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
  if(!source||source.evidenceTier==='official_overview')return false;
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
  if(!/\b(?:medicament|remedi|farmac|em uso|sem medicac|nao usa medicac|nao toma remedi)/.test(normalized))
    missing.push('Medicamentos e suplementos em uso, ou confirmação de ausência');
  if(!/\b(?:alergi|hipersensibil|sem alergi|nega alergi)/.test(normalized))
    missing.push('Alergias e reações anteriores');
  if(!/\b(?:comorb|doenc|antecedent|historico clin|sem doenc|saudavel|patolog)/.test(normalized))
    missing.push('Comorbidades, antecedentes e fatores de risco');
  return missing;
}
export function normalizeDraft(raw,sources=[],question=''){

 if(!raw||typeof raw!=='object'||Array.isArray(raw))return null;
 let decision=['draft','insufficient_info','insufficient_evidence','red_flags']
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
 // Uma pergunta sobre sintomas isolados não autoriza prescrever doses individualizadas.
 if(question&&decision==='draft'){
   for(const required of missingClinicalBasics(question)){
     if(!missing.includes(required))missing.push(required);
   }
 }

 const unverified=ingredients.filter(x=>!x.dose_supported).map(x=>x.name);
 if(redFlags.length)decision='red_flags';
 else if(missing.length&&decision==='draft')decision='insufficient_info';
 else if((!ingredients.length||unverified.length)&&decision==='draft')decision='insufficient_evidence';
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
  insufficient_info:'DADOS CLÍNICOS INSUFICIENTES — FORMULAÇÃO NÃO LIBERADA',
  insufficient_evidence:'EVIDÊNCIA INSUFICIENTE — NÃO LIBERAR RECEITA',
  red_flags:'SINAIS DE ALERTA — FORMULAÇÃO NÃO LIBERADA'
 }[d.decision]||'AVALIAÇÃO FARMACÊUTICA';
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
 lines.push('QUANTIDADE PARA MANIPULAR: '+(d.decision==='draft'?(d.quantity||'a definir'):'a definir'));
 lines.push('POSOLOGIA: '+(d.decision==='draft'?(d.posology||'a definir'):'NÃO DEFINIDA — confirmar dados clínicos e evidências'));
 lines.push('REFEIÇÕES: '+(d.decision==='draft'?(d.meal_relation||'a definir'):'a definir'));
 lines.push('HORÁRIOS: '+(d.decision==='draft'?(d.daily_schedule||'a definir'):'a definir'));
 lines.push('DURAÇÃO INICIAL: '+(d.decision==='draft'&&d.initial_duration_days?d.initial_duration_days+' dias':'a definir'));
 lines.push('REAVALIAÇÃO: '+(d.decision==='draft'&&d.reassessment_days?d.reassessment_days+' dias':'a definir'));
 lines.push('CRITÉRIOS DE PRORROGAÇÃO: '+(d.extension_criteria||'a definir'));
 const section=(title,values)=>{if(values.length)lines.push(title+': '+values.join('; '));};
 section('MONITORAMENTO',d.monitoring);section('INTERAÇÕES A AVALIAR',d.interactions);
 section('CONTRAINDICAÇÕES',d.contraindications);
 section('INFORMAÇÕES FALTANTES',d.missing_information);
 section('SINAIS DE ALERTA',d.red_flags);
 section('DOSES NÃO COMPROVADAS',d.dose_support_gaps);
 section('LIMITAÇÕES',d.limitations);
 lines.push('NÃO É RECEITUÁRIO. O farmacêutico deve verificar posologia, doses, interações, contraindicações e monitoramento.');
 return lines.join('\n');
}
