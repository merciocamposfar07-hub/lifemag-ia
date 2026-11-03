// Constrói assets do aplicativo para hospedagem no MESMO domínio do Worker.
// Não publica testes, backend, SQL, scripts ou documentação como arquivos estáticos.
import {mkdir,copyFile} from 'node:fs/promises';
const files=['index.html','src/app.js','src/store.js','src/style.css','assets/icone-oficial-escuro.png'];
for(const file of files){
  const destination='public/'+file;
  await mkdir(destination.slice(0,destination.lastIndexOf('/')),{recursive:true});
  await copyFile(file,destination);
}
console.log('Assets da aplicação preparados para ambiente privado Cloudflare Access.');
