/** Reveal boards have one hidden padding symbol at each end of every reel. */
export function visibleScatterCount(board) {
 return board.reduce((total,reel)=>total+reel.slice(1,-1).filter(symbol=>symbol.name==='S'&&!symbol.suppressFixtureLanding).length,0);
}

/** Count actual impacts, not reel indexes. No timer predicts when a reel will land. */
export function createScatterSound({play,setBaseGain,startRiser=()=>{},stopRiser=()=>{}}) {
 let total=0,landed=0,duck=false,quiet=false;
 function reset(){stopRiser();total=0;landed=0;duck=false;quiet=false;setBaseGain(1,250);}
 return {
  start(count,baseGame){
   stopRiser();
   total=Math.min(5,Math.max(0,count));landed=0;duck=baseGame&&total>=3;quiet=baseGame&&total<3;
   // Begin backing off as soon as the authoritative reveal is known.
   setBaseGain(duck ? 0.9 : 1,250);
  },
  planRiser(duration){if(duck&&landed<total)startRiser(duration);},
  land(){
   if(landed>=total)return;
   landed++;
   if(landed===total)stopRiser();
   // Set silence before the last impact; also exact during turbo/simultaneous stops.
   if(duck)setBaseGain(1-landed/total,landed===total?0:180);
   // Ordinary base scatters already have a reel thump; reserve guitars for a bonus.
   if(!quiet)play(`sfx_scatter_stop_${landed}`);
  },
  reset,
 };
}

/** Align a one-shot to reel travel, but let the actual final impact cancel its tail. */
export function createScatterRiser({play,stop,duration,setTimer=setTimeout,clearTimer=clearTimeout}) {
 let timer;
 function cancel(){if(timer!==undefined)clearTimer(timer);timer=undefined;stop();}
 return {
  cancel,
  plan(travel){
   cancel();
   if(!Number.isFinite(travel)||travel<=0)return;
   const clip=duration();
   if(!Number.isFinite(clip)||clip<=0)return;
   const rate=Math.min(4,Math.max(1,clip/travel));
   const delay=Math.max(0,travel-clip/rate);
   if(delay===0)play(rate);
   else timer=setTimer(()=>{timer=undefined;play(rate);},delay);
  },
 };
}
