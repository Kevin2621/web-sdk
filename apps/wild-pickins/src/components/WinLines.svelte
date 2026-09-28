<script lang="ts">
 import { onDestroy } from 'svelte';
 import WinLinePresentation from './WinLinePresentation.svelte';
 import { winLinePresentation, cancelWinLinePresentation } from '../game/winLinePresentation.svelte';
 import { getWinLineTiming } from '../game/winLineTiming';

 let { layer = 'board' }: { layer?: 'board' | 'total' } = $props();
 let elapsed = $state(0);
 onDestroy(cancelWinLinePresentation);
 $effect(() => {
  if (!winLinePresentation.active) return;
  const revision = winLinePresentation.revision;
  const startedAt = winLinePresentation.startedAt;
  const duration = getWinLineTiming(winLinePresentation.wins.length,winLinePresentation.speed,'collect').totalDuration;
  elapsed = 0;
  let frame = 0;
  const tick = (now:number) => {
   if (winLinePresentation.revision !== revision) return;
   elapsed = Math.min(duration,now-startedAt);
   if (elapsed < duration) frame = requestAnimationFrame(tick);
  };
  frame = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(frame);
 });
</script>

{#if winLinePresentation.active}
 <WinLinePresentation wins={winLinePresentation.wins} speed={winLinePresentation.speed} {elapsed} {layer} />
{/if}
