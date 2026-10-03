import { normalizeReplay } from './replay.mjs';
import { AUDIO_WORKBENCH_ENABLED } from './audioWorkbenchEnabled';
import { audioWorkbench } from './audioWorkbench.svelte';
import { bonusEnding } from './bonusEndingController';
import { bonusEndingProfile, planBonusEnding } from './bonusEnding.mjs';
import { bonusWin, resetBonusWin, startBonusWin } from './bonusWin.svelte';
import { presentWinLines, cancelWinLinePresentation } from './winLinePresentation.svelte';
import { celebrateSeeds, seedCelebration } from './seedCelebration.svelte';
import { scatterAnticipation } from './scatterAnticipation';
import { validateGeneratedResponse } from './generatedRound.mjs';
import config from './config';
import { bonusCues } from './bonusCues.mjs';
import { extraSpinSound } from './interactionCues.mjs';
import type { SoundEffectName } from './sound';
import { validateBonusFixture } from './bonusFixtureAdapter.mjs';
import { createFixtureBatch } from './fixtureBatch.mjs';
import { runPickSequence } from './pickSequence.mjs';
import { stateBet } from 'state-shared';
import { stateGame, stateGameDerived, wildLandingInstances } from './stateGame.svelte';
import { eventEmitter } from './eventEmitter';
import { mapPaddedBoard, mapVisibleBoard, validateBaseFixture } from './fixtureAdapter.mjs';
import type { RawSymbol } from './types';

export const fixtureWilds = $state({multipliers:[] as {reel:number;row:number;multiplier:number}[]});

export const fixturePlayback = $state({ linePayouts:[] as {amount:number;positions:{reel:number;row:number}[];line:number;multiplier?:number;label?:string}[], busy:false, error:'', status:'Ready', pick:null as null | {reel:number;row:number;phase:string;progress:number;crop:string}, roundTotal:0, bonusTotal:0, remaining:0, completed:0, granted:0, budget:0, inBonus:false, releasingSticky:false, instantSticky:false, rolling:false, message:'', cuePositions:[] as {reel:number;row:number}[], collisions:[] as {reel:number;row:number}[], sticky:[] as {reel:number;row:number}[] });
let controller: AbortController | null = null;
export function cancelFixturePlayback() {
	seedCelebration.openTriggerBags=[];
 fixtureWilds.multipliers=[];
 controller?.abort();
 cancelWinLinePresentation();
 eventEmitter.broadcast({type:'soundInteractionsStop'});
 fixturePlayback.linePayouts=[];
 stateGame.activePayline=[];
 stateGameDerived.enhancedBoard.stop();
 fixturePlayback.releasingSticky=false; fixturePlayback.instantSticky=false; fixturePlayback.rolling=false; fixturePlayback.pick=null; fixturePlayback.collisions=[]; fixturePlayback.cuePositions=[]; fixturePlayback.sticky=[]; fixturePlayback.inBonus=false; fixturePlayback.remaining=0; fixturePlayback.completed=0; fixturePlayback.message='';
 stateGame.gameType='basegame';
 eventEmitter.broadcast({type:'soundMusic',name:'bgm_main'});
 for(const reel of stateGame.board) for(const symbol of reel.reelState.symbols) symbol.symbolState='static';
 fixturePlayback.status='Cancelled';
}
const batch = createFixtureBatch(cancelFixturePlayback);
export const cancelFixtureAction = () => batch.cancel();
export const playFixtureBatch = (books: unknown[]) => batch.play(books, playBaseFixture);
const delay = (ms:number) => new Promise<void>(resolve=>setTimeout(resolve,ms));

async function finishWildLandingsAt(positions: {reel:number;row:number}[], signal: AbortSignal) {
 const newCells = new Set(positions.map(p => `${p.reel}:${p.row + 1}`));
 const landings = wildLandingInstances.active.filter(landing =>
  newCells.has(`${landing.reelIndex}:${landing.symbol.symbolIndex}`));
 if (!landings.length) return;
 const until = performance.now() + 1200;
 while (!signal.aborted && landings.some(landing => !landing.finished) && performance.now() < until)
  await delay(16);
 for (const landing of landings) wildLandingInstances.remove(landing.id);
}

