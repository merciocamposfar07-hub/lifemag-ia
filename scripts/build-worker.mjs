// LifeMag IA: empacotar apenas assets permitidos DENTRO do Worker.
// A Cloudflare fornece ctx.access apenas ao Worker diretamente invocado;
// Static Assets (roteador intermediário) não repassa essa identidade.
// Nenhum arquivo de banco, documentação, teste ou segredo é distribuído.
import {readFile,mkdir,writeFile} from 'node:fs/promises';
const files=[
  ['index.html','text/html; charset=utf-8'],
  ['manifest.webmanifest','application/manifest+json; charset=utf-8'],
  ['src/app.js','application/javascript; charset=utf-8'],
  ['src/store.js','application/javascript; charset=utf-8'],
  ['src/style.css','text/css; charset=utf-8'],
  ['assets/icone-oficial-escuro.png','image/png']
];
const entries={};
for(const [filename,type] of files){
  const contents=await readFile(filename);
  const binary=type==='image/png';
  entries['/'+filename]={type,encoding:binary?'base64':'utf8',
    body:binary?contents.toString('base64'):contents.toString('utf8')};
}
const output='// Gerado automaticamente: não editar. Somente arquivos públicos da interface.\n'
  +'export const STATIC_ASSETS='+JSON.stringify(entries)+';\n';
await mkdir('worker',{recursive:true});
await writeFile('worker/assets.generated.mjs',output);
console.log('Interface LifeMag IA empacotada em Worker protegido: '+files.length+' arquivos, '+output.length+' caracteres.');
