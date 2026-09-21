import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createFixtureBatch} from './fixtureBatch.mjs';
test('switching during a cell stops the remaining 14 cells',async()=>{
 let release;const seen=[];let cancelled=0;
 const batch=createFixtureBatch(()=>cancelled++);
 const pending=batch.play(Array.from({length:15},(_,i)=>i),async i=>{seen.push(i);await new Promise(r=>release=r);});
 batch.cancel();release();await pending;
 assert.deepEqual(seen,[0]);assert.equal(cancelled,1);
 const next=[];await batch.play(['new'],async i=>next.push(i));assert.deepEqual(next,['new']);
});
test('without cancellation every target plays once in order',async()=>{
 const batch=createFixtureBatch(()=>{});const seen=[];
 await batch.play([0,1,2],async i=>seen.push(i));assert.deepEqual(seen,[0,1,2]);
});
