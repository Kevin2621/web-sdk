import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {validateGeneratedResponse,requestGeneratedRound} from './generatedRound.mjs';
import config from './localMathConfig.json' with {type:'json'};
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
