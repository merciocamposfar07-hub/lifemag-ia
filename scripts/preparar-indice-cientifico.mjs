// Gera SQL D1 seguro a partir de um manifesto JSON de trechos oficiais REVISTOS.
// Uso: node scripts/preparar-indice-cientifico.mjs caminho/do/manifesto.json > /tmp/ingest.sql
// NUNCA transforma PDF não revisado em "evidência aprovada" automaticamente.
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';

const file=process.argv[2];
if(!file)throw Error('Informe o manifesto JSON revisado do documento científico.');
const manifest=JSON.parse(await readFile(file,'utf8'));
const s=v=>String(v||'').trim();
const sql=v=>"'"+s(v).replaceAll("'","''")+"'";
const digest=v=>createHash('sha256').update(s(v)).digest('hex');
const required=['id','sourceId','title','edition','officialUrl','license','reviewedBy','verifiedAt','sections'];
for(const k of required)if(!manifest[k])throw Error('Campo obrigatório ausente: '+k);
if(!/^[a-z0-9-]{4,80}$/.test(manifest.id)||!/^[a-z0-9-]{3,80}$/.test(manifest.sourceId))
 throw Error('Identificadores de documento/fonte inválidos.');
const verifiedUrl=new URL(manifest.officialUrl);
const officialHosts=['www.gov.br','gov.br','bibliotecadigital.anvisa.gov.br',
 'www.who.int','who.int','bvsms.saude.gov.br'];
if(verifiedUrl.protocol!=='https:'||!officialHosts.includes(verifiedUrl.hostname))
 throw Error('Somente documento de fonte pública oficial permitida.');
if(manifest.reviewStatus!=='approved')throw Error('Apenas trechos com revisão explicitamente aprovada.');
if(!/^\d{4}-\d{2}-\d{2}$/.test(manifest.verifiedAt))throw Error('Data de verificação inválida.');
if(s(manifest.reviewedBy).length<5||s(manifest.license).length<7)
 throw Error('Identificação do revisor e licença do documento são obrigatórias.');
if(!Array.isArray(manifest.sections)||!manifest.sections.length)
 throw Error('Manifesto sem trechos revisados.');
if(manifest.sections.length>500)throw Error('Documento excessivamente grande; divida em partes.');
let full='';
for(const [i,part] of manifest.sections.entries()){
 if(!s(part.heading)||s(part.body).length<40||s(part.body).length>4500)
   throw Error('Trecho '+(i+1)+' sem cabeçalho ou tamanho aceitável.');
 full+=s(part.heading)+'\n'+s(part.body)+'\n';
}
const out=[
 '-- SQL gerado para índice do LifeMag IA; revisar antes de executar;',
 '-- URL '+verifiedUrl.toString(),
 '-- D1 já executa em transação implícita: não incluir BEGIN/COMMIT.',
 'DELETE FROM scientific_documents WHERE id='+sql(manifest.id)+';',
 'INSERT INTO scientific_documents(id,source_id,title,edition,official_url,issued_at,verified_at,reviewed_by,copyright_or_license,sha256,review_status)',
 'VALUES('+[manifest.id,manifest.sourceId,manifest.title,manifest.edition,manifest.officialUrl,
   manifest.issuedAt||'',manifest.verifiedAt,manifest.reviewedBy,manifest.license,digest(full),'approved'].map(sql).join(',')+');'
];
for(const [i,part] of manifest.sections.entries()){
 out.push('INSERT INTO scientific_passages(id,document_id,ordinal,heading,body,content_sha256) VALUES('+
  [manifest.id+'-'+String(i+1),manifest.id,String(i+1),part.heading,part.body,digest(part.body)]
    .map((v,n)=>n===2?String(i+1):sql(v)).join(',')+');');
}
out.push("UPDATE scientific_sources SET status='active' WHERE id="+sql(manifest.sourceId)+';');
// Sem COMMIT: Wrangler D1 controla a transação automaticamente.
process.stdout.write(out.join('\n')+'\n');
