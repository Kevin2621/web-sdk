<script lang="ts">
 import { Text, Container, Sprite } from 'pixi-svelte';
 import BoardContainer from './BoardContainer.svelte';
 import Symbol from './Symbol.svelte';
 import { fixturePlayback } from '../game/fixturePlayback.svelte';
 import { stateGame } from '../game/stateGame.svelte';
 import { mapSymbol } from '../game/fixtureAdapter.mjs';
 import type { RawSymbol } from '../game/types';
 import { getSymbolX } from '../game/utils';
 const pick=$derived(fixturePlayback.pick);
</script>
{#if pick}
 <BoardContainer>
  <Container x={getSymbolX(pick.reel)} y={stateGame.board[pick.reel].reelState.symbols[pick.row+1].symbolY()}>
   {#if pick.phase==='mark'}
    <Text anchor={0.5} y={-35} text="✦ GOLDEN ✦" style={{fontFamily:'Arial',fontSize:22,fill:0xffd34e,stroke:{color:0x241900,width:4}}} />
   {:else if pick.phase==='reveal'}
    <Container scale={0.65+0.35*pick.progress}>
     <Symbol state="static" rawSymbol={{name:'W'}} />
    </Container>
   {:else}
    <Container y={pick.phase==='lift' ? -55*pick.progress : 0} alpha={pick.phase==='lift' ? 1-pick.progress*0.8 : 1}>
     {#if pick.phase==='lift'}<Symbol state="static" rawSymbol={mapSymbol(pick.crop) as RawSymbol} />{/if}
     <Sprite key="wpGlove" anchor={0.5} width={112} height={112} y={-25} x={pick.phase==='grip' ? 35*(1-pick.progress) : 0} />
    </Container>
   {/if}
  </Container>
 </BoardContainer>
{/if}

<BoardContainer>
 {#each fixturePlayback.cuePositions as p}
  <Text x={getSymbolX(p.reel)} y={stateGame.board[p.reel].reelState.symbols[p.row+1].symbolY()-40} anchor={0.5} text="▼" style={{fontFamily:'Arial',fontSize:34,fill:0xffd34e,stroke:{color:0x172019,width:4}}} />
 {/each}
</BoardContainer>
