'use strict';
const assert=require('node:assert/strict');
async function main(){
  const {buildIndexQuery,searchIndexedEvidence}=await import('../worker/science-index.js');
  let ran=0,failed=0;
  const check=async(name,fn)=>{try{await fn();ran++;console.log('PASSOU:',name)}
    catch(e){failed++;console.error('FALHOU:',name,e);process.exitCode=1}};
  await check('busca textual remove comandos e mantém termos clínicos',async()=>{
    const q=buildIndexQuery('Evidências para riboflavina na prevenção da enxaqueca');
    assert.ok(q.includes('"riboflavina"*'));
    assert.ok(q.includes('"enxaqueca"*'));
    assert.ok(!q.includes(';'));
  });
  await check('sem banco D1 não inventa fontes',async()=>{
    const r=await searchIndexedEvidence('riboflavina enxaqueca',undefined);
    assert.equal(r.status,'not_configured');assert.equal(r.items.length,0);
  });
  await check('consulta D1 exige revisão e origem ativa',async()=>{
    let sql='';
    const db={prepare:q=>{sql=q;return {bind:value=>({all:async()=>({results:[{
      title:'Formulário Nacional',edition:'3ª edição',official_url:'https://www.gov.br/anvisa/pt-br/assuntos/farmacopeia',
      body:'Texto técnico farmacêutico da monografia revisada e identificada, com exigências de qualidade e preparo.',
      heading:'Composição',name:'Anvisa',verified_at:'2026-11-03'
    }]})})}}};
    const r=await searchIndexedEvidence('preparo formulação farmacêutica',db);
    assert.equal(r.status,'ok');assert.equal(r.items.length,1);
    assert.equal(r.items[0].id,'C1');
    assert.ok(sql.includes("d.review_status='approved'"));
    assert.ok(sql.includes("s.status='active'"));
  });
  await check('não inclui origem externa não verificada',async()=>{
    const db={prepare:()=>({bind:()=>({all:async()=>({results:[{
      title:'Documento',edition:'1',official_url:'https://exemplo-inseguro.org/pagina',
      body:'Texto extenso de publicação sem origem autorizada, sem validação das fontes correspondentes.',
      heading:'Seção',name:'Indefinido'
    }]})})})};
    const r=await searchIndexedEvidence('doses riboflavina',db);
    assert.equal(r.items.length,0);assert.equal(r.status,'no_approved_documents');
  });
  await check('se banco falhar resposta não simula indexação',async()=>{
    const db={prepare:()=>{throw Error('sem banco')}};
    const r=await searchIndexedEvidence('riboflavina',db);
    assert.equal(r.status,'index_unavailable');assert.equal(r.items.length,0);
  });
  await check('busca vazia não consulta banco',async()=>{
    const db={prepare:()=>{throw Error('não deveria consultar')}};
    const r=await searchIndexedEvidence('e de para',db);
    assert.equal(r.status,'empty_query');
  });
  console.log('Testes base científica interna:',ran,'passaram; falhas:',failed);
}
main().catch(e=>{console.error(e);process.exitCode=1});
