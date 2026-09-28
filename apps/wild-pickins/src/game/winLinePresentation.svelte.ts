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
});

let stopCurrent: () => void = () => {};

export function cancelWinLinePresentation() {
 stopCurrent();
 winLinePresentation.active = false;
 winLinePresentation.wins = [];
}

export async function presentWinLines(wins:PresentedWinLine[], signal?:AbortSignal) {
 cancelWinLinePresentation();
 const paying = wins.filter(win => win.amount > 0 && win.positions.length > 1);
 if (!paying.length || signal?.aborted) return;
 const speed:WinLineSpeed = playerSpeed.mode === 2 ? 'ultra' : playerSpeed.mode === 1 ? 'quick' : 'base';
 const timing = getWinLineTiming(paying.length,speed,'collect');
 const revision = ++winLinePresentation.revision;
 winLinePresentation.wins = paying;
 winLinePresentation.speed = speed;
 winLinePresentation.startedAt = performance.now();
 winLinePresentation.active = true;
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
   signal?.removeEventListener('abort',finish);
   if (winLinePresentation.revision === revision) {
    winLinePresentation.active = false;
    winLinePresentation.wins = [];
   }
   release();
  };
  const releaseTimer = timing.releaseAt < timing.totalDuration ? setTimeout(release,timing.releaseAt) : undefined;
  const finishTimer = setTimeout(finish,timing.totalDuration);
  stopCurrent = finish;
  signal?.addEventListener('abort',finish,{once:true});
 });
}
