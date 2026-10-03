import { playerSpeed } from './playerSpeed.svelte';
import { getWinLineTiming, type WinLineSpeed } from './winLineTiming';
import type { Position } from './types';

export type PresentedWinLine = {positions:Position[];amount:number};
export const winLinePresentation = $state({
 active:false,
 wins:[] as PresentedWinLine[],
 speed:'base' as WinLineSpeed,
 startedAt:0,
 revision:0,
 elapsed:0,
 darkness:0,
 boardReleased:false,
 winnerKeys:new Set<string>(),
 previewOnly:false,
});

let stopCurrent: () => void = () => {};
let animationFrame = 0;

const ease = (value:number) => {
 const t = Math.max(0,Math.min(1,value));
 return t*t*(3-2*t);
};

function visualState(elapsed:number, timing:ReturnType<typeof getWinLineTiming>, speed:WinLineSpeed) {
 return {
  darkness:elapsed < timing.schedule.dim
   ? ease(elapsed/timing.schedule.dim)
   : elapsed < timing.lightStart ? 1
   : 1-ease((elapsed-timing.lightStart)/timing.schedule.light),
  boardReleased:speed === 'ultra' && timing.collect && elapsed >= timing.lightStart + timing.schedule.light,
 };
}

export function showWinLinePreview(wins:PresentedWinLine[], elapsed:number, speed:WinLineSpeed, payoutMode:'collect'|'float') {
 const visual = visualState(elapsed,getWinLineTiming(wins.length,speed,payoutMode),speed);
 winLinePresentation.active = true;
 winLinePresentation.previewOnly = true;
 winLinePresentation.wins = wins;
 winLinePresentation.speed = speed;
 winLinePresentation.elapsed = elapsed;
 winLinePresentation.winnerKeys = new Set(wins.flatMap(win => win.positions.map(p => `${p.reel}:${p.row}`)));
 winLinePresentation.darkness = visual.darkness;
 winLinePresentation.boardReleased = visual.boardReleased;
}

export function hideWinLinePreview() {
 if (winLinePresentation.previewOnly) cancelWinLinePresentation();
}

export function cancelWinLinePresentation() {
 stopCurrent();
 winLinePresentation.active = false;
 winLinePresentation.previewOnly = false;
 winLinePresentation.wins = [];
 winLinePresentation.darkness = 0;
 winLinePresentation.boardReleased = false;
 winLinePresentation.winnerKeys = new Set();
 cancelAnimationFrame(animationFrame);
}

export async function presentWinLines(wins:PresentedWinLine[], signal?:AbortSignal) {
 cancelWinLinePresentation();
 const paying = wins.filter(win => win.amount > 0 && win.positions.length > 1);
 if (!paying.length || signal?.aborted) return;
 const speed:WinLineSpeed = playerSpeed.mode === 2 ? 'ultra' : playerSpeed.mode === 1 ? 'quick' : 'base';
 const timing = getWinLineTiming(paying.length,speed,'collect');
 const revision = ++winLinePresentation.revision;
 winLinePresentation.wins = paying;
 winLinePresentation.previewOnly = false;
 winLinePresentation.speed = speed;
 winLinePresentation.startedAt = performance.now();
 winLinePresentation.elapsed = 0;
 winLinePresentation.winnerKeys = new Set(paying.flatMap(win => win.positions.map(p => `${p.reel}:${p.row}`)));
 winLinePresentation.active = true;
 const tick = (now:number) => {
  if (winLinePresentation.revision !== revision || !winLinePresentation.active) return;
  const elapsed = Math.min(timing.totalDuration,now-winLinePresentation.startedAt);
  winLinePresentation.elapsed = elapsed;
  const visual = visualState(elapsed,timing,speed);
  winLinePresentation.darkness = visual.darkness;
  winLinePresentation.boardReleased = visual.boardReleased;
  if (elapsed < timing.totalDuration) animationFrame = requestAnimationFrame(tick);
 };
 animationFrame = requestAnimationFrame(tick);
 await new Promise<void>(resolve => {
  let released = false;
  let finished = false;
  const release = () => {
   if (released) return;
   released = true;
   resolve();
  };
  const finish = () => {
   if (finished) return;
   finished = true;
   clearTimeout(releaseTimer);
   clearTimeout(finishTimer);
   cancelAnimationFrame(animationFrame);
   signal?.removeEventListener('abort',finish);
   if (winLinePresentation.revision === revision) {
    winLinePresentation.active = false;
    winLinePresentation.wins = [];
    winLinePresentation.darkness = 0;
    winLinePresentation.boardReleased = false;
    winLinePresentation.winnerKeys = new Set();
   }
   release();
  };
  const releaseTimer = timing.releaseAt < timing.totalDuration ? setTimeout(release,timing.releaseAt) : undefined;
  const finishTimer = setTimeout(finish,timing.totalDuration);
  stopCurrent = finish;
  signal?.addEventListener('abort',finish,{once:true});
 });
}
