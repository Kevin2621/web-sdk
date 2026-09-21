<script lang="ts">

 import { untrack, type Snippet } from 'svelte';
 import { Container } from 'pixi-svelte';
 import { stateGame } from '../game/stateGame.svelte';
 let {reel,children}:{reel:number;children:Snippet}=$props();
 let widthScale=$state(1);
 const spinning=$derived(stateGame.board[reel].reelState.motion==='spinning');
 let wasSpinning=false;
 $effect(()=>{
  const release=wasSpinning && !spinning;
  wasSpinning=spinning;
  const from=untrack(()=>widthScale);
  if(!spinning && !release){widthScale=1;return;}
  const duration=spinning?120:200;
  const start=performance.now();
  let frame=0;
  const tick=(now:number)=>{
   const t=Math.min(1,(now-start)/duration);
   if(spinning)widthScale=from+(0.92-from)*(1-Math.pow(1-t,3));
   else if(t<0.4)widthScale=from+(1.03-from)*Math.sin(t/0.4*Math.PI/2);
   else widthScale=1+0.03*(1-(t-0.4)/0.6)**2;
   if(t<1)frame=requestAnimationFrame(tick);
  };
  frame=requestAnimationFrame(tick);
  return ()=>cancelAnimationFrame(frame);
 });
</script>
<Container scale={{x:widthScale,y:1}}>{@render children()}</Container>
