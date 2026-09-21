<script lang="ts">

 import { onMount } from 'svelte';
 import { Container, Graphics } from 'pixi-svelte';
 import { SYMBOL_SIZE } from '../game/constants';
 let settle=$state(1);
 onMount(()=>{
  const start=performance.now();
  let frame=0;
  const tick=(now:number)=>{
   const t=Math.min(1,(now-start)/250);
   settle=1+0.12*(1-t)*(1-t);
   if(t<1)frame=requestAnimationFrame(tick);
  };
  frame=requestAnimationFrame(tick);
  return ()=>cancelAnimationFrame(frame);
 });
</script>
<Container scale={settle}>
 <Graphics draw={g=>{
  const edge=SYMBOL_SIZE*0.46, length=SYMBOL_SIZE*0.13;
  for(const sx of [-1,1])for(const sy of [-1,1]){
   g.moveTo(sx*(edge-length),sy*edge).lineTo(sx*edge,sy*edge).lineTo(sx*edge,sy*(edge-length));
  }
  g.stroke({color:0x97c9eb,width:3});
 }} />
</Container>