export const playBaseFixture = (input: unknown, options: {animate?:boolean} = {}) => playFixture(input, options);
export const playBonusFixture = (input: unknown, options: {animate?:boolean;startAtBonus?:boolean} = {}) => playFixture(input, {...options,bonus:true});

export const playGeneratedRound = (response: unknown, options: {animate?:boolean} = {}) => playFixture(response, {...options,generated:true});

export const playReplayRound = (data: unknown) => playFixture(data, {replay:true,generated:true});

async function playFixture(input: unknown, options: {animate?:boolean;bonus?:boolean;generated?:boolean;startAtBonus?:boolean;replay?:boolean} = {}) {
 if (fixturePlayback.busy) return;
 bonusEnding.cancel();
 resetBonusWin();
 fixturePlayback.error='';
 fixturePlayback.busy=true;
 const run = new AbortController(); controller=run;
 run.signal.addEventListener('abort',()=>bonusEnding.cancel(),{once:true});
 let originalInput: unknown;
 try {
  // Storybook supplies args as reactive proxies; structuredClone rejects them.
  originalInput=import.meta.env.DEV && input != null ? JSON.parse(JSON.stringify(input)) : undefined;
  if(options.replay) input=normalizeReplay(input).book; else if(options.generated) input=await validateGeneratedResponse(input); else if(options.bonus) await validateBonusFixture(input); else validateBaseFixture(input);
 } catch(error) {
  controller=null; fixturePlayback.busy=false;
  fixturePlayback.error=String(error); throw error;
 }
 const book = input as {events: Array<Record<string, any>>};
 if(import.meta.env.DEV && book.events.some(e=>e.type==='freeSpinTrigger'))
  if(AUDIO_WORKBENCH_ENABLED)audioWorkbench.lastBonus={input:originalInput,options:{bonus:!!options.bonus,generated:!!options.generated}};
 if(run.signal.aborted) { controller=null; fixturePlayback.busy=false; return; }
 fixturePlayback.busy=true; fixturePlayback.releasingSticky=false; fixturePlayback.roundTotal=0; fixturePlayback.bonusTotal=0; fixturePlayback.remaining=0; fixturePlayback.completed=0; fixturePlayback.granted=0; fixturePlayback.sticky=[]; fixturePlayback.inBonus=false; fixturePlayback.message=''; fixturePlayback.budget=(input as {spinBudget:number}).spinBudget; stateBet.winBookEventAmount=0;
 const presentedWins=new Set<number>();
 const animate=options.animate!==false;
 fixturePlayback.instantSticky=!animate;
 try {
  // Validate the complete source book first; preview only skips its base-game lead-in.
  const bonusStart=options.startAtBonus ? book.events.findIndex(e=>e.type==='freeSpinTrigger') : 0;
  if(bonusStart<0)throw Error('Bonus preview requires a bonus trigger');
  for(const e of book.events.slice(bonusStart)) {
   if(run.signal.aborted) return;
   fixturePlayback.status=e.type;
   if(e.type==='reveal') {
    if(animate)bonusEnding.arm(planBonusEnding(book.events,e));
    stateGame.gameType=e.gameType;
    fixturePlayback.message=''; fixturePlayback.collisions=[]; fixturePlayback.cuePositions=[];
    const mapped = mapPaddedBoard(e.board) as RawSymbol[][];
    for(const p of e.stickyBefore) mapped[p.reel][p.row+1].suppressFixtureLanding=true;
    for(const reel of mapped) { reel[0].suppressFixtureLanding=true; reel[4].suppressFixtureLanding=true; }
    if(animate) {
     fixturePlayback.rolling=true;
     try {
      await stateGameDerived.enhancedBoard.spin({revealEvent:{index:e.index,type:'reveal',board:mapped,anticipation:scatterAnticipation(mapped, stateBet.isTurbo),paddingPositions:e.paddingPositions},paddingBoard:config.paddingReels[e.gameType as keyof typeof config.paddingReels]});
      seedCelebration.openTriggerBags=[];
      if(!run.signal.aborted)bonusEnding.begin('landed');
     } finally { stateGame.activePayline=[]; fixturePlayback.rolling=false; }
    } else {stateGameDerived.enhancedBoard.settle(mapped);seedCelebration.openTriggerBags=[];}
   } else if(e.type==='goldenCropPick') {
    await runPickSequence({animate,signal:run.signal,wait:delay,
     frame:(phase:string,progress:number)=>{ fixturePlayback.pick={...e.target,phase,progress,crop:e.expectedCrop}; },
     commit:()=>stateGameDerived.enhancedBoard.settle(mapVisibleBoard(e.visibleAfterPick,e.wildMultipliers) as RawSymbol[][]),
     clear:()=>{fixturePlayback.pick=null;}
    });
   } else if(e.type==='wildPickinsSpinResult') {
    const retained = new Set(fixturePlayback.sticky.map(p => `${p.reel}:${p.row}`));
    const addedSticky = (e.stickyAfter as {reel:number;row:number}[]).filter(p => !retained.has(`${p.reel}:${p.row}`));
    if(animate && addedSticky.length) await finishWildLandingsAt(addedSticky,run.signal);
    if(run.signal.aborted)return;
    fixtureWilds.multipliers=e.wildMultipliers??[];
    stateGameDerived.enhancedBoard.settle(mapVisibleBoard(e.finalBoard,e.wildMultipliers) as RawSymbol[][]);
    fixturePlayback.roundTotal=e.roundTotal;
    fixturePlayback.bonusTotal=e.bonusTotal;
    if(bonusWin.visible)bonusWin.amount=e.bonusTotal;
    fixturePlayback.sticky=e.stickyAfter;
    fixturePlayback.collisions=e.collisionPositions;
    const cues=bonusCues(e,fixturePlayback.budget,(input as {roundCap:number}).roundCap);
    try {
     for(const cue of cues) {
      if(run.signal.aborted) return;
      fixturePlayback.message=cue.text;
      fixturePlayback.cuePositions=cue.positions;
      if(animate) {
       if(cue.sound) eventEmitter.broadcast({type:'soundOnce',name:cue.sound as SoundEffectName});
       await delay(1600);
      }
     }
    } finally { fixturePlayback.cuePositions=[]; }
    if(run.signal.aborted) return;
    // Assign the authoritative counter once after explaining every source.
    fixturePlayback.completed=e.completedBonusSpins;
    fixturePlayback.remaining=e.remaining;
    fixturePlayback.granted=e.totalGranted;
    const grantSound=extraSpinSound(e);
    if(animate && grantSound) {
     fixturePlayback.remaining=e.remaining-e.grantedExtraSpins;
     fixturePlayback.granted=e.totalGranted-e.grantedExtraSpins;
     for(let i=0;i<e.grantedExtraSpins;i++){
      if(run.signal.aborted)return;
      fixturePlayback.remaining++;fixturePlayback.granted++;
      eventEmitter.broadcast({type:'soundOnce',name:grantSound});await delay(140);
     }
    }
    if(animate && fixturePlayback.inBonus) await delay(cues.length ? 700 : 650);
    if(animate && !run.signal.aborted)bonusEnding.begin('result');
   } else if(e.type==='winInfo') {
    // Show each paying line and merge their amounts before the next payout step.
    if(animate && e.wins.length) {
     try {
      // Full Harvest setWin may include a top-up beyond the paying line total.
      const after=book.events.slice(book.events.indexOf(e)+1);
      const nextReveal=after.findIndex(event=>event.type==='reveal');
      const award=after.slice(0,nextReveal<0?undefined:nextReveal).find(event=>event.type==='setWin');
     
      const lineTotal=e.wins.reduce((sum:number,w:any)=>sum+w.win,0);
      const spinPayout = award?.amount ?? e.totalWin ?? lineTotal;
      if(spinPayout>0 && (!fixturePlayback.inBonus || spinPayout<1000)) eventEmitter.broadcast({type:'soundOnce',name:'sfx_money_drop'});
      await presentWinLines(e.wins.map((w:any)=>({amount:w.win,positions:w.positions})),run.signal);
      if(run.signal.aborted)return;
      if(award){
       presentedWins.add(award.index);
       if(fixturePlayback.inBonus && award.amount>=1000 && !bonusEnding.active) eventEmitter.broadcast({type:'soundOnce',name:'sfx_money_pour'});
      }
     } finally {
      if(run.signal.aborted) cancelWinLinePresentation();
     }
    }
   } else if(e.type==='freeSpinTrigger') {
    await eventEmitter.broadcastAsync({type:'soundBonusEntryReady'});
    startBonusWin();
    fixturePlayback.inBonus=true; fixturePlayback.sticky=[];
    fixturePlayback.completed=0;
    fixturePlayback.remaining=e.totalFs; fixturePlayback.granted=e.totalFs;
    fixturePlayback.message=`${e.totalFs} FREE SPINS`;
    if(animate){await celebrateSeeds(e.totalFs,run.signal,()=>{stateGame.gameType='freegame';},event=>eventEmitter.broadcast(event));if(!run.signal.aborted)eventEmitter.broadcast({type:'soundMusic',name:'bgm_freespin'});}
    else {stateGame.gameType='freegame';eventEmitter.broadcast({type:'soundMusic',name:'bgm_freespin'});}
   } else if(e.type==='freeSpinEnd') {
    const revealSummary=()=>{
     bonusWin.amount=e.amount;
     fixturePlayback.message=`BONUS COMPLETE · ${e.amount/100}×`;
    };
    if(animate){
     if(!await bonusEnding.finish(revealSummary,e.amount) || run.signal.aborted)return;
    }else {
     revealSummary();
     const tier=bonusEndingProfile(e.amount).tier;
     eventEmitter.broadcast({type:'soundBonusEnding',phase:'summary',tier});
     eventEmitter.broadcast({type:'soundBonusEnding',phase:'return',tier});
     eventEmitter.broadcast({type:'soundBonusEnding',phase:'complete',tier});
    }
    if(animate && fixturePlayback.sticky.length) {
     fixturePlayback.releasingSticky=true;
     await delay(320);
     if(run.signal.aborted)return;
    }
    fixturePlayback.releasingSticky=false;
    fixturePlayback.sticky=[]; fixturePlayback.collisions=[]; fixturePlayback.cuePositions=[]; fixturePlayback.inBonus=false; fixturePlayback.remaining=0; stateGame.gameType='basegame';
   } else if(e.type==='setWin' && options.generated && !presentedWins.has(e.index)) {
    // Standalone generated payouts still get their sound; setTotalWin updates the HUD.
    if(animate && e.amount>0 && (!fixturePlayback.inBonus || e.amount<1000 || !bonusEnding.active)) eventEmitter.broadcast({type:'soundOnce',name:!fixturePlayback.inBonus || e.amount<1000?'sfx_money_drop':'sfx_money_pour'});
   } else if(e.type==='setTotalWin') {
    stateBet.winBookEventAmount=e.amount;
   }
  }
  fixturePlayback.status='Complete';
 } catch(error) { bonusEnding.cancel();eventEmitter.broadcast({type:'soundInteractionsStop'}); fixturePlayback.error=String(error); throw error; }
 finally { stateGame.activePayline=[]; fixturePlayback.rolling=false; controller=null; fixturePlayback.pick=null; fixturePlayback.busy=false; eventEmitter.broadcast({type:'stopButtonEnable'}); }
}

// Reuses the exact validated event book; no new math-server request or wagering.
export async function replayAudioBonus(){
 const saved=audioWorkbench.lastBonus;
 if(!saved || fixturePlayback.busy)return;
 await playFixture(structuredClone(saved.input),{...saved.options,animate:true,startAtBonus:true});
}
