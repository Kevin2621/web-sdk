// Present authoritative setWin amounts through the template; never add winnings here.
export async function presentTemplatePayout({amount,animate,signal,emitter,winLevelData,payoutSound,timeoutMs=4000}) {
 if(!animate||signal.aborted||amount<=0)return;
 let timer,onAbort;
 const stop=new Promise(resolve=>{
  onAbort=resolve;signal.addEventListener('abort',onAbort,{once:true});
  timer=setTimeout(resolve,timeoutMs);
 });
 try {
  if(payoutSound)emitter.broadcast({type:'soundOnce',name:payoutSound});
  emitter.broadcast({type:'winShow'});
  await Promise.race([emitter.broadcastAsync({type:'winUpdate',amount,winLevelData}),stop]);
 } finally {
  if(payoutSound)emitter.broadcast({type:'soundStop',name:payoutSound});
  clearTimeout(timer);signal.removeEventListener('abort',onAbort);
  emitter.broadcast({type:'winHide'});
 }
}
