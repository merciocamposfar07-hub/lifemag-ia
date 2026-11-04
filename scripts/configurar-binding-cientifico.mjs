// Uso: node scripts/configurar-binding-cientifico.mjs /tmp/d1-list.json
// Aponta o Worker LifeMag IA para seu PRÓPRIO D1; não acessa contas CSC.
// O nome é fixo. Nunca usa o primeiro D1 da conta, pois poderia pertencer a outro aplicativo.
import {readFile,writeFile} from 'node:fs/promises';
const dbName='lifemag-ia-science';
const raw=JSON.parse(await readFile(process.argv[2]||'', 'utf8'));
const all=Array.isArray(raw)?raw:Array.isArray(raw.result)?raw.result:
  Array.isArray(raw.databases)?raw.databases:[];
const matches=all.filter(x=>x.name===dbName);
if(matches.length!==1)throw Error('Não foi encontrado exatamente um D1 chamado '+dbName+'.');
const id=String(matches[0].uuid||matches[0].id||'');
if(!/^[0-9a-f]{8}-[0-9a-f-]{27,36}$/i.test(id))
 throw Error('ID D1 inválido ou ausente; não modificar wrangler.');
const config=JSON.parse(await readFile('wrangler.json','utf8'));
if(config.name!=='lifemag-ia-clinico')
 throw Error('Worker não é o LifeMag IA: alteração interrompida.');
const existing=config.d1_databases||[];
if(existing.some(x=>x.binding==='SCIENCE_DB'&&x.database_name!==dbName))
 throw Error('SCIENCE_DB aponta para outra base de dados; revisão manual obrigatória.');
if(existing.some(x=>x.binding==='SCIENCE_DB'&&x.database_id&&x.database_id!==id))
 throw Error('SCIENCE_DB com ID diferente: recusa substituição automática.');
const rest=existing.filter(x=>x.binding!=='SCIENCE_DB');
config.d1_databases=[...rest,{binding:'SCIENCE_DB',database_name:dbName,database_id:id}];
await writeFile('wrangler.json',JSON.stringify(config,null,2)+'\n');
console.log('Binding SCIENCE_DB configurado para a base isolada '+dbName+'.');
