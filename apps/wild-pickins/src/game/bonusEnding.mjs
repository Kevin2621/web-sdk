// Presentation-only lookahead. A later reveal always means this is not the last spin.
export function planBonusEnding(events, reveal) {
 const at=events.indexOf(reveal);
 if(at<0 || reveal.gameType!=='freegame')return null;
 const following=events.slice(at+1);
 const end=following.findIndex(e=>e.type==='freeSpinEnd');
 if(end<0 || following.slice(0,end).some(e=>e.type==='reveal'))return null;
 const spin=following.slice(0,end);
 const result=spin.find(e=>e.type==='wildPickinsSpinResult');
 return {reason:result?.endReason || 'ordinary',
  startAt:result ? 'result' : 'landed',
  payout:spin.find(e=>e.type==='setWin')?.amount ?? 0,
  total:following[end].amount ?? 0};
}

// Milliseconds. Tune these together with the riser/summary sprite regions.
export const bonusEndingTiming={leadIn:8020,summary:8230,returnOverlap:700,duck:1200,returnFade:2000};

// Book amounts use 100 units per 1x bet. One musical statement owns each tier.
export function bonusEndingProfile(amount,timing=bonusEndingTiming,finalPayout=0){
 const total=Math.max(0,Number(amount)||0);
 const smallFinalPayout=finalPayout>0 && finalPayout<1000;
 if(total<1000)return {tier:'quiet',total,leadIn:500,summary:0,returnOverlap:0,returnFade:timing.returnFade,winLevel:total===0?1:2,countUp:total===0?0:800};
 if(total<5000)return {tier:'modest',total,leadIn:smallFinalPayout?2800:750,summary:3030,returnOverlap:0,returnFade:timing.returnFade,winLevel:4,countUp:2400};
 if(total<10000)return {tier:'strong',total,leadIn:smallFinalPayout?2800:900,summary:6034,returnOverlap:0,returnFade:timing.returnFade,winLevel:5,countUp:4800};
 return {tier:'grand',total,leadIn:timing.leadIn,summary:timing.summary,returnOverlap:timing.returnOverlap,returnFade:timing.returnFade,winLevel:total>=500000?10:total>=250000?9:total>=100000?8:total>=50000?7:6,countUp:total>=500000?7800:total>=100000?7600:total>=50000?7200:6500};
}

export function createBonusEnding({emit,now=()=>performance.now(),setTimer=setTimeout,clearTimer=clearTimeout,timing=bonusEndingTiming}) {
 let run;
 function cancel(){
  if(!run)return;
  const previous=run;run=undefined;previous.cancelResolve(false);
  for(const [timer,resolve] of previous.waits){clearTimer(timer);resolve(false);}
  previous.waits.clear();emit('cancel',previous.profile);
 }
 function arm(plan){
  cancel();
  if(plan){
   let cancelResolve;const cancelled=new Promise(resolve=>{cancelResolve=resolve;});
   run={plan,profile:bonusEndingProfile(plan.total,timing,plan.payout),started:undefined,waits:new Map(),finishing:false,cancelled,cancelResolve};
  }
 }
 function begin(stage){
  if(!run || run.started!==undefined || run.plan.startAt!==stage)return;
  run.started=now();emit('begin',run.profile);
 }
 function wait(ms,owner){
  if(run!==owner)return Promise.resolve(false);
  return new Promise(resolve=>{
   const timer=setTimer(()=>{owner.waits.delete(timer);resolve(run===owner);},Math.max(0,ms));
   owner.waits.set(timer,resolve);
  });
 }
 async function finish(reveal,total=0){
  // Resume books may contain only the ending: still provide a lead-in.
  if(!run)arm({reason:'resume',startAt:'landed',total});
  const owner=run;
  if(owner.finishing)return false;
  owner.finishing=true;
  if(owner.started===undefined){owner.started=now();emit('begin',owner.profile);}
  if(!await wait(owner.profile.leadIn-(now()-owner.started),owner))return false;
  emit('summary',owner.profile);
  // The visible summary and its music share this exact handoff.
  const presentation=Promise.resolve().then(()=>run===owner ? reveal() : undefined).then(()=>({ok:true}),error=>({error}));
  if(!await wait(owner.profile.summary-owner.profile.returnOverlap,owner))return false;
  emit('return',owner.profile);
  if(!await wait(owner.profile.returnOverlap,owner))return false;
  const result=await Promise.race([presentation,owner.cancelled]);
  if(run!==owner)return false;
  if(result?.error){cancel();throw result.error;}
  run=undefined;emit('complete',owner.profile);return true;
 }
 return {arm,begin,finish,cancel,get active(){return !!run;}};
}
