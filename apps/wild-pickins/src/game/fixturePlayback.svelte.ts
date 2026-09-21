import { bonusWin, resetBonusWin, startBonusWin } from './bonusWin.svelte';
import { getWinTiming } from './playerSpeed.svelte';
import { celebrateSeeds } from './seedCelebration.svelte';
import { scatterAnticipation } from './scatterAnticipation';
import { presentTemplatePayout } from './templatePayout.mjs';
import { winLevelMap } from './winLevelMap';
import { validateGeneratedResponse } from './generatedRound.mjs';
import config from './config';
import { bonusCues } from './bonusCues.mjs';
import type { SoundEffectName } from './sound';
import { validateBonusFixture } from './bonusFixtureAdapter.mjs';
import { createFixtureBatch } from './fixtureBatch.mjs';
import { runPickSequence } from './pickSequence.mjs';
import { stateBet } from 'state-shared';
import { stateGame, stateGameDerived } from './stateGame.svelte';
import { eventEmitter } from './eventEmitter';
import { mapPaddedBoard, mapVisibleBoard, validateBaseFixture } from './fixtureAdapter.mjs';
import type { RawSymbol } from './types';

export const fixturePlayback = $state({ linePayouts:[] as {amount:number;positions:{reel:number;row:number}[];line:number}[], busy:false, error:'', status:'Ready', pick:null as null | {reel:number;row:number;phase:string;progress:number;crop:string}, roundTotal:0, bonusTotal:0, remaining:0, completed:0, granted:0, budget:0, inBonus:false, releasingSticky:false, rolling:false, message:'', cuePositions:[] as {reel:number;row:number}[], collisions:[] as {reel:number;row:number}[], sticky:[] as {reel:number;row:number}[] });
let controller: AbortController | null = null;
export function cancelFixturePlayback() {
 controller?.abort();
 eventEmitter.broadcast({type:'winSignHide'});
 fixturePlayback.linePayouts=[];
 stateGame.activePayline=[];
 eventEmitter.broadcast({type:'winHide'});
 stateGameDerived.enhancedBoard.stop();
 fixturePlayback.releasingSticky=false; fixturePlayback.rolling=false; fixturePlayback.pick=null; fixturePlayback.collisions=[]; fixturePlayback.cuePositions=[]; fixturePlayback.sticky=[]; fixturePlayback.inBonus=false; fixturePlayback.remaining=0; fixturePlayback.completed=0; fixturePlayback.message='';
 stateGame.gameType='basegame';
 for(const reel of stateGame.board) for(const symbol of reel.reelState.symbols) symbol.symbolState='static';
 fixturePlayback.status='Cancelled';
}
const batch = createFixtureBatch(cancelFixturePlayback);
export const cancelFixtureAction = () => batch.cancel();
export const playFixtureBatch = (books: unknown[]) => batch.play(books, playBaseFixture);
const delay = (ms:number) => new Promise<void>(resolve=>setTimeout(resolve,ms));

export const playBaseFixture = (input: unknown, options: {animate?:boolean} = {}) => playFixture(input, options);
export const playBonusFixture = (input: unknown, options: {animate?:boolean;startAtBonus?:boolean} = {}) => playFixture(input, {...options,bonus:true});

export const playGeneratedRound = (response: unknown, options: {animate?:boolean} = {}) => playFixture(response, {...options,generated:true});

