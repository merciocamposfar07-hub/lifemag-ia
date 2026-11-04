// Somente para testes Node: simula a classe base sem acessar Cloudflare.
// Em produção, Wrangler resolve import real de "cloudflare:workers".
export async function resolve(specifier,context,nextResolve){
 if(specifier==='cloudflare:workers')return {
  url:'data:text/javascript,export class DurableObject { constructor(ctx, env){this.ctx=ctx;this.env=env} }',
  shortCircuit:true
 };
 return nextResolve(specifier,context);
}
