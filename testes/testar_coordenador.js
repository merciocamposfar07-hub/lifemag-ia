'use strict';
const assert=require('node:assert/strict');
async function main(){
 const {LifeMagIngestionCoordinator}=await import('../worker/ingestion-coordinator.js');
 let alarm=null,lastStart=0,calls=[];
 const data=new Map();
 const storage={
  getAlarm:async()=>alarm,
  setAlarm:async at=>{alarm=at},
  get:async key=>data.get(key),
  put:async(key,value)=>{data.set(key,value)}
 };
 const library={
  recordScheduledRun:async item=>{calls.push(item);return {ok:true}}
 };
 const env={SCIENCE_LIBRARY:{getByName:()=>library}};
 const job=new LifeMagIngestionCoordinator({storage},env);
 const first=await job.enqueue();
 assert.equal(first.status,'scheduled');
 assert.ok(alarm>Date.now());
 assert.equal((await job.enqueue()).status,'already_scheduled');
 // Simula o disparo do alarme sem Workers AI vinculado:
 // não deve buscar PDFs nem registrar conteúdo aprovado.
 const outcome=await job.alarm();
 assert.equal(outcome.status,'not_configured');
 assert.equal(calls[0].status,'started');
 assert.equal(calls.at(-1).status,'not_configured');
 assert.equal((await job.enqueue()).status,'already_scheduled');
 console.log('Coordenador científico: agendamento, auditoria e bloqueio sem IA verificados');
}
main().catch(error=>{console.error(error);process.exitCode=1});