async function playFixture(input: unknown, options: {animate?:boolean;bonus?:boolean;generated?:boolean;startAtBonus?:boolean} = {}) {
 if (fixturePlayback.busy) return;
 resetBonusWin();
 fixturePlayback.error='';
 fixturePlayback.busy=true;
 const run = new AbortController(); controller=run;
 try { if(options.generated) input=await validateGeneratedResponse(input); else if(options.bonus) await validateBonusFixture(input); else validateBaseFixture(input); } catch(error) {
  controller=null; fixturePlayback.busy=false;
  fixturePlayback.error=String(error); throw error;
 }
 const book = input as {events: Array<Record<string, any>>};
 if(run.signal.aborted) { controller=null; fixturePlayback.busy=false; return; }
 fixturePlayback.busy=true; fixturePlayback.releasingSticky=false; fixturePlayback.roundTotal=0; fixturePlayback.bonusTotal=0; fixturePlayback.remaining=0; fixturePlayback.completed=0; fixturePlayback.granted=0; fixturePlayback.sticky=[]; fixturePlayback.inBonus=false; fixturePlayback.message=''; fixturePlayback.budget=(input as {spinBudget:number}).spinBudget; stateBet.winBookEventAmount=0;
 const presentedWins=new Set<number>();
 const animate=options.animate!==false;
 try {
  // Validate the complete source book first; preview only skips its base-game lead-in.
  const bonusStart=options.startAtBonus ? book.events.findIndex(e=>e.type==='freeSpinTrigger') : 0;
  if(bonusStart<0)throw Error('Bonus preview requires a bonus trigger');
  for(const e of book.events.slice(bonusStart)) {
   if(run.signal.aborted) return;
   fixturePlayback.status=e.type;
   if(e.type==='reveal') {
    if(e.gameType==='basegame') eventEmitter.broadcast({type:'winSignHide'});
    stateGame.gameType=e.gameType;
    fixturePlayback.message=''; fixturePlayback.collisions=[]; fixturePlayback.cuePositions=[];
    const mapped = mapPaddedBoard(e.board) as RawSymbol[][];
    for(const p of e.stickyBefore) mapped[p.reel][p.row+1].suppressFixtureLanding=true;
    for(const reel of mapped) { reel[0].suppressFixtureLanding=true; reel[4].suppressFixtureLanding=true; }
    if(animate) {
     fixturePlayback.rolling=true;
     try {
      await stateGameDerived.enhancedBoard.spin({revealEvent:{index:e.index,type:'reveal',board:mapped,anticipation:scatterAnticipation(mapped, stateBet.isTurbo),paddingPositions:e.paddingPositions},paddingBoard:config.paddingReels[e.gameType as keyof typeof config.paddingReels]});
     } finally { stateGame.activePayline=[]; fixturePlayback.rolling=false; }
    } else stateGameDerived.enhancedBoard.settle(mapped);
   } else if(e.type==='goldenCropPick') {
    await runPickSequence({animate,signal:run.signal,wait:delay,
     frame:(phase:string,progress:number)=>{ fixturePlayback.pick={...e.target,phase,progress,crop:e.expectedCrop}; },
     commit:()=>stateGameDerived.enhancedBoard.settle(mapVisibleBoard(e.visibleAfterPick) as RawSymbol[][]),
     clear:()=>{fixturePlayback.pick=null;}
    });
   } else if(e.type==='wildPickinsSpinResult') {
    stateGameDerived.enhancedBoard.settle(mapVisibleBoard(e.finalBoard) as RawSymbol[][]);
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
    if(animate && fixturePlayback.inBonus) await delay(cues.length ? 700 : 650);
   } else if(e.type==='winInfo') {
    // Present the union of all paying cells once, regardless of line count.
    if(animate && e.wins.length) {
     try {
      for(const w of e.wins) for(const p of w.positions) stateGame.board[p.reel].reelState.symbols[p.row].symbolState='win';
      // Present the authoritative spin award while the symbols are raised.
      // Full Harvest setWin may include a top-up beyond winInfo.totalWin.
      const after=book.events.slice(book.events.indexOf(e)+1);
      const nextReveal=after.findIndex(event=>event.type==='reveal');
      const award=after.slice(0,nextReveal<0?undefined:nextReveal).find(event=>event.type==='setWin');
     
      fixturePlayback.linePayouts=e.wins.map((w:any,i:number)=>({amount:w.win,positions:w.positions,line:w.meta?.lineIndex??i+1}));
      const lineTotal=fixturePlayback.linePayouts.reduce((sum,w)=>sum+w.amount,0);
      if(award && award.amount>lineTotal)fixturePlayback.linePayouts.push({amount:award.amount-lineTotal,line:0,positions:[{reel:2,row:2}]});
      await delay(getWinTiming().paylines);
      if(run.signal.aborted)return;
      fixturePlayback.linePayouts=[];
      if(award){
       presentedWins.add(award.index);
       await presentTemplatePayout({amount:fixturePlayback.inBonus ? fixturePlayback.roundTotal : award.amount,animate,signal:run.signal,emitter:eventEmitter,winLevelData:{...winLevelMap[2],presentDuration:350}});
      }
     } finally {
      fixturePlayback.linePayouts=[];
      for(const reel of stateGame.board) for(const symbol of reel.reelState.symbols) symbol.symbolState='static';
     }
    }
   } else if(e.type==='freeSpinTrigger') {
    startBonusWin();
    fixturePlayback.inBonus=true; fixturePlayback.sticky=[];
    fixturePlayback.completed=0;
    fixturePlayback.remaining=e.totalFs; fixturePlayback.granted=e.totalFs;
    fixturePlayback.message=`${e.totalFs} FREE SPINS`;
    if(animate){eventEmitter.broadcast({type:'soundOnce',name:'sfx_scatter_win_v2'});await celebrateSeeds(e.totalFs,run.signal,()=>{stateGame.gameType='freegame';});}
   } else if(e.type==='freeSpinEnd') {
    bonusWin.amount=e.amount;
    fixturePlayback.message=`BONUS COMPLETE · ${e.amount/100}×`;
    if(animate) await delay(1000);
    if(run.signal.aborted) return;
    if(animate && fixturePlayback.sticky.length) {
     fixturePlayback.releasingSticky=true;
     await delay(320);
     if(run.signal.aborted)return;
    }
    fixturePlayback.releasingSticky=false;
    fixturePlayback.sticky=[]; fixturePlayback.collisions=[]; fixturePlayback.cuePositions=[]; fixturePlayback.inBonus=false; fixturePlayback.remaining=0; stateGame.gameType='basegame';
   } else if(e.type==='setWin' && options.generated && !presentedWins.has(e.index)) {
    // Generated winLevel=1 is a math placeholder. Use the template's ordinary
    // count-up for local review, without inventing big-win thresholds or awards.
    if(e.amount>0) await presentTemplatePayout({amount:fixturePlayback.inBonus ? fixturePlayback.roundTotal : e.amount,animate,signal:run.signal,emitter:eventEmitter,winLevelData:winLevelMap[2]});
   } else if(e.type==='setTotalWin') {
    stateBet.winBookEventAmount=e.amount;
   }
  }
  fixturePlayback.status='Complete';
 } catch(error) { fixturePlayback.error=String(error); throw error; }
 finally { stateGame.activePayline=[]; fixturePlayback.rolling=false; controller=null; fixturePlayback.pick=null; fixturePlayback.busy=false; eventEmitter.broadcast({type:'stopButtonEnable'}); }
}
