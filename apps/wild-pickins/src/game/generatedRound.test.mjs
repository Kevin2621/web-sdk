import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import config from './localMathConfig.json' with {type:'json'};
import {validateGeneratedResponse,requestGeneratedRound} from './generatedRound.mjs';
const book=()=>({gameId:'wild_pickins',schemaVersion:2,fixtureMath:{paytable:{},bonusPaytable:{}},fixtureOnly:true,lineSetId:'WP-L25-experiment1',roundCap:500000,spinBudget:30,events:[{index:0,type:'wildPickinsSpinResult',spinWin:50,roundTotal:50},{index:1,type:'finalWin',amount:50}]});
const response=b=>{const bookJson=JSON.stringify(b);return {protocol:'wp-local-1',configSha256:config.configSha256,bookJson,sha256:createHash('sha256').update(bookJson).digest('hex')};};
test('admits supported transport and reconciled totals',async()=>assert.deepEqual(await validateGeneratedResponse(response(book())),book()));
test('rejects corrupted payload or wrong config',async()=>{
 const r=response(book());r.bookJson+=' ';await assert.rejects(validateGeneratedResponse(r));
 r.configSha256='other';await assert.rejects(validateGeneratedResponse(r));
});
test('rejects unsupported events, index gaps and inconsistent totals even with valid digest',async()=>{
 for(const mutate of [b=>b.events[0].index=2,b=>b.events[0].type='unknown',b=>b.events[1].amount=60,b=>b.spinBudget=31,b=>b.schemaVersion=1,b=>delete b.fixtureMath.bonusPaytable]){const b=book();mutate(b);await assert.rejects(validateGeneratedResponse(response(b)));}
});
test('request rejects mismatched round identity',async()=>{
 const previous=globalThis.fetch;
 globalThis.fetch=async()=>({ok:true,json:async()=>({seed:4,roundId:5})});
 try{await assert.rejects(requestGeneratedRound(4,6));}finally{globalThis.fetch=previous;}
});
test('weighted playback requires the pinned lookup identity',async()=>{
 const r=response(book());r.profile='reference';r.lookupSha256='bad';await assert.rejects(validateGeneratedResponse(r));
 r.lookupSha256='d9be36cc8c295ea75c9589f11cf919f9a11d0597a2870da13827a7d46a896de0';
 assert.deepEqual(await validateGeneratedResponse(r),book());
 r.profile='quieter-base';await assert.rejects(validateGeneratedResponse(r));
});
