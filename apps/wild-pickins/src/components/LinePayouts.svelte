<script lang="ts">
 import { getWinTiming } from '../game/playerSpeed.svelte';

 import { untrack } from 'svelte';
 import { Text } from 'pixi-svelte';
 import BoardContainer from './BoardContainer.svelte';
 import { fixturePlayback } from '../game/fixturePlayback.svelte';
 import { SYMBOL_SIZE, SYMBOL_WIDTH } from '../game/constants';
 import { getSymbolX } from '../game/utils';
 const labels=$derived.by(()=>{
  const used=new Set<number>();
  return fixturePlayback.linePayouts.map(w=>{
   const x=w.positions.reduce((sum,p)=>sum+getSymbolX(p.reel),0)/w.positions.length;
   const y=w.positions.reduce((sum,p)=>sum+(p.row-0.5)*SYMBOL_SIZE,0)/w.positions.length;
   // Nearby separate slots keep coincident/crossing paylines readable.
   const slots=Array.from({length:30},(_,i)=>({i,x:SYMBOL_WIDTH*(0.5+i%5),y:SYMBOL_SIZE*(0.25+Math.floor(i/5)*0.5)}));
   const slot=slots.filter(s=>!used.has(s.i)).sort((a,b)=>(a.x-x)**2+(a.y-y)**2-((b.x-x)**2+(b.y-y)**2))[0];
   used.add(slot.i);
   return {...w,x:slot.x,y:slot.y};
  });
 });
 let progress=$state(0);
 $effect(()=>{
  const payouts=fixturePlayback.linePayouts;
  progress=0;
  if(!payouts.length)return;
  const duration=untrack(getWinTiming).paylines;
  const start=performance.now();let frame=0;
  const tick=(now:number)=>{
   progress=Math.min(1,(now-start)/duration);
   if(progress<1)frame=requestAnimationFrame(tick);
  };
  frame=requestAnimationFrame(tick);return ()=>cancelAnimationFrame(frame);
 });
 const pop=$derived(progress<0.12 ? 0.8+0.32*Math.sin(progress/0.12*Math.PI/2) : progress<0.25 ? 1.12-0.12*(progress-0.12)/0.13 : 1);
 // Keep the hold and exit proportions consistent at every speed.
 const exitProgress=$derived(Math.max(0,Math.min(1,(progress-7/9)/(2/9))));
 const opacity=$derived(1-exitProgress);
</script>
<BoardContainer>
 {#each labels as label,i}
  <Text anchor={0.5} x={label.x} y={label.y-(SYMBOL_SIZE*0.55*exitProgress*exitProgress)} scale={pop}
   alpha={opacity} text={`${(label.amount/100).toFixed(2)}×`}
   style={{fontFamily:'Arial',fontSize:SYMBOL_SIZE*0.21,fontWeight:'bold',fill:0xfff1d1,stroke:{color:0x000000,width:5}}} />
  {#if (label.multiplier??1)>1}
   <Text anchor={0.5} x={label.x} y={label.y+SYMBOL_SIZE*0.2-(SYMBOL_SIZE*0.55*exitProgress*exitProgress)} scale={pop}
    alpha={opacity} text={`WILDS ×${label.multiplier}`}
    style={{fontFamily:'Arial',fontSize:SYMBOL_SIZE*0.11,fontWeight:'bold',fill:0xffd34e,stroke:{color:0x000000,width:3}}} />
  {/if}
 {/each}
</BoardContainer>
