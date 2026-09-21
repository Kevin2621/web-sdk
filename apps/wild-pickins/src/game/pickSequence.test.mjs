import {test} from 'node:test';
import assert from 'node:assert/strict';
import {runPickSequence} from './pickSequence.mjs';
for(const animate of [true,false]) test(`commit exactly once animate=${animate}`,async()=>{
 let commits=0,clears=0; const phases=[];
 await runPickSequence({animate,frame:p=>phases.push(p),commit:()=>commits++,clear:()=>clears++,wait:async()=>{}});
 assert.equal(commits,1);assert.equal(clears,1);
 assert.deepEqual([...new Set(phases)],animate?['mark','grip','lift','reveal']:[]);
});
test('animation failure commits final target and cleans up',async()=>{
 let commits=0,clears=0;
 await assert.rejects(runPickSequence({frame:()=>{},wait:async()=>{throw Error('animation');},commit:()=>commits++,clear:()=>clears++}));
 assert.equal(commits,1);assert.equal(clears,1);
});
test('abort never commits an old target into another story',async()=>{
 const c=new AbortController();let commits=0,clears=0;
 await runPickSequence({signal:c.signal,frame:()=>{},wait:async()=>c.abort(),commit:()=>commits++,clear:()=>clears++});
 assert.equal(commits,0);assert.equal(clears,1);
});
test('commit failure still clears presentation',async()=>{
 let clears=0;
 await assert.rejects(runPickSequence({animate:false,frame:()=>{},wait:async()=>{},commit:()=>{throw Error('commit');},clear:()=>clears++}));
 assert.equal(clears,1);
});
