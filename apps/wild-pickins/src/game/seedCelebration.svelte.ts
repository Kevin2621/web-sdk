import { CURTAIN_HANDOFF } from './seedCurtain.mjs';
export const seedCelebration = $state({
 active:false,progress:0,displayAward:0,award:0,waiting:false,continuing:false,
 bursts:0,burstSource:'',exitProgress:-1,sprayProgress:-1,
});
let finishCurrent:(()=>void)|undefined;
let resumeCurrent:(()=>void)|undefined;
let completePop:(()=>void)|undefined;
let burstCurrent:(()=>void)|undefined;
export function completeSeedContinue(){completePop?.();}
export function seedBagBurst(source:string){
 if(!seedCelebration.active)return;
 seedCelebration.bursts++;seedCelebration.burstSource=source;
 if(source==='reward')burstCurrent?.();
}
export function continueSeedCelebration(){resumeCurrent?.();}
export function cancelSeedCelebration(){finishCurrent?.();}
export async function celebrateSeeds(award:number,signal?:AbortSignal,onCovered?:()=>void, emitSound:(event:{type:'soundOnce'|'soundStop';name:'jng_intro_fs'|'sfx_bonus_yeehaw'|'sfx_bonus_open'|'sfx_bonus_close'|'sfx_fs_respins'})=>void=()=>{}){
 cancelSeedCelebration();if(signal?.aborted)return;
 Object.assign(seedCelebration,{active:true,progress:0,displayAward:0,award,waiting:false,continuing:false,bursts:0,burstSource:'',exitProgress:-1,sprayProgress:-1});
 emitSound({type:'soundOnce',name:'jng_intro_fs'});
 const start=performance.now();
 let cheered=false,opened=false,locked=false,lastCount=0;
 await new Promise<void>(resolve=>{
  let frame=0,finished=false,covered=false,popFinished=false;
  let clickAt:number|undefined,burstAt:number|undefined;
  const done=()=>{
   if(finished)return;finished=true;cancelAnimationFrame(frame);
   signal?.removeEventListener('abort',done);
   finishCurrent=resumeCurrent=completePop=burstCurrent=undefined;
   for (const name of ['jng_intro_fs','sfx_bonus_yeehaw','sfx_bonus_open','sfx_bonus_close','sfx_fs_respins'] as const) emitSound({type:'soundStop',name});
   seedCelebration.active=false;seedCelebration.waiting=false;seedCelebration.continuing=false;
   resolve();
  };
  finishCurrent=done;
  const tick=(now:number)=>{
   if(signal?.aborted){done();return;}
   if(clickAt!==undefined){
    // Spine normally starts the spray. A delayed/missing renderer must not trap Continue.
    if(burstAt===undefined&&now-clickAt>=350)burstAt=clickAt+300;
    if(burstAt!==undefined){
     seedCelebration.sprayProgress=Math.min(1,(now-burstAt)/650);
     let exit=Math.max(0,Math.min(1,(now-burstAt-180)/1400));
     if(!covered&&exit>CURTAIN_HANDOFF+.1){
      // Prepare the bonus while its reward overlay is still fully opaque.
      exit=CURTAIN_HANDOFF;burstAt=now-180-CURTAIN_HANDOFF*1400;
     }
     seedCelebration.exitProgress=exit;
     seedCelebration.progress=.78+.22*exit;
     if(!covered&&exit>=CURTAIN_HANDOFF){covered=true;onCovered?.();}
     if(finished)return;
     if(exit>=1&&(popFinished||now-clickAt>=1200)){done();return;}
    }
   }else{
    const elapsed=now-start;
    if(!cheered && elapsed>=2200){cheered=true;emitSound({type:'soundOnce',name:'sfx_bonus_yeehaw'});}
    if(!opened && elapsed>=4300){opened=true;emitSound({type:'soundOnce',name:'sfx_bonus_open'});}
    if(elapsed>=4560 && seedCelebration.displayAward<award && now-lastCount>=140){
     lastCount=now;seedCelebration.displayAward++;
     emitSound({type:'soundOnce',name:'sfx_fs_respins'});
    }
    if(seedCelebration.displayAward===award && !locked){locked=true;emitSound({type:'soundOnce',name:'sfx_bonus_close'});}
    seedCelebration.progress=Math.min(.78,(now-start)/8000);
    if(seedCelebration.progress>=.78 && locked){
     seedCelebration.waiting=true;
     resumeCurrent=()=>{
      resumeCurrent=undefined;clickAt=performance.now();
      seedCelebration.waiting=false;seedCelebration.continuing=true;
      completePop=()=>{popFinished=true;completePop=undefined;};
      burstCurrent=()=>{if(burstAt===undefined)burstAt=performance.now();};
      frame=requestAnimationFrame(tick);
     };
     return;
    }
   }
   frame=requestAnimationFrame(tick);
  };
  signal?.addEventListener('abort',done,{once:true});
  frame=requestAnimationFrame(tick);
 });
}
