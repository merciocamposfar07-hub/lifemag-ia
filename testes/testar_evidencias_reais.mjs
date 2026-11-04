// Teste de INTEGRAÇÃO EXTERNA: não utiliza artigos ou resultados falsos.
// Requer internet (execução recomendada no GitHub Actions Node 22).
// Não acessa paciente, não consulta Workers AI e não consome Consensus.
const endpoint='https://www.ebi.ac.uk/europepmc/webservices/rest/search';
const params=new URLSearchParams({
  query:'riboflavin AND migraine AND SRC:MED',
  format:'json',resultType:'core',pageSize:'20'
});
const control=new AbortController();
const timeout=setTimeout(()=>control.abort(),20000);
try{
 const response=await fetch(endpoint+'?'+params,{headers:{accept:'application/json'},signal:control.signal});
 if(!response.ok)throw Error('Europe PMC respondeu HTTP '+response.status);
 const data=await response.json();
 const articles=Array.isArray(data?.resultList?.result)?data.resultList.result:[];
 const verified=articles.filter(item=>
  item.source==='MED' && /^\d{5,9}$/.test(String(item.id||'')) &&
  typeof item.title==='string' &&
  typeof item.abstractText==='string' && item.abstractText.replace(/<[^>]*>/g,'').length>=60
 );
 if(!verified.length)throw Error('Nenhum artigo PubMed com resumo recuperado na consulta REAL.');
 console.log('CONSULTA REAL PASSOU — Europe PMC / PubMed');
 console.log('Total de registros recebidos:',articles.length);
 console.log('Artigos indexados e com resumos:',verified.length);
 for(const item of verified.slice(0,3)){
  console.log('PMID:',item.id,'Título:',item.title.slice(0,140));
  console.log('Link:', 'https://pubmed.ncbi.nlm.nih.gov/'+item.id+'/');
 }
}catch(error){
 console.error('CONSULTA REAL FALHOU:',String(error?.message||error));
 process.exitCode=1;
}finally{clearTimeout(timeout)}
