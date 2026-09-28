<script lang="ts">
 import { untrack } from 'svelte';
 import WinLinePresentation from '../components/WinLinePresentation.svelte';
 import { stateGameDerived } from '../game/stateGame.svelte';
 import { mapPaddedBoard } from '../game/fixtureAdapter.mjs';
 import { getWinLineTiming, type WinLineSpeed, type WinLinePayoutMode } from '../game/winLineTiming';
 import type { Position } from '../game/types';

 type Placement = 'clear' | 'center';
 let { lines, amounts, board, speed = 'base', payoutMode = 'float', payoutPlacement = 'clear' }: {
  lines:Position[][]; amounts:number[]; board:{name:string}[][];
  speed?:WinLineSpeed; payoutMode?:WinLinePayoutMode; payoutPlacement?:Placement;
 } = $props();
 const wins = $derived(lines.map((positions,index) => ({positions,amount:amounts[index]})));
 const duration = $derived(getWinLineTiming(wins.length,speed,payoutMode).totalDuration);
 let elapsed = $state(0);
 $effect(() => {
  const source = board;
  untrack(() => stateGameDerived.enhancedBoard.settle(mapPaddedBoard(source)));
 });
 $effect(() => {
  const length = duration;
  elapsed = 0;
  const startedAt = performance.now();
  let frame = 0;
  const tick = (now:number) => {
   elapsed = (now-startedAt)%length;
   frame = requestAnimationFrame(tick);
  };
  frame = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(frame);
 });
</script>

<WinLinePresentation {wins} {speed} {elapsed} {payoutMode} {payoutPlacement} />
