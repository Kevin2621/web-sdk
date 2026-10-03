<script lang="ts">
 import { Container } from 'pixi-svelte';
 import WildSpine from './WildSpine.svelte';
 import BoardContainer from './BoardContainer.svelte';
 import { fixturePlayback, fixtureWilds } from '../game/fixturePlayback.svelte';
 import { winLinePresentation } from '../game/winLinePresentation.svelte';
 import { stateGame } from '../game/stateGame.svelte';
 import { SYMBOL_SIZE } from '../game/constants';
 import { getSymbolX } from '../game/utils';
</script>
<BoardContainer>
 {#each fixturePlayback.sticky as p (`${p.reel}:${p.row}`)}
  <Container x={getSymbolX(p.reel)} y={(p.row+0.5)*SYMBOL_SIZE}
   alpha={winLinePresentation.active && !winLinePresentation.boardReleased &&
    winLinePresentation.winnerKeys.has(`${p.reel}:${p.row+1}`)
    ? 1 : 1 - winLinePresentation.darkness * 0.65}>
   <WildSpine locked foregroundOnly startLocked={fixturePlayback.instantSticky}
    releasing={fixturePlayback.releasingSticky}
    state={stateGame.board[p.reel].reelState.symbols[p.row+1].symbolState === 'win' ||
     (winLinePresentation.active && !winLinePresentation.boardReleased &&
      winLinePresentation.winnerKeys.has(`${p.reel}:${p.row+1}`)) ? 'win' : 'static'}
    multiplier={fixtureWilds.multipliers.find(w=>w.reel===p.reel&&w.row===p.row)?.multiplier}
    oncomplete={() => stateGame.board[p.reel].reelState.symbols[p.row+1].oncomplete()} />
  </Container>
 {/each}
</BoardContainer>
