// Coordenador de ingestão: CPU de Durable Object e alarmes persistentes.
// O SQLite clínico/científico permanece separado; jamais recebe dados de pacientes.
import {DurableObject} from 'cloudflare:workers';
import {runAnvisaAutoSync} from './anvisa-auto-sync.js';

const WINDOW_MS=10*60*1000;
export class LifeMagIngestionCoordinator extends DurableObject{
 constructor(ctx,env){
  super(ctx,env);
  this.ctx=ctx;
  this.env=env;
 }
 async enqueue(retryFailed=false){
  // Retry antecipado só ocorre a pedido do usuário autenticado; limite 10 min.
  // Cloudflare permite um alarme ativo por Durable Object.
  // Impede acionamentos repetidos e preserva franquias gratuitas.
  const pending=await this.ctx.storage.getAlarm();
  if(pending!=null&&pending>Date.now())
   return {status:'already_scheduled',scheduledFor:new Date(pending).toISOString()};
  const last=Number(await this.ctx.storage.get('lastStartedAt')||0);
  if(last&&Date.now()-last<WINDOW_MS)
   return {status:'recently_started',scheduledFor:new Date(last).toISOString()};
  const schedule=Date.now()+1000;
  if(retryFailed)await this.ctx.storage.put('retryFailedRequested',true);
  await this.ctx.storage.setAlarm(schedule);
  return {status:'scheduled',scheduledFor:new Date(schedule).toISOString()};
 }
 async alarm(){
  const timestamp=new Date().toISOString();
  await this.ctx.storage.put('lastStartedAt',Date.now());
  const library=this.env.SCIENCE_LIBRARY?.getByName('lifemag-main');
  if(library)try{
   await library.recordScheduledRun({status:'started',at:timestamp,
    detail:'Coleta automática em Durable Object iniciada'});
  }catch(_){}
  const retryFailed=await this.ctx.storage.get('retryFailedRequested')===true;
  await this.ctx.storage.put('retryFailedRequested',false);
  let outcome;
  try{outcome=await runAnvisaAutoSync(this.env,new Date(),undefined,{retryFailed})}
  catch(_){outcome={status:'failed',attempted:false}}
  if(library)try{
   await library.recordScheduledRun({
    status:outcome.status==='not_configured'?'not_configured':
     outcome.status==='failed'?'failed':'finished',
    at:new Date().toISOString(),
    detail:JSON.stringify({
     outcome:outcome.status,documentId:outcome.documentId||null,
     attempted:outcome.attempted===true
    }).slice(0,210)
   });
  }catch(_){}
  return outcome;
 }
}
