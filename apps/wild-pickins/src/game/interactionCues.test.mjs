import test from 'node:test';
import assert from 'node:assert/strict';
import {extraSpinSound} from './interactionCues.mjs';
import {bonusCues} from './bonusCues.mjs';

test('collision contact does not promise an extra spin when the budget is exhausted',()=>{
 const result={nominalRetriggerAward:0,nominalCollisionAward:3,grantedExtraSpins:0,
  collisionPositions:[{}],remaining:2,totalGranted:30,endReason:null};
 const cues=bonusCues(result,30,500000);
 assert.equal(cues[0].sound,'sfx_multiplier_explosion_a');
 assert.equal(extraSpinSound(result),null);
 assert.equal(extraSpinSound({...result,grantedExtraSpins:1}),'sfx_fs_respins');
 assert.equal(extraSpinSound({...result,grantedExtraSpins:1,endReason:'roundCap'}),null);
});
