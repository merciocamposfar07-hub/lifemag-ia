// Resposta clínica rápida e auditável para um caso frequente: B12 sérica
// limítrofe acompanhada de 25(OH)D geralmente adequada. Não é prescrição.
// O contexto é anônimo; não consultar IA nem transferir dados para terceiros.
const N=(s)=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const NICE='https://www.nice.org.uk/guidance/ng239/chapter/Recommendations';
const NIH_B12='https://ods.od.nih.gov/factsheets/VitaminB12-HealthProfessional/';
const ODS='https://ods.od.nih.gov/factsheets/Vitamind-HealthProfessional/';
const ENDO='https://www.endocrine.org/clinical-practice-guidelines/vitamin-d-for-prevention-of-disease';
function readResult(text,pattern){
 const m=pattern.exec(text);
 if(!m)return null;
 const value=Number(m[1].replace(',','.'));
 const suffix=text.slice(m.index+m[0].length,m.index+m[0].length+12);
 // "B12 200 mcg" e "D3 30 UI" são posologias, não exames séricos.
 if(/^\s*(?:mg|mcg|µg|ug|ui|iu)\b/i.test(suffix))return null;
 return Number.isFinite(value)?{value,unit:String(m[2]||'').toLowerCase()}:null;
}
export function quickB12VitaminDGuidance(question){
 const clean=N(question);
 // Não tratar doses da fórmula como se fossem exames: o usuário fala de
 // "resultado", "nível", "exame" ou fornece ambos em sequência clínica.
 const b12=readResult(clean,/\b(?:vitamina\s*)?b[\s-]*12\b(?:\s*(?:total|serica|resultado|em|de|:|=))?\s*(\d{2,4}(?:[.,]\d+)?)\s*(pg\s*\/?\s*ml|ng\s*\/?\s*l)?/);
 const vitaminD=readResult(clean,/\b(?:vitamina\s*)?d(?:\s*3)?\b(?:\s*(?:25\s*oh|resultado|em|de|:|=))?\s*(\d{1,3}(?:[.,]\d+)?)\s*(ng\s*\/?\s*ml)?/);
 if(!b12||!vitaminD)return null;
 // Acima/abaixo dos intervalos documentados, não presumir posologia.
 if(b12.value<180||b12.value>350||vitaminD.value<20||vitaminD.value>50)return null;
 if(b12.unit&& !/^(pg\s*\/?\s*ml|ng\s*\/?\s*l)$/.test(b12.unit))return null;
 if(vitaminD.unit&&!/^ng\s*\/?\s*ml$/.test(vitaminD.unit))return null;
 const assumed=(!b12.unit||!vitaminD.unit);
 const sources=[
  {id:'NICE-B12',title:'NICE NG239 — vitamina B12: interpretação, reposição e acompanhamento',
   url:NICE,source:'Diretriz clínica NICE (2024)',evidenceTier:'clinical_guideline'},
  {id:'NIH-B12',title:'NIH ODS — vitamina B12 e avaliação por MMA',
   url:NIH_B12,source:'NIH Office of Dietary Supplements',evidenceTier:'clinical_reference'},
  {id:'NIH-D',title:'NIH ODS — vitamina D e interpretação da 25(OH)D',
   url:ODS,source:'NIH Office of Dietary Supplements',evidenceTier:'clinical_reference'},
  {id:'ENDO-D',title:'Endocrine Society (2024) — vitamina D em adultos',
   url:ENDO,source:'Diretriz Endocrine Society',evidenceTier:'clinical_guideline'}
 ];
 const draft={
  decision:'preliminary_draft',
  objective:'Avaliar B12 sérica limítrofe e necessidade de complemento de vitamina D',
  formula_name:'Vitamina B12 oral — proposta inicial para revisão',
  quantity:'30 unidades para etapa inicial; reavaliar continuidade',
  pharmaceutical_form:'Cápsula ou comprimido oral, conforme manipulação viável',
  route:'oral',
  ingredients:[
   {name:'Vitamina B12',chemical_form:'cianocobalamina',dose_value:'1000',
    dose_unit:'mcg',role:'MOTOR',
    rationale:'Dose oral utilizada em reposição (equivalente a 1 mg/dia); a indicação depende da avaliação clínica e da causa da baixa B12.',
    references:['NICE-B12'],dose_supported:true},
   {name:'Vitamina D3',chemical_form:'colecalciferol',dose_value:'600',
    dose_unit:'UI',role:'OPCIONAL',
    rationale:'Ingestão nutricional de referência para adultos até 70 anos, somente se houver indicação de complementação alimentar; 30 ng/mL não indica reposição de ataque.',
    references:['NIH-D','ENDO-D'],dose_supported:true}
  ],
  posology:'Se indicada reposição oral de B12: 1.000 mcg/dia. D3 600 UI/dia somente se pertinente à ingestão e contexto clínico; não é tratamento da fadiga.',
  meal_relation:'Conforme apresentação; vitamina D absorve melhor com refeição contendo gordura.',
  daily_schedule:'Uma tomada diária conforme opção escolhida pelo farmacêutico.',
  initial_duration_days:30,reassessment_days:30,
  extension_criteria:'Reavaliar sintomas e necessidade de manutenção; investigar causas de B12 baixa quando indicado.',
  monitoring:['Resposta clínica; parestesias ou manifestações neurológicas; suspeita de má absorção.'],
  interactions:['Avaliar medicamentos que reduzem absorção de B12 e condições relacionadas a cálcio/vitamina D quando existentes.'],
  contraindications:['Evitar doses altas de vitamina D sem indicação; avaliar hipercalcemia e condições predisponentes quando pertinentes.'],
  missing_information:[
   ...(assumed?['Confirmar unidades no laudo: B12 pg/mL e 25(OH)D ng/mL.']:[]),
   'Verificar se há sinais neurológicos, anemia, cirurgia gastrointestinal ou causa de má absorção, para escolher via e urgência.',
   'Confirmar indicação de vitamina D antes de incluí-la no produto final.'
  ],
  red_flags:[],dose_support_gaps:[],limitations:[
   'NICE usa 180–350 pg/mL como faixa diagnóstica indeterminada; não é intervalo de referência laboratorial nem limite superior de normalidade. Interpretar conforme o laudo e o método.',
   'Não há alvo mínimo universal de 600 pg/mL para todos. A investigação pode incluir ácido metilmalônico conforme contexto.',
   'A dose de B12 de 1 mg/dia é especialmente referida para reposição oral quando há deficiência e suspeita de má absorção; não é prescrição automática.',
   '25(OH)D de 30 ng/mL é geralmente adequada. Reposição de altas doses não é indicada por esse valor isoladamente.'
  ],requiresProfessionalReview:true,canIssuePrescription:false
 };
 const lines=[
  'PROPOSTA CLÍNICA RÁPIDA — PARA REVISÃO FARMACÊUTICA',
  'Valores considerados: vitamina B12 '+b12.value+' pg/mL; vitamina D [25(OH)D] '+vitaminD.value+' ng/mL.'+
    (assumed?' Unidades presumidas: confirmar no laudo.':''),
  '',
  '1. VITAMINA B12 — MOTOR (quando a reposição for indicada)',
  'B12 '+b12.value+' pg/mL: valor indeterminado pela NICE (180–350 pg/mL) — critério de suspeita, NÃO intervalo de referência do laboratório.',
  'Referência laboratorial: conferir o intervalo validado no laudo; varia com método. Não existe meta mínima universal de 600 pg/mL para todos.',
  'Se a dúvida diagnóstica persistir, avaliar sintomas e a utilidade de ácido metilmalônico (MMA), conforme a situação.',
  'Exemplo de reposição oral para avaliação: cianocobalamina 1.000 mcg (1 mg), 1 vez ao dia. Reavaliar a resposta em até 3 meses. Se houver alteração neurológica, anemia relevante ou má absorção, avaliar a necessidade de outra via e investigação.',
  '',
  '2. VITAMINA D3 — OPCIONAL, NÃO TERAPIA OBRIGATÓRIA',
  '25(OH)D '+vitaminD.value+' ng/mL: nível geralmente adequado. Não há indicação de dose de ataque apenas por esse resultado.',
  'Se a alimentação/contexto justificar complemento nutricional, referência de ingestão para adultos de 19–70 anos: 600 UI/dia. Não atribuir a fadiga à vitamina D com esse resultado isolado.',
  '',
  'OPÇÃO COM MELHOR CUSTO-BENEFÍCIO: começar somente com o componente MOTOR, B12 oral em apresentação econômica, por 30 dias, se a reposição estiver indicada. Reavaliar a continuidade e o prazo laboratorial conforme a resposta; D3 não precisa entrar na fórmula quando não há indicação. Não prometer preço sem orçamento da farmácia.',
  'Antes de emitir: confirmar unidades, excluir sinais clínicos que alterem a via de B12 e revisar contraindicações/interações.',
  'Referências: NICE NG239 e NIH ODS (B12); NIH ODS e Endocrine Society 2024 (vitamina D).',
  'Não é receituário assinado; ajuste a formulação no Studio Magistral.'
 ];
 return {
  answer:lines.join('\n'),draft,sources,
  evidenceStatus:'Referências institucionais curadas; aplicação individual ainda depende de revisão farmacêutica.',
  sourceStatus:{internal:'curated_guidelines',pubmed:'not_required_for_this_interpretation',
   consensus:'not_required_for_this_interpretation',anvisaOnline:'not_required'},
  requiresProfessionalReview:true,needsMoreInfo:false,model:'curated_nutrient_guidance_v1'
 };
}
