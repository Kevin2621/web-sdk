import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {validateGeneratedResponse,requestGeneratedRound} from './generatedRound.mjs';
import config from './localMathConfig.json' with {type:'json'};
import candidateProfiles from './candidateProfiles.json' with {type:'json'};
const book=()=>({gameId:'wild_pickins',schemaVersion:4,fixtureOnly:true,lineSetId:'WP-L25-experiment1',roundCap:500000,spinBudget:30,fixtureMath:{paytable:{},bonusPaytable:{},settlementPolicy:'accumulation'},entryMode:'standardBonusBuy',events:[{index:0,type:'freeSpinTrigger',spinId:-1,totalFs:10,positions:[],purchase:true},{index:1,type:'finalWin',amount:0}]});
const response=b=>{const bookJson=JSON.stringify(b);return {mode:'bonus',profile:'multiplier-wilds',protocol:'wp-local-1',configSha256:config.multiplierConfigSha256,bookJson,sha256:createHash('sha256').update(bookJson).digest('hex')};};
test('purchase transport binds mode to the explicit ten-spin entry',async()=>{
 assert.deepEqual(await validateGeneratedResponse(response(book())),book());
 for(const mutate of [b=>delete b.entryMode,b=>b.events[0].totalFs=15,b=>b.events[0].purchase=false,b=>b.events[0].spinId=0,b=>b.events[0].positions.push({reel:0,row:1})]) {
  const b=book();mutate(b);await assert.rejects(validateGeneratedResponse(response(b)));
 }
 const r=response(book());r.mode='base';await assert.rejects(validateGeneratedResponse(r));
});
test('purchase requests send the mode and reject a base response',async()=>{
 const previous=globalThis.fetch;let url;
 globalThis.fetch=async u=>{url=u;return {ok:true,json:async()=>({seed:925,roundId:1,profile:'multiplier-wilds',mode:'base'})};};
 try{await assert.rejects(requestGeneratedRound(925,1,undefined,'multiplier-wilds','bonus'));assert.equal(new URL(url).searchParams.get('mode'),'bonus');}
 finally{globalThis.fetch=previous;}
});
test('corrected purchase requires the corrected buy lookup and retains the ten-spin contract',async()=>{
 const trigger={...book(),entryMode:'base',events:[
  {index:0,type:'reveal',gameType:'basegame'},
  {index:1,type:'freeSpinTrigger',spinId:0,totalFs:10,positions:[{reel:0,row:1},{reel:1,row:1},{reel:2,row:1}]},
  {index:2,type:'reveal',gameType:'freegame'},
  {index:3,type:'finalWin',amount:0}]};
 const r=response(trigger);r.profile='candidate-corrected-1m-1';
 r.configSha256=candidateProfiles[r.profile].configHash;
 r.lookupSha256=candidateProfiles[r.profile].bonusHash;
 assert.deepEqual(await validateGeneratedResponse(r),trigger);
 r.lookupSha256=candidateProfiles[r.profile].hash;
 await assert.rejects(validateGeneratedResponse(r));
});
test('High purchase binds its lookup, 500x cost and natural five-scatter 20-spin entry',async()=>{
 const positions=Array.from({length:5},(_,reel)=>({reel,row:1}));
 const underlyingBoard=Array.from({length:5},()=>['X','S','X']);
 const high={...book(),entryMode:'base',events:[
  {index:0,type:'reveal',gameType:'basegame',underlyingBoard},
  {index:1,type:'freeSpinTrigger',spinId:0,totalFs:20,positions},
  {index:2,type:'reveal',gameType:'freegame',stickyBefore:[]},
  {index:3,type:'finalWin',amount:0}]};
 const r=response(high);r.mode='standard_bonus_buy_high';r.profile='candidate-corrected-1m-1';
 r.configSha256=candidateProfiles[r.profile].configHash;
 r.lookupSha256=candidateProfiles[r.profile].highBonusHash;
 r.tierId='standard_bonus_buy_high';r.purchaseCost=500;r.initialSpins=20;
 assert.deepEqual(await validateGeneratedResponse(r),high);
 for(const change of [v=>v.purchaseCost=50,v=>v.lookupSha256=candidateProfiles[v.profile].bonusHash,v=>v.initialSpins=10,v=>v.tierId='standard_bonus_buy_low']){
  const changed=structuredClone(r);change(changed);await assert.rejects(validateGeneratedResponse(changed));
 }
 const altered=structuredClone(high);altered.events[1].totalFs=10;
 await assert.rejects(validateGeneratedResponse({...r,bookJson:JSON.stringify(altered),sha256:createHash('sha256').update(JSON.stringify(altered)).digest('hex')}));
});
test('Medium purchase binds its lookup, 200x cost and natural four-scatter 15-spin entry',async()=>{
 const positions=Array.from({length:4},(_,reel)=>({reel,row:1}));
 const underlyingBoard=Array.from({length:5},(_,reel)=>['X',reel<4?'S':'X','X']);
 const medium={...book(),entryMode:'base',events:[
  {index:0,type:'reveal',gameType:'basegame',underlyingBoard},
  {index:1,type:'freeSpinTrigger',spinId:0,totalFs:15,positions},
  {index:2,type:'reveal',gameType:'freegame',stickyBefore:[]},
  {index:3,type:'finalWin',amount:0}]};
 const r=response(medium);r.mode='standard_bonus_buy_medium';r.profile='candidate-corrected-1m-1';
 r.configSha256=candidateProfiles[r.profile].configHash;
 r.lookupSha256=candidateProfiles[r.profile].mediumBonusHash;
 r.tierId='standard_bonus_buy_medium';r.purchaseCost=200;r.initialSpins=15;
 assert.deepEqual(await validateGeneratedResponse(r),medium);
 for(const change of [v=>v.purchaseCost=50,v=>v.lookupSha256=candidateProfiles[v.profile].highBonusHash,v=>v.initialSpins=20,v=>v.tierId='standard_bonus_buy_high']){
  const changed=structuredClone(r);change(changed);await assert.rejects(validateGeneratedResponse(changed));
 }
 const altered=structuredClone(medium);altered.events[1].totalFs=20;
 await assert.rejects(validateGeneratedResponse({...r,bookJson:JSON.stringify(altered),sha256:createHash('sha256').update(JSON.stringify(altered)).digest('hex')}));
});
