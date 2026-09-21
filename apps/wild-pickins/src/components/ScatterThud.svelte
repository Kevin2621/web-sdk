<script lang="ts">
 import { onDestroy, type Snippet } from 'svelte';
 import { playerMotion } from '../game/playerMotion.svelte';
 import { Container } from 'pixi-svelte';
 import { getContext } from '../game/context';

 let { children }: { children: Snippet } = $props();
 let x = $state(0);
 let y = $state(0);
 let frame = 0;
 const context = getContext();
 const reduced=()=>playerMotion.shakeDisabled;
 function reset(){cancelAnimationFrame(frame);x=0;y=0;}
 $effect(()=>{if(playerMotion.shakeDisabled)reset();});
 context.eventEmitter.subscribeOnMount({
  scatterLandingThud: () => {
   reset();
   if(reduced())return;
   const start=performance.now();
   const tick=(now:number)=>{
    if(reduced()){reset();return;}
    const t=Math.min(1,(now-start)/220);
    const decay=(1-t)*(1-t);
    // Small downward impact followed by a rapidly damped rebound.
    x=1.5*Math.sin(t*Math.PI*6)*decay;
    y=5*Math.sin(t*Math.PI*5)*decay;
    if(t<1)frame=requestAnimationFrame(tick);
    else {x=0; y=0;}
   };
   frame=requestAnimationFrame(tick);
  },
 });
 onDestroy(()=>cancelAnimationFrame(frame));
</script>

<Container {x} {y}>
 {@render children()}
</Container>
