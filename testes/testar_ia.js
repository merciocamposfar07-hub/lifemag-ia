'use strict';
const assert=require('node:assert/strict');
const URL_WORKER='https://lifemag-ia-clinico.example.com';
const originalFetch=globalThis.fetch;
const mockArticles={resultList:{result:[
  {source:'MED',id:'12345678',title:'Review of riboflavin in migraine prevention',
   abstractText:'This review summarizes published clinical trials of riboflavin for migraine prophylaxis; evidence remains heterogeneous.',
   journalTitle:'Clinical Review',firstPublicationDate:'2026-07-01'},
  {source:'PPR',id:'99999999',title:'Unverified preprint',abstractText:'Not accepted'}
]}};
let noArticles=false;
globalThis.fetch=async url=>{
  if(String(url).startsWith('https://www.ebi.ac.uk/europepmc/webservices/rest/search?'))
    return Response.json(noArticles?{resultList:{result:[]}}:mockArticles);
  throw Error('Domínio externo inesperado');
};
async function tests(){
 const {default:worker,searchEvidence,buildEuropePmcQuery}=await import('../worker/index.js');
 const env={
  AI:{run:async()=>({response:{decision:'insufficient_info',objective:'revisão bibliográfica',formula_name:'Em avaliação',quantity:'a definir',pharmaceutical_form:'a definir',route:'a definir',ingredients:[],posology:'a definir',meal_relation:'a definir',daily_schedule:'a definir',initial_duration_days:0,reassessment_days:0,extension_criteria:'revisão profissional',monitoring:[],interactions:[],contraindications:[],missing_information:['necessária avaliação clínica'],red_flags:[],limitations:['fontes resumidas']}})}
 };
 const access={
  access:{aud:'aud-exclusivo-lifemag',getIdentity:async()=>({email:'farmaceutico@example.org'})}
 };
 const ctxBadEmail={access:{aud:'aud-exclusivo-lifemag',getIdentity:async()=>({email:'inválido'})}};
 const request=(path,{method='GET',body,headers={}}={})=>new Request(URL_WORKER+path,{method,
  headers:{'content-type':'application/json',...headers},
  ...(body?{body:JSON.stringify(body)}:{})});
 const cases=[
  ['prontuário clínico exige identidade, origem e isola profissional',async()=>{
    const stores=new Map();
    const clinicalEnv={...env,CLINICAL_RECORDS:{getByName:key=>{
      if(!stores.has(key)){
       let current={ok:true,revision:0,state:null};
       stores.set(key,{
        read:async()=>current,
        save:async input=>{
         if(current.revision!==input.revision)
          return {ok:false,status:409,error:'Conflito de versão'};
         current={ok:true,revision:current.revision+1,state:input.state};
         return {ok:true,revision:current.revision,updatedAt:'2026-11-05T12:00:00Z'};
        }
       });
      }
      return stores.get(key);
    }}};
    const url='/api/clinical/state';
    assert.equal((await worker.fetch(request(url),clinicalEnv,{})).status,401);
    const before=await worker.fetch(request(url),clinicalEnv,access);
    assert.equal(before.status,200);
    assert.equal((await before.json()).state,null);
    const patient={id:'pac_exemplo',name:'Paciente demonstrativo',phone:'81900000000'};
    const state={schema:1,patients:[patient],visits:[],anonymousDrafts:[],settings:{}};
    const payload={revision:0,state};
    assert.equal((await worker.fetch(request(url,{method:'PUT',body:payload,
      headers:{origin:'https://atacante.example'}}),clinicalEnv,access)).status,403);
    assert.equal((await worker.fetch(request(url,{method:'PUT',body:payload}),
      clinicalEnv,{})).status,401);
    const allowed=await worker.fetch(request(url,{method:'PUT',body:payload,
      headers:{origin:URL_WORKER}}),clinicalEnv,access);
    assert.equal(allowed.status,200);
    assert.equal((await allowed.json()).revision,1);
    const another={access:{aud:'aud-exclusivo-lifemag',
      getIdentity:async()=>({email:'outro-farmaceutico@example.org'})}};
    assert.equal((await (await worker.fetch(request(url),clinicalEnv,another)).json()).state,null);
    assert.equal((await (await worker.fetch(request(url),clinicalEnv,access)).json())
      .state.patients[0].name,'Paciente demonstrativo');
    assert.equal(stores.size,2);
    assert.equal((await worker.fetch(request(url,{method:'PUT',body:payload,
      headers:{origin:URL_WORKER}}),clinicalEnv,access)).status,409);
  }],

  ['sincronização dos compêndios requer login e origem legítima',async()=>{
    let enqueued=0;
    const configured={...env,INGEST_COORDINATOR:{
      getByName:()=>({enqueue:async()=>{
       enqueued++;
       return {status:'scheduled',scheduledFor:'2026-11-05T04:17:00.000Z'};
      }})
    }};
    const url='/api/science/sync-anvisa';
    const req=extra=>request(url,{method:'POST',headers:extra});
    assert.equal((await worker.fetch(req({origin:URL_WORKER}),configured,{})).status,401);
    assert.equal((await worker.fetch(req({origin:'https://evil.example'}),configured,access)).status,403);
    assert.equal(enqueued,0);
    const response=await worker.fetch(req({origin:URL_WORKER}),configured,access);
    assert.equal(response.status,202);
    const data=await response.json();
    assert.equal(data.status,'scheduled');
    assert.equal(data.documentDownloadRequired,false);
    assert.equal(enqueued,1);
  }],
  ['Consensus automático só consulta em caso de escassez de evidências',async()=>{
    const {searchConsensus}=await import('../worker/consensus.js');
    let called=0;
    const fake={CONSENSUS_API_KEY:'chave-interna',SCIENCE_LIBRARY:{
      getByName:()=>({reserveConsensusSearch:async()=>({allowed:false})})
    }};
    const clinical={...env,...fake};
    // O teste principal já encontra um artigo; não deve esgotar a cota.
    const response=await worker.fetch(request('/api/assist',{method:'POST',body:{
      question:'Adulto 35 anos, sem medicamentos, sem alergias, sem doenças conhecidas, enxaqueca e riboflavina.',
      useConsensus:'auto'
    }}),clinical,access);
    assert.equal(response.status,200);
    const body=await response.json();
    assert.equal(body.sourceStatus.consensus,'not_needed');
    assert.equal(called,0);
  }],
  ['autoteste clínico verifica leitura e gravação apenas em conta sintética',async()=>{
    const names=[];
    const entries=new Map();
    const e={...env,CLINICAL_RECORDS:{getByName:name=>{
      names.push(name);
      if(!entries.has(name)){
       let revision=0,state=null;
       entries.set(name,{
        read:async()=>({ok:true,revision,state}),
        save:async x=>{if(x.revision!==revision)return {ok:false,status:409};
          state=x.state;revision++;return {ok:true,revision};}
       });
      }
      return entries.get(name);
    }}};
    const url='/api/clinical/selftest';
    assert.equal((await worker.fetch(request(url,{method:'POST',headers:{origin:URL_WORKER}}),e,{})).status,401);
    assert.equal((await worker.fetch(request(url,{method:'POST',headers:{origin:'https://evil.example'}}),e,access)).status,403);
    const r=await worker.fetch(request(url,{method:'POST',headers:{origin:URL_WORKER}}),e,access);
    assert.equal(r.status,200);
    assert.equal((await r.json()).syntheticOnly,true);
    assert.equal(names.length,1);
    assert.equal(new Set(names).size,1);
    assert.ok(!names[0].includes('farmaceutico@example.org'));
  }],
  ['caso de fadiga avança para proposta preliminar apenas com dose estudada',async()=>{
    const previous=globalThis.fetch;
    globalThis.fetch=async url=>{
      if(String(url).startsWith('https://www.ebi.ac.uk/europepmc/webservices/rest/search?'))
       return Response.json({resultList:{result:[{
        source:'MED',id:'23456789',title:'Coenzyme Q10 in fatigue: trial in adults',
        abstractText:'In adults reporting fatigue, a randomized study evaluated coenzyme Q10 200 mg per day versus placebo.',
        firstPublicationDate:'2026-03-01',journalTitle:'Clinical Trial Journal'
       }]}});
      throw Error('Sem rede externa neste teste');
    };
    try{
     const candidate={
      decision:'draft',objective:'fadiga e indisposição',
      formula_name:'Coenzima Q10 — proposta para revisão',
      quantity:'30 cápsulas',pharmaceutical_form:'cápsulas',route:'oral',
      ingredients:[{name:'Coenzima Q10',chemical_form:'ubiquinona',dose_value:'200',
       dose_unit:'mg',role:'MOTOR',rationale:'dose avaliada em estudo clínico',
       references:['1']}],
      posology:'1 vez ao dia, verificar indicação individual',
      meal_relation:'a conferir',daily_schedule:'a definir',
      initial_duration_days:30,reassessment_days:15,
      extension_criteria:'reavaliação farmacêutica',monitoring:[],
      interactions:[],contraindications:[],missing_information:[],
      red_flags:[],limitations:['Dose estudada não comprova benefício individual']
     };
     let aiUsed=false;
     const clinical={...env,AI:{run:async()=>{aiUsed=true;return {response:candidate}}}};
     const question='Homem de 41 anos, 68,0 de peso, não tem alergias e não faz uso de medicação contínua. Sente indisposição, cansaço, fadiga. Qual formulação sugerida?';
     const response=await worker.fetch(request('/api/assist',{method:'POST',
       body:{question,useConsensus:'auto'}}),clinical,access);
     assert.equal(response.status,200);
     const result=await response.json();
     assert.equal(aiUsed,true);
     assert.equal(result.draft.decision,'preliminary_draft');
     assert.equal(result.draft.canIssuePrescription,false);
     assert.equal(result.draft.ingredients[0].dose_supported,true);
     assert.equal(result.draft.red_flags.length,0);
     assert.match(result.answer,/POSOLOGIA ESTUDADA/);
     assert.match(result.answer,/INFORMAÇÕES RECOMENDADAS/);
    }finally{globalThis.fetch=previous}
  }],
  ['sem Access: nenhum arquivo ou API permitido',async()=>{
    assert.equal((await worker.fetch(request('/'),env,{})).status,401);
    assert.equal((await worker.fetch(request('/api/capabilities'),env,{})).status,401);
  }],
  ['cabeçalho falsificado não concede acesso',async()=>{
    const r=await worker.fetch(request('/api/capabilities',{headers:{
      'Cf-Access-Jwt-Assertion':'token-falso',
      'Cf-Access-Authenticated-User-Email':'farmaceutico@example.org'
    }}),env,{});
    assert.equal(r.status,401);
  }],
  ['contexto sem audience ou e-mail: negado',async()=>{
    assert.equal((await worker.fetch(request('/api/capabilities'),env,{access:{getIdentity:async()=>({email:'farmaceutico@example.org'})}})).status,401);
    assert.equal((await worker.fetch(request('/api/capabilities'),env,ctxBadEmail)).status,401);
  }],
  ['falha na recuperação da identidade: negado',async()=>{
    const ctx={access:{aud:'aud-exclusivo-lifemag',getIdentity:async()=>{throw Error('erro')}}};
    assert.equal((await worker.fetch(request('/api/capabilities'),env,ctx)).status,401);
  }],
  ['com Access válido: API disponível sem configuração manual',async()=>{
    const r=await worker.fetch(request('/api/capabilities'),env,access);
    assert.equal(r.status,200);const x=await r.json();
    assert.equal(x.authenticated,true);assert.equal(x.ready,true);
    assert.equal(x.clinicalRecordStorage,false);
  }],
  ['filtro opcional de e-mails bloqueia demais usuários',async()=>{
    const r=await worker.fetch(request('/api/capabilities'),{...env,ALLOWED_EMAILS:'outro@example.org'},access);
    assert.equal(r.status,401);
  }],
  ['HTML é protegido e servido pelo mesmo Worker',async()=>{
    const r=await worker.fetch(request('/'),env,access);
    assert.equal(r.status,200);
    assert.ok((await r.text()).includes('LifeMag IA'));
    assert.ok(r.headers.get('content-security-policy').includes('frame-ancestors'));
  }],
  ['arquivos JS privados disponíveis apenas autenticados',async()=>{
    const r=await worker.fetch(request('/src/app.js'),env,access);
    assert.equal(r.status,200);
    assert.ok((await r.text()).includes('function conversation()'));
    assert.equal((await worker.fetch(request('/src/app.js'),env,{})).status,401);
  }],
  ['rota desconhecida não dá acesso a arquivos do repositório',async()=>{
    assert.equal((await worker.fetch(request('/database/schema-inicial.sql'),env,access)).status,404);
  }],
  ['termos clínicos em português geram pesquisa bibliográfica',async()=>{
    const q=buildEuropePmcQuery('Enxaqueca e prevenção com riboflavina e magnésio');
    assert.ok(q.includes('migraine'));assert.ok(q.includes('prevention'));
    assert.ok(q.includes('riboflavin'));assert.ok(q.includes('magnesium'));
  }],
  ['Europe PMC usa consulta PubMed sem ordenação inválida',async()=>{
    let recorded='';
    const out=await searchEvidence('Riboflavina para prevenir enxaqueca',async url=>{
      recorded=String(url);return Response.json(mockArticles);
    });
    const params=new URL(recorded).searchParams;
    assert.ok(params.get('query').includes('SRC:MED'));
    assert.equal(params.has('sort'),false);
    assert.equal(params.get('resultType'),'core');
    assert.equal(out.items.length,1);
  }],
  ['busca repete termos mais específicos quando não há resumos',async()=>{
    let requests=0;
    const out=await searchEvidence('Riboflavina para prevenção de enxaqueca em adultos',async()=>{
      requests++;
      return Response.json(requests===1?{resultList:{result:[]}}:mockArticles);
    });
    assert.equal(requests,2);
    assert.equal(out.status,'ok');
    assert.equal(out.items.length,1);
  }],
  ['falha HTTP na fonte é informada, não tratada como evidência',async()=>{
    const out=await searchEvidence('riboflavin migraine',async()=>new Response('{}',{status:503}));
    assert.equal(out.status,'source_error');
    assert.equal(out.items.length,0);
  }],
  ['busca retorna PMID de artigo indexado',async()=>{
    const out=await searchEvidence('migraine prevention');
    assert.equal(out.items.length,1);
    assert.equal(out.items[0].url,'https://pubmed.ncbi.nlm.nih.gov/12345678/');
  }],
  ['limpeza da consulta desarma operadores',async()=>
    assert.ok(!buildEuropePmcQuery('headache OR (("').includes('('))],
  ['API rejeita campos identificadores de paciente',async()=>{
    const r=await worker.fetch(request('/api/assist',{method:'POST',
      body:{question:'migraine prophylaxis',patientName:'Pessoa'}}),env,access);
    assert.equal(r.status,400);
  }],
  ['API rejeita CPF evidente no texto',async()=>{
    const r=await worker.fetch(request('/api/assist',{method:'POST',
      body:{question:'Paciente com CPF 123.456.789-01 e enxaqueca'}}),env,access);
    assert.equal(r.status,400);
  }],
  ['IA apresenta análise com referências e revisão obrigatória',async()=>{
    const r=await worker.fetch(request('/api/assist',{method:'POST',
      body:{question:'Riboflavin for migraine prophylaxis in adults'}}),env,access);
    assert.equal(r.status,200);const x=await r.json();
    assert.equal(x.requiresProfessionalReview,true);
    assert.equal(x.sources.length,1);
    assert.equal(x.sources[0].url,'https://pubmed.ncbi.nlm.nih.gov/12345678/');
    assert.ok(!('abstract' in x.sources[0]));
  }],
  ['modelo entrega primeiro quadro estruturado com posologia, refeições e duração',async()=>{
    const formula={decision:'draft',objective:'profilaxia da enxaqueca',
      formula_name:'Riboflavina em avaliação',pharmaceutical_form:'cápsulas',
      route:'oral',
      ingredients:[{name:'Riboflavina',chemical_form:'Riboflavina',dose_value:'400',
        dose_unit:'mg',role:'MOTOR',rationale:'Estudo de profilaxia',references:['1']}],
      posology:'Uma tomada diária (revisar)',meal_relation:'após refeição (revisar)',
      daily_schedule:'manhã (revisar)',initial_duration_days:30,reassessment_days:15,
      extension_criteria:'revisão clínica',monitoring:[],interactions:[],contraindications:[],
      missing_information:[],red_flags:[],limitations:['resumo']
    };
    const e={...env,AI:{run:async()=>({response:formula})}};
    const r=await worker.fetch(request('/api/assist',{method:'POST',body:{
      question:'Mulher, 35 anos, 70 kg, sem medicamentos, sem alergias, sem doenças conhecidas, enxaqueca e riboflavina.'
    }}),e,access);
    assert.equal(r.status,200);
    const d=await r.json();
    assert.ok(d.answer.includes('COMPOSIÇÃO'));assert.ok(d.answer.includes('REFEIÇÕES'));
    assert.ok(d.answer.includes('HORÁRIOS'));assert.ok(d.answer.includes('REAVALIAÇÃO'));
    assert.equal(d.draft.requiresProfessionalReview,true);
    assert.equal(d.draft.canIssuePrescription,false);
  }],
  ['sintomas isolados não liberam receita individual',async()=>{
    const formula={decision:'draft',objective:'enxaqueca',formula_name:'Em avaliação',
      pharmaceutical_form:'cápsulas',route:'oral',
      ingredients:[{name:'Riboflavina',chemical_form:'riboflavina',dose_value:'400',
        dose_unit:'mg',role:'MOTOR',rationale:'estudo',references:['1']}],
      posology:'tomar diariamente',meal_relation:'após almoço',
      daily_schedule:'manhã',initial_duration_days:30,reassessment_days:15,
      extension_criteria:'reavaliar',monitoring:[],interactions:[],
      contraindications:[],missing_information:[],red_flags:[],limitations:[]
    };
    const e={...env,AI:{run:async()=>({response:formula})}};
    const r=await worker.fetch(request('/api/assist',{method:'POST',body:{
      question:'Paciente apresenta enxaqueca e deseja formulação de riboflavina'
    }}),e,access);
    const out=await r.json();
    assert.equal(out.draft.decision,'preliminary_draft');
    assert.equal(out.draft.canIssuePrescription,false);
    assert.ok(out.draft.missing_information.length>=3);
    assert.ok(!out.answer.includes('POSOLOGIA: tomar diariamente'));
  }],
  ['saída livre não é aceita como proposta magistral',async()=>{
    const r=await worker.fetch(request('/api/assist',{method:'POST',body:{
      question:'Evidências de riboflavina e prevenção de enxaqueca em adultos'
    }}),{...env,AI:{run:async()=>({response:'Um texto solto sem composição.'})}},access);
    assert.equal(r.status,502);
  }],
  ['ausência de estudos impede resposta não fundamentada',async()=>{
    noArticles=true;
    const r=await worker.fetch(request('/api/assist',{method:'POST',
      body:{question:'Questão clínica fictícia sem artigos'}}),env,access);
    assert.equal(r.status,422);
    noArticles=false;
  }]
 ];
 let passed=0;
 for(const [label,fn] of cases){
   try{await fn();passed++;console.log('PASSOU:',label)}
   catch(e){console.error('FALHOU:',label,e);process.exitCode=1}
 }
 console.log('Testes IA Cloudflare:',passed,'/',cases.length);
}
tests().finally(()=>{globalThis.fetch=originalFetch});
