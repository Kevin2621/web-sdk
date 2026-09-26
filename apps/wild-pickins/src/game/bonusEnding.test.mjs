import test from 'node:test';
import assert from 'node:assert/strict';
import {planBonusEnding,createBonusEnding} from './bonusEnding.mjs';
const reveal=()=>({type:'reveal',gameType:'freegame'});
test('lookahead uses the next actual end, never the remaining-spin counter',()=>{
 const first=reveal(),last=reveal();
 const events=[first,{type:'wildPickinsSpinResult',remaining:1,grantedExtraSpins:2},last,{type:'setWin',amount:800},{type:'freeSpinEnd'}];
 assert.equal(planBonusEnding(events,first),null);
 assert.deepEqual(planBonusEnding(events,last),{reason:'ordinary',startAt:'landed',payout:800});
 assert.equal(planBonusEnding([first],first),null);
 const base={type:'reveal',gameType:'basegame'};
 assert.equal(planBonusEnding([base,{type:'freeSpinEnd'}],base),null);
 for(const reason of ['roundCap','fullHarvest']){
  const events=[first,{type:'wildPickinsSpinResult',endReason:reason,remaining:12},{type:'freeSpinEnd'}];
  assert.equal(planBonusEnding(events,first).reason,reason);
  assert.equal(planBonusEnding(events,first).startAt,'result');
 }
});
function harness(){
 let time=0,id=0;const timers=new Map(),events=[];
 const c=createBonusEnding({emit:p=>events.push(p),now:()=>time,setTimer:(fn,ms)=>{timers.set(++id,{fn,at:time+ms});return id;},clearTimer:id=>timers.delete(id),timing:{leadIn:6000,summary:8000,returnOverlap:1000}});
 const tick=async ms=>{time+=ms;for(const [id,t] of [...timers])if(t.at<=time){timers.delete(id);t.fn();}for(let i=0;i<8;i++)await Promise.resolve();};
 return {c,events,timers,tick};
}
test('landing starts buildup, payout time counts toward lead-in, summary returns under tail',async()=>{
 const {c,events,tick}=harness();c.arm({startAt:'landed'});c.begin('landed');c.begin('landed');
 await tick(2500);const done=c.finish(()=>events.push('reveal'));
 await tick(3499);assert.deepEqual(events,['begin']);
 await tick(1);assert.deepEqual(events,['begin','summary','reveal']);
 await tick(7000);assert.equal(events.at(-1),'return');
 await tick(1000);assert.equal(await done,true);assert.equal(events.at(-1),'complete');assert.equal(c.active,false);
});
test('special result waits until explained; slow payout adds no extra lead-in',async()=>{
 const {c,events,tick}=harness();c.arm({startAt:'result'});c.begin('landed');assert.deepEqual(events,[]);
 c.begin('result');await tick(10000);const done=c.finish(()=>{});await tick(0);assert.equal(events.at(-1),'summary');
 c.cancel();assert.equal(await done,false);
});
test('cancellation during lead-in or summary resolves waits and prevents late reveals/music',async()=>{
 for(const phase of ['lead','summary','presentation']){
  const {c,events,timers,tick}=harness();c.arm({startAt:'landed'});c.begin('landed');
  const done=c.finish(()=>phase==='presentation'?new Promise(()=>{}):undefined);
  if(phase!=='lead')await tick(6000);
  if(phase==='presentation'){await tick(7000);await tick(1000);}
  c.cancel();assert.equal(await done,false);const count=events.length;
  await tick(99999);assert.equal(events.length,count);assert.equal(timers.size,0);
 }
});
test('resume-only/no-win ending gets one lead-in; replacing round cancels old work',async()=>{
 const {c,events,tick}=harness();const done=c.finish(()=>events.push('old reveal'));
 assert.deepEqual(events,['begin']);c.arm({startAt:'landed'});assert.equal(await done,false);
 c.begin('landed');await tick(99999);assert.ok(!events.includes('old reveal'));c.cancel();
});
