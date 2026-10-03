import {test} from 'node:test';import assert from 'node:assert/strict';
import {bonusCues} from './bonusCues.mjs';
const result={nominalRetriggerAward:7,nominalCollisionAward:1,grantedExtraSpins:8,scatterPositions:[{},{},{},{}],collisionPositions:[{}],remaining:11,totalGranted:18,endReason:null};
test('scatter and collision have ordered independent explanations',()=>{
 const cues=bonusCues(result,30,100000);assert.match(cues[0].text,/4 SCATTERS.*\+7/);assert.match(cues[1].text,/COLLISION.*\+1/);assert.match(cues[2].text,/\+8 TOTAL/);
 assert.notEqual(cues[0].sound,cues[1].sound);
});
test('clipping distinguishes nominal from granted awards',()=>{
 const cues=bonusCues({...result,grantedExtraSpins:2},30,100000);assert.match(cues[0].text,/Nominal/);assert.match(cues[2].text,/2 of 8/);
});
test('terminal result explains cap without promising extra spins',()=>{
 const cues=bonusCues({...result,endReason:'roundCap',roundTotal:8,grantedExtraSpins:0},30,8);
 assert.match(cues[0].text,/0.08×/);assert.match(cues[1].text,/no extra spins granted/);assert.ok(cues.every(c=>!c.text.includes('+7')));
});
test('no award produces no cue',()=>assert.deepEqual(bonusCues({...result,nominalCollisionAward:0,nominalRetriggerAward:0},30,100000),[]));
