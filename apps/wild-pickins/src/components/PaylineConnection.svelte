<script lang="ts">
 import { Graphics } from 'pixi-svelte';
 import BoardContainer from './BoardContainer.svelte';
 import { stateGame } from '../game/stateGame.svelte';
 import { SYMBOL_SIZE } from '../game/constants';
 import { getSymbolX } from '../game/utils';
 const positions=$derived([...stateGame.activePayline].sort((a,b)=>a.reel-b.reel));
</script>
{#if positions.length>1}
 <BoardContainer>
  <Graphics draw={g=>{
   // Positions use padded reel rows, exactly as the win animation does.
   positions.forEach((p,i)=>{
    const x=getSymbolX(p.reel), y=(p.row-0.5)*SYMBOL_SIZE;
    if(i===0)g.moveTo(x,y);else g.lineTo(x,y);
   });
   g.stroke({color:0x142a40,width:6,alpha:0.8});
   positions.forEach((p,i)=>{
    const x=getSymbolX(p.reel), y=(p.row-0.5)*SYMBOL_SIZE;
    if(i===0)g.moveTo(x,y);else g.lineTo(x,y);
   });
   g.stroke({color:0xc7eaff,width:2,alpha:0.95});
  }} />
 </BoardContainer>
{/if}
