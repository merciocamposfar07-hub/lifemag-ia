'use strict';
const assert=require('node:assert/strict');
async function main(){
 const {searchConsensus}=await import('../worker/consensus.js');
 const q='riboflavin migraine';
 let count=0,errors=0;
 const check=async(label,fn)=>{try{await fn();count++;console.log('PASSOU:',label)}
   catch(e){errors++;process.exitCode=1;console.error('FALHOU:',label,e)}};
 await check('sem Secret não chama API nem consome cota',async()=>{
   const r=await searchConsensus(q,{},()=>{throw Error('rede indevida')});
   assert.equal(r.status,'not_configured');assert.equal(r.items.length,0);
 });
 await check('usa domínio e autenticação x-api-key oficiais',async()=>{
   let url,opts;
   const r=await searchConsensus(q,{CONSENSUS_API_KEY:'chave-ficticia'},async(a,b)=>{
     url=String(a);opts=b;return Response.json({results:[{
       title:'Study of riboflavin',journal_name:'Journal',
       publish_year:2025,url:'https://consensus.app/papers/example',takeaway:'Positive results.'
     }]});
   });
   assert.ok(url.startsWith('https://api.consensus.app/v1/search?'));
   assert.equal(opts.headers['x-api-key'],'chave-ficticia');
   assert.equal(r.status,'ok');assert.equal(r.items[0].source,'Consensus API');
 });
 await check('plano Free aproveita abstract mesmo sem takeaway',async()=>{
   const r=await searchConsensus('riboflavin migraine',{CONSENSUS_API_KEY:'ficticia'},
     async()=>Response.json({results:[{
       title:'Riboflavin randomized trial',
       abstract:'Riboflavin 400 mg/day was studied in a randomized migraine trial.',
       url:'https://consensus.app/papers/example',
       journal_name:'Clinical research',publish_year:2025
     }]}));
   assert.equal(r.status,'ok');
   assert.ok(r.items[0].abstract.includes('400 mg'));
 });
 await check('URL da revista substituída por DOI seguro quando válido',async()=>{
   const r=await searchConsensus('riboflavin migraine',{CONSENSUS_API_KEY:'ficticia'},
     async()=>Response.json({results:[{
       title:'Ensaio farmacológico',doi:'10.1234/example.2026.12',
       url:'https://revista-exemplo.org/publicacao',
       abstract:'An academic abstract suitable for clinical review.',
       publish_year:2026
     }]}));
   assert.equal(r.status,'ok');
   assert.equal(r.items[0].url,'https://doi.org/10.1234/example.2026.12');
 });
 await check('rejeita fontes em URLs não confiáveis',async()=>{
   const r=await searchConsensus(q,{CONSENSUS_API_KEY:'ficticia'},async()=>Response.json({
     results:[{title:'Falso',url:'https://unknown.example.com/data',takeaway:'Não'}]
   }));
   assert.equal(r.items.length,0);assert.equal(r.status,'no_results');
 });
 await check('limite de chamadas 429 é sinalizado explicitamente',async()=>{
   const r=await searchConsensus(q,{CONSENSUS_API_KEY:'ficticia'},async()=>new Response('',{status:429}));
   assert.equal(r.status,'quota_exhausted');
 });
 console.log('Testes Consensus:',count,'passaram; falhas:',errors);
}
main().catch(e=>{console.error(e);process.exitCode=1});
