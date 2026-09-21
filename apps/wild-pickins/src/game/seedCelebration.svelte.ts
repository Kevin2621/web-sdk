export const seedCelebration = $state({ active: false, progress: 0, award: 0, waiting: false });
let finishCurrent: (() => void) | undefined;
let resumeCurrent: (() => void) | undefined;
export function continueSeedCelebration(){resumeCurrent?.();}
export function cancelSeedCelebration(){finishCurrent?.();}
export async function celebrateSeeds(award: number, signal?: AbortSignal, onCovered?: () => void) {
 cancelSeedCelebration();
 if(signal?.aborted)return;
 seedCelebration.award=award;seedCelebration.active=true;seedCelebration.waiting=false;seedCelebration.progress=0;
 let start=performance.now(), covered=false, confirmed=false;
 await new Promise<void>(resolve=>{
  let frame=0;
  const done=()=>{
   cancelAnimationFrame(frame);signal?.removeEventListener('abort',done);
   finishCurrent=undefined;resumeCurrent=undefined;
   seedCelebration.waiting=false;seedCelebration.active=false;resolve();
  };
  finishCurrent=done;
  const tick=(now:number)=>{
   if(signal?.aborted){done();return;}
   const progress=Math.min(1,(now-start)/8000);
   seedCelebration.progress=progress;
   if(!covered&&progress>=.47){covered=true;onCovered?.();}
   if(!confirmed&&progress>=.78){
    seedCelebration.progress=.78;seedCelebration.waiting=true;
    resumeCurrent=()=>{
     confirmed=true;seedCelebration.waiting=false;resumeCurrent=undefined;
     start=performance.now()-.78*8000;frame=requestAnimationFrame(tick);
    };
    return;
   }
   if(progress<1)frame=requestAnimationFrame(tick);else done();
  };
  signal?.addEventListener('abort',done,{once:true});
  frame=requestAnimationFrame(tick);
 });
}
