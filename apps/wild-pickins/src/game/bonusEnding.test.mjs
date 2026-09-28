import test from 'node:test';
import assert from 'node:assert/strict';
import {planBonusEnding,bonusEndingProfile,createBonusEnding} from './bonusEnding.mjs';
const reveal=()=>({type:'reveal',gameType:'freegame'});
test('lookahead uses the next actual end, never the remaining-spin counter',()=>{
 const first=reveal(),last=reveal();
 const events=[first,{type:'wildPickinsSpinResult',remaining:1,grantedExtraSpins:2},last,{type:'setWin',amount:800},{type:'freeSpinEnd',amount:7200}];
 assert.equal(planBonusEnding(events,first),null);
 assert.deepEqual(planBonusEnding(events,last),{reason:'ordinary',startAt:'landed',payout:800,total:7200});
 assert.equal(planBonusEnding([first],first),null);
 const base={type:'reveal',gameType:'basegame'};
 assert.equal(planBonusEnding([base,{type:'freeSpinEnd'}],base),null);
 for(const reason of ['roundCap','fullHarvest']){
  const events=[first,{type:'wildPickinsSpinResult',endReason:reason,remaining:12},{type:'freeSpinEnd'}];
  assert.equal(planBonusEnding(events,first).reason,reason);
  assert.equal(planBonusEnding(events,first).startAt,'result');
 }
});
test('bonus ending intensity follows the accumulated payout, not the final spin or stale win level',()=>{
 assert.deepEqual([0,999,1000,4999,5000,9999,10000,50000,100000].map(amount=>bonusEndingProfile(amount).tier),
  ['quiet','quiet','modest','modest','strong','strong','grand','grand','grand']);
 assert.equal(bonusEndingProfile(0).winLevel,1);
 assert.equal(bonusEndingProfile(7200).winLevel,5);
 assert.equal(bonusEndingProfile(100000).winLevel,8);
 assert.equal(bonusEndingProfile(500000).winLevel,10);
 assert.equal(bonusEndingProfile(800).summary,0);
 assert.equal(bonusEndingProfile(1000).summary,3030);
 assert.equal(bonusEndingProfile(7200,undefined,500).leadIn,2800);
 assert.equal(bonusEndingProfile(7200,undefined,1200).leadIn,900);
 assert.ok(bonusEndingProfile(100000).countUp<bonusEndingProfile(100000).summary);
 assert.ok(bonusEndingProfile(7200).countUp<bonusEndingProfile(7200).summary);
});
function harness(){
 let time=0,id=0;const timers=new Map(),events=[];
 const c=createBonusEnding({emit:(p,profile)=>events.push({phase:p,tier:profile.tier}),now:()=>time,setTimer:(fn,ms)=>{timers.set(++id,{fn,at:time+ms});return id;},clearTimer:id=>timers.delete(id),timing:{leadIn:8020,summary:8230,returnOverlap:700,returnFade:2000}});
 const tick=async ms=>{time+=ms;for(const [id,t] of [...timers])if(t.at<=time){timers.delete(id);t.fn();}for(let i=0;i<8;i++)await Promise.resolve();};
 return {c,events,timers,tick};
}
test('landing starts buildup, payout time counts toward lead-in, summary returns under tail',async()=>{
 const {c,events,tick}=harness();c.arm({startAt:'landed',total:100000});c.begin('landed');c.begin('landed');
 await tick(2500);const done=c.finish(()=>events.push({phase:'reveal'}));
 await tick(5519);assert.deepEqual(events,[{phase:'begin',tier:'grand'}]);
 await tick(1);assert.deepEqual(events,[{phase:'begin',tier:'grand'},{phase:'summary',tier:'grand'},{phase:'reveal'}]);
 await tick(7530);assert.equal(events.at(-1).phase,'return');
 await tick(700);assert.equal(await done,true);assert.equal(events.at(-1).phase,'complete');assert.equal(c.active,false);
});
test('special result waits until explained; slow payout adds no extra lead-in',async()=>{
 const {c,events,tick}=harness();c.arm({startAt:'result',total:100000});c.begin('landed');assert.deepEqual(events,[]);
 c.begin('result');await tick(10000);const done=c.finish(()=>{});await tick(0);assert.equal(events.at(-1).phase,'summary');
 c.cancel();assert.equal(await done,false);
});
test('small bonus exits without an eight-second anticipation or sting',async()=>{
 const {c,events,tick}=harness();c.arm({startAt:'landed',total:400});c.begin('landed');
 const done=c.finish(()=>events.push({phase:'reveal'}));
 await tick(500);assert.equal(events.at(-2).phase,'summary');
 await tick(0);assert.equal(events.at(-1).phase,'return');
 await tick(0);assert.equal(await done,true);
 assert.deepEqual(events.filter(e=>e.tier).map(e=>e.tier),['quiet','quiet','quiet','quiet']);
});
test('a final small payout clears before a stronger total-win tune',async()=>{
 const {c,events,tick}=harness();c.arm({startAt:'landed',total:7200,payout:500});c.begin('landed');
 const done=c.finish(()=>events.push({phase:'reveal'}));
 await tick(2799);assert.deepEqual(events,[{phase:'begin',tier:'strong'}]);
 await tick(1);assert.equal(events.at(-2).phase,'summary');
 c.cancel();assert.equal(await done,false);
});
test('cancellation during lead-in or summary resolves waits and prevents late reveals/music',async()=>{
 for(const phase of ['lead','summary','presentation']){
  const {c,events,timers,tick}=harness();c.arm({startAt:'landed',total:100000});c.begin('landed');
  const done=c.finish(()=>phase==='presentation'?new Promise(()=>{}):undefined);
  if(phase!=='lead')await tick(8020);
  if(phase==='presentation'){await tick(7530);await tick(700);}
  c.cancel();assert.equal(await done,false);const count=events.length;
  await tick(99999);assert.equal(events.length,count);assert.equal(timers.size,0);
 }
});
test('resume-only/no-win ending gets one lead-in; replacing round cancels old work',async()=>{
 const {c,events,tick}=harness();const done=c.finish(()=>events.push('old reveal'));
 assert.deepEqual(events,[{phase:'begin',tier:'quiet'}]);c.arm({startAt:'landed'});assert.equal(await done,false);
 c.begin('landed');await tick(99999);assert.ok(!events.includes('old reveal'));c.cancel();
});
