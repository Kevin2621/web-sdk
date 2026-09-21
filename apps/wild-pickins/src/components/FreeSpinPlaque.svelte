<script lang="ts">
 import { playerMotion } from '../game/playerMotion.svelte';

 import { onDestroy } from 'svelte';
 import { seedCelebration } from '../game/seedCelebration.svelte';
 import { getContext } from '../game/context';
 import { playerLanguage } from '../game/playerLanguage.svelte';
 import { playerLabel } from '../game/playerLabels';
 let { count }: { count: string | number } = $props();
 const context = getContext();
 // Match ScatterThud's screen-space displacement, independently of the entrance bounce.
 let thudX = $state(0), thudY = $state(0);
 let thudFrame = 0;
 context.eventEmitter.subscribeOnMount({
  scatterLandingThud: () => {
   cancelAnimationFrame(thudFrame);
   thudX=0; thudY=0;
   if(playerMotion.shakeDisabled)return;
   const start=performance.now();
   const tick=(now:number)=>{
    if(playerMotion.shakeDisabled){thudX=0;thudY=0;return;}
    const t=Math.min(1,(now-start)/220);
    const decay=(1-t)*(1-t);
    thudX=1.5*Math.sin(t*Math.PI*6)*decay;
    thudY=5*Math.sin(t*Math.PI*5)*decay;
    if(t<1)thudFrame=requestAnimationFrame(tick);
    else {thudX=0;thudY=0;}
   };
   thudFrame=requestAnimationFrame(tick);
  },
 });
 onDestroy(()=>cancelAnimationFrame(thudFrame));
 const layout = $derived(context.stateLayoutDerived.mainLayout());
 const board = $derived(context.stateGameDerived.boardLayout());
 const width = $derived(board.width * 0.48 * layout.scale);
 const height = $derived(width * 0.26);
 const left = $derived(layout.x + (board.x-layout.width/2)*layout.scale);
 // Original frame's wooden top edge is at source y=120; opening starts at 197.
 // Clip the rising sign at this seam to make it emerge from behind the rail.
 const seam = $derived(layout.y + (board.y-layout.height/2-board.height/2
  - board.height * 77/551 + 4)*layout.scale);
 const artwork = new URL('../../assets/art-v1/free-spin-sign-v2.png', import.meta.url).href;
</script>

{#if !seedCelebration.active || seedCelebration.progress>.84}
<div class="sign-slot" style:translate={`${thudX}px ${thudY}px`} style:left={`${left}px`} style:top={`${seam-height}px`} style:width={`${width}px`} style:height={`${height}px`}>
 <aside class="sign" role="status" aria-label={playerLabel(playerLanguage(),'FREE SPINS')}>
  <img src={artwork} alt="" />
  <div class="face" style:visibility={seedCelebration.active ? 'hidden' : 'visible'}>
   <div class="heading">{playerLabel(playerLanguage(),'FREE SPINS')}</div>
   <div class="counter">{count}</div>
  </div>
 </aside>
</div>

{/if}
<style>
 .sign-slot{position:fixed;transform:translateX(-50%);z-index:9999;pointer-events:none;container-type:inline-size;clip-path:inset(-20% -5% 0)}
 .sign{position:absolute;inset:0;overflow:hidden;transform-origin:50% 100%;transform:translateY(0);animation:slide-up 560ms both;color:#f2e6cd;text-align:center;font-family:Georgia,serif;text-shadow:0 1px 2px #23160e}
 /* Compensate for the transparent source margins so the wood meets the seam. */
 img{position:absolute;left:0;top:-27%;width:100%;height:143%}
 .face{position:absolute;inset:12% 8% 12%;display:flex;flex-direction:column;justify-content:center;gap:2px}
 .heading{font-size:6cqw;font-weight:800;line-height:1.05}
 .counter{font-size:9cqw;font-weight:bold;line-height:1.05;font-variant-numeric:tabular-nums}
 /* Meet the board seam at rest; a small overshoot adds a soft cartoon bounce. */
 @keyframes slide-up{
  0%{transform:translateY(105%) scale(1,1);animation-timing-function:cubic-bezier(.15,.75,.25,1)}
  42%{transform:translateY(-7%) scale(.97,1.025);animation-timing-function:ease-in-out}
  72%{transform:translateY(2%) scale(1.015,.985);animation-timing-function:ease-out}
  100%{transform:translateY(0) scale(1,1)}
 }
</style>
