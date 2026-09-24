<script lang="ts">
 import { Container, Text } from 'pixi-svelte';
 import Symbol from './Symbol.svelte';
 import StickyVines from './StickyVines.svelte';
 import BoardContainer from './BoardContainer.svelte';
 import { fixturePlayback, fixtureWilds } from '../game/fixturePlayback.svelte';
 import { stateGame, stateGameDerived } from '../game/stateGame.svelte';
 import { SYMBOL_SIZE } from '../game/constants';
 import { getSymbolX } from '../game/utils';
</script>
<BoardContainer>
 {#each fixturePlayback.sticky as p (`${p.reel}:${p.row}`)}
  <Container x={getSymbolX(p.reel)} y={(p.row+0.5)*SYMBOL_SIZE}>
   <StickyVines layer="back" releasing={fixturePlayback.releasingSticky} dimmed={stateGameDerived.hasActiveWin()} />
   <StickyVines layer="front" releasing={fixturePlayback.releasingSticky} dimmed={stateGameDerived.hasActiveWin()} />
   <!-- Sticky art covers the underlying reel. Mirror only its win state, never
        its spin/landing state, so retained Wilds stay fixed between awards. -->
   <Symbol state={stateGame.board[p.reel].reelState.symbols[p.row+1].symbolState==='win' ? 'win' : 'static'} rawSymbol={{name:'W',multiplier:fixtureWilds.multipliers.find(w=>w.reel===p.reel&&w.row===p.row)?.multiplier}} />
   <Text anchor={0.5} y={38} text={fixturePlayback.cuePositions.some(c=>c.reel===p.reel && c.row===p.row) ? "WILD HIT" : "LOCKED"} style={{fontFamily:'Arial',fontSize:16,fill:0xffd34e,stroke:{color:0x162311,width:4}}} />
  </Container>
 {/each}
</BoardContainer>
