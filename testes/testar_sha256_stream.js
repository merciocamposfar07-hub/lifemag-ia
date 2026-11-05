'use strict';
const assert=require('node:assert/strict');
const {createHash,randomBytes}=require('node:crypto');
async function run(){
 const {sha256BlobHex}=await import('../worker/sha256-stream.js');
 const cases=[
  new Uint8Array([]),new TextEncoder().encode('abc'),
  new TextEncoder().encode('A'.repeat(55)),
  new TextEncoder().encode('A'.repeat(56)),
  new TextEncoder().encode('A'.repeat(64)),
  new TextEncoder().encode('A'.repeat(65)),
  randomBytes(257),randomBytes(131072),randomBytes(2*1024*1024+13)
 ];
 for(const bytes of cases){
  const expected=createHash('sha256').update(bytes).digest('hex');
  assert.equal(await sha256BlobHex(new Blob([bytes])),expected);
  assert.equal(await sha256BlobHex(Uint8Array.from(bytes).buffer),expected);
  console.log('PASSOU: SHA-256 Blob/ArrayBuffer '+bytes.length+' bytes');
 }
 assert.equal(await sha256BlobHex(new Blob([new TextEncoder().encode('abc')])),
  'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
 console.log('SHA-256 incremental: '+cases.length+' arquivos comparados com Node crypto');
}
run().catch(e=>{console.error(e);process.exitCode=1});
