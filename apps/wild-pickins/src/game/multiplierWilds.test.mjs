import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mapVisibleBoard,mapPaddedBoard} from './fixtureAdapter.mjs';
import {validateGeneratedResponse} from './generatedRound.mjs';
import config from './localMathConfig.json' with {type:'json'};
import {bonusCues} from './bonusCues.mjs';

test('full-board continuation explains collisions without a top-up or early ending',()=>{
 const r={endReason:null,nominalScatterWin:0,scatterWin:0,nominalRetriggerAward:0,nominalCollisionAward:15,grantedExtraSpins:9,totalGranted:30,remaining:9,collisionPositions:Array.from({length:15},(_,i)=>({reel:Math.floor(i/3),row:i%3}))};
 const cues=bonusCues(r,30,500000);
 assert.match(cues[0].text,/15 FREE SPINS/);
 assert.match(cues[1].text,/9 of 15 extra spins granted/);
 assert.ok(cues.every(c=>!c.text.includes('HARVEST')&&!c.text.includes('topped up')));
});

test('scatter cash is explained alongside collisions and when clipped by the cap',()=>{
 const result={scatterPositions:[{reel:0,row:0},{reel:1,row:0},{reel:2,row:0}],nominalScatterWin:200,scatterWin:200,nominalRetriggerAward:0,nominalCollisionAward:1,grantedExtraSpins:1,collisionPositions:[{reel:4,row:1}],remaining:4,totalGranted:11};
 const cues=bonusCues(result,30,500000);
 assert.match(cues[0].text,/3 SCATTERS · 2× BET/);
 assert.match(cues[1].text,/WILD COLLISION/);
 const capped=bonusCues({...result,scatterWin:50,endReason:'roundCap',roundTotal:500000,grantedExtraSpins:0},30,500000);
 assert.match(capped[0].text,/0.5× BET paid of 2×/);
 assert.match(capped.at(-1).text,/no extra spins granted/);
});

test('Wild values survive reveal and final-board mapping',()=>{
 const board=Array.from({length:5},()=>['C01','C02','C03']);board[0][1]='W';board[4][2]='W';
 const mapped=mapVisibleBoard(board,[{reel:0,row:1,multiplier:1},{reel:4,row:2,multiplier:3}]);
 assert.deepEqual(mapped[0][2],{name:'W',multiplier:1});
 assert.deepEqual(mapped[4][3],{name:'W',multiplier:3});
 assert.deepEqual(mapPaddedBoard([[{name:'W',multiplier:2}]]),[[{name:'W',multiplier:2}]]);
});

test('new profile requires schema 4 and complete valid Wild values',async()=>{
 const b={gameId:'wild_pickins',schemaVersion:4,fixtureOnly:true,lineSetId:'WP-L25-experiment1',roundCap:500000,spinBudget:30,fixtureMath:{paytable:{},bonusPaytable:{},settlementPolicy:'accumulation'},events:[{index:0,type:'wildPickinsSpinResult',spinWin:0,lineWin:0,scatterWin:0,harvestTopUp:0,roundTotal:0,finalBoard:Array.from({length:5},()=>['W','C01','C02']),wildMultipliers:Array.from({length:5},(_,reel)=>({reel,row:0,multiplier:2}))},{index:1,type:'finalWin',amount:0}]};
 const response=book=>{const bookJson=JSON.stringify(book);return {profile:'multiplier-wilds',protocol:'wp-local-1',configSha256:config.multiplierConfigSha256,bookJson,sha256:createHash('sha256').update(bookJson).digest('hex')};};
 assert.deepEqual(await validateGeneratedResponse(response(b)),b);
 for(const mutate of [x=>x.schemaVersion=3,x=>delete x.fixtureMath.settlementPolicy,x=>x.events[0].harvestTopUp=1,x=>x.events[0].endReason='fullHarvest',x=>x.events[0].lineWin=1,x=>x.events[0].wildMultipliers.pop(),x=>x.events[0].wildMultipliers[0].multiplier=4,x=>x.events[0].wildMultipliers.push(x.events[0].wildMultipliers[0])]){
  const bad=structuredClone(b);mutate(bad);await assert.rejects(validateGeneratedResponse(response(bad)));
 }
});
