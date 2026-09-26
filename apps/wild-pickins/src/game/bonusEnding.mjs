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
  payout:spin.find(e=>e.type==='setWin')?.amount ?? 0};
}

// Milliseconds. Tune these together with the riser/summary sprite regions.
export const bonusEndingTiming={leadIn:6000,summary:8230,returnOverlap:1100,duck:800,returnFade:1100};

export function createBonusEnding({emit,now=()=>performance.now(),setTimer=setTimeout,clearTimer=clearTimeout,timing=bonusEndingTiming}) {
 let run;
 function cancel(){
  if(!run)return;
  const previous=run;run=undefined;previous.cancelResolve(false);
  for(const [timer,resolve] of previous.waits){clearTimer(timer);resolve(false);}
  previous.waits.clear();emit('cancel');
 }
 function arm(plan){
  cancel();
  if(plan){
   let cancelResolve;const cancelled=new Promise(resolve=>{cancelResolve=resolve;});
   run={plan,started:undefined,waits:new Map(),finishing:false,cancelled,cancelResolve};
  }
 }
 function begin(stage){
  if(!run || run.started!==undefined || run.plan.startAt!==stage)return;
  run.started=now();emit('begin');
 }
 function wait(ms,owner){
  if(run!==owner)return Promise.resolve(false);
  return new Promise(resolve=>{
   const timer=setTimer(()=>{owner.waits.delete(timer);resolve(run===owner);},Math.max(0,ms));
   owner.waits.set(timer,resolve);
  });
 }
 async function finish(reveal){
  // Resume books may contain only the ending: still provide a lead-in.
  if(!run)arm({reason:'resume',startAt:'landed'});
  const owner=run;
  if(owner.finishing)return false;
  owner.finishing=true;
  if(owner.started===undefined){owner.started=now();emit('begin');}
  if(!await wait(timing.leadIn-(now()-owner.started),owner))return false;
  emit('summary');
  // The visible summary and its music share this exact handoff.
  const presentation=Promise.resolve().then(()=>run===owner ? reveal() : undefined).then(()=>({ok:true}),error=>({error}));
  if(!await wait(timing.summary-timing.returnOverlap,owner))return false;
  emit('return');
  if(!await wait(timing.returnOverlap,owner))return false;
  const result=await Promise.race([presentation,owner.cancelled]);
  if(run!==owner)return false;
  if(result?.error){cancel();throw result.error;}
  run=undefined;emit('complete');return true;
 }
 return {arm,begin,finish,cancel,get active(){return !!run;}};
}
