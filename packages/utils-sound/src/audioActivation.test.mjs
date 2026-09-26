import test from 'node:test';
import assert from 'node:assert/strict';
import {installAudioActivation} from './audioActivation.mjs';

test('a real gesture restores the visible-page audio gate even if the context already runs',()=>{
 let activate,restored=0;
 const cleanup=installAudioActivation({getContext:()=>({state:'running'}),onActivate:()=>restored++,
  target:{addEventListener:(_,fn)=>activate=fn,removeEventListener:()=>{}}});
 activate();assert.equal(restored,1);cleanup();
});

test('a user gesture resumes a suspended context, including a replacement context',async()=>{
 const listeners=new Map();let resumes=0;
 const target={addEventListener:(event,fn)=>listeners.set(event,fn),removeEventListener:event=>listeners.delete(event)};
 let context={state:'suspended',resume:async()=>{resumes++;}};
 const cleanup=installAudioActivation({getContext:()=>context,target});
 await listeners.get('pointerdown')();assert.equal(resumes,1);
 context={state:'interrupted',resume:async()=>{resumes++;}};
 await listeners.get('keydown')();assert.equal(resumes,2);
 context={state:'running',resume:()=>assert.fail()};listeners.get('touchend')();
 context=null;listeners.get('pointerdown')();
 cleanup();assert.equal(listeners.size,0);
});

test('a denied activation is retried on the next gesture without an unhandled rejection',async()=>{
 let listener,attempts=0;
 const cleanup=installAudioActivation({getContext:()=>({state:'suspended',resume:async()=>{attempts++;throw Error('blocked');}}),
  target:{addEventListener:(_,fn)=>listener=fn,removeEventListener:()=>{}}});
 await listener();await listener();assert.equal(attempts,2);cleanup();
});
