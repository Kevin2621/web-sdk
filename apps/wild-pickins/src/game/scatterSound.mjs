/** Reveal boards have one hidden padding symbol at each end of every reel. */
export function visibleScatterCount(board) {
 return board.reduce((total,reel)=>total+reel.slice(1,-1).filter(symbol=>symbol.name==='S'&&!symbol.skipLanding).length,0);
}

export function shouldPlayReelStop({ultra,baseGame,anticipated,scatter}) {
 return !ultra && !(baseGame&&anticipated&&scatter);
}

/** Drive anticipation from actual scatter and final-reel impacts. */
export function createScatterSound({play,startRiser=()=>{},stopRiser=()=>{},startTick=()=>{},stopTick=()=>{},onSecondScatter=()=>{},onFinalScatter=()=>{},onFinalImpact=()=>{},onMiss=()=>{}}) {
 let total=0,landed=0,anticipating=false,baseGame=false,secondHeard=false;
 function reset(){stopRiser();stopTick();total=0;landed=0;anticipating=false;baseGame=false;secondHeard=false;}
 return {
  start(count,isBaseGame,hasAnticipation=false){
   reset();
   total=Math.min(5,Math.max(0,count));baseGame=isBaseGame;
   anticipating=baseGame&&total>=2&&hasAnticipation;
  },
  land(){
   if(landed>=total)return;
   landed++;
   // Every visible scatter gets its own landing hit, including a lone scatter.
   play(`sfx_scatter_stop_${landed}`);
   if(anticipating&&landed===2){secondHeard=true;startRiser();startTick();onSecondScatter();}
   if(anticipating&&total>=3&&landed===total)onFinalScatter(`sfx_scatter_stop_${landed}`);
  },
  finalImpact(){
   if(!anticipating||!secondHeard)return;
   stopTick();
   onFinalImpact();
   if(total===2)onMiss();
  },
  reset,
 };
}
