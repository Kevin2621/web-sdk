import test from 'node:test';
import assert from 'node:assert/strict';
import {extraSpinSound} from './interactionCues.mjs';
import {bonusCues} from './bonusCues.mjs';
import {presentTemplatePayout} from './templatePayout.mjs';

test('collision contact does not promise an extra spin when the budget is exhausted',()=>{
 const result={nominalRetriggerAward:0,nominalCollisionAward:3,grantedExtraSpins:0,
  collisionPositions:[{}],remaining:2,totalGranted:30,endReason:null};
 const cues=bonusCues(result,30,500000);
 assert.equal(cues[0].sound,'sfx_multiplier_explosion_a');
 assert.equal(extraSpinSound(result),null);
 assert.equal(extraSpinSound({...result,grantedExtraSpins:1}),'sfx_fs_respins');
 assert.equal(extraSpinSound({...result,grantedExtraSpins:1,endReason:'roundCap'}),null);
});

test('payout audio plays once and stops when interrupted, without changing the shown amount',async()=>{
 const events=[],controller=new AbortController();
 const emitter={broadcast:e=>events.push(e),broadcastAsync:e=>{events.push(e);return new Promise(()=>{});}};
 const pending=presentTemplatePayout({amount:1234,animate:true,signal:controller.signal,emitter,
  winLevelData:{},payoutSound:'sfx_winlevel_small'});
 controller.abort();await pending;
 assert.deepEqual(events.filter(e=>e.type.startsWith('sound')), [
  {type:'soundOnce',name:'sfx_winlevel_small'},{type:'soundStop',name:'sfx_winlevel_small'}]);
 assert.equal(events.find(e=>e.type==='winUpdate').amount,1234);
});

test('silent replay, zero payout and already aborted playback emit no reward sound',async()=>{
 for(const [amount,animate,aborted] of [[0,true,false],[100,false,false],[100,true,true]]) {
  const controller=new AbortController();if(aborted)controller.abort();
  await presentTemplatePayout({amount,animate,signal:controller.signal,emitter:{broadcast:()=>assert.fail()},
   payoutSound:'sfx_winlevel_small',winLevelData:{}});
 }
});
