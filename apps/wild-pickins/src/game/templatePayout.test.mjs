import test from 'node:test';
import assert from 'node:assert/strict';
import {presentTemplatePayout} from './templatePayout.mjs';
for(const amount of [40,100,600])test(`template receives ${amount} book units unchanged`,async()=>{
 const events=[];const emitter={broadcast:e=>events.push(e),broadcastAsync:async e=>events.push(e)};
 await presentTemplatePayout({amount,animate:true,signal:new AbortController().signal,emitter,winLevelData:{}});
 assert.deepEqual(events.map(e=>e.type),['winShow','winUpdate','winHide']);assert.equal(events[1].amount,amount);
});
test('abort releases a stalled template and hides it',async()=>{
 const c=new AbortController(),events=[];
 const p=presentTemplatePayout({amount:40,animate:true,signal:c.signal,emitter:{broadcast:e=>events.push(e.type),broadcastAsync:()=>new Promise(()=>{})},winLevelData:{}});
 c.abort();await p;assert.deepEqual(events,['winShow','winHide']);
});
test('zero and animation-disabled results do not animate',async()=>{
 for(const [amount,animate] of [[0,true],[100,false]])await presentTemplatePayout({amount,animate,signal:new AbortController().signal,emitter:{broadcast:()=>assert.fail()},winLevelData:{}});
});
