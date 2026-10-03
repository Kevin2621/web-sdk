<script lang="ts">
	import { Container, Rectangle } from 'pixi-svelte';
	import WildSpine from './WildSpine.svelte';
	import { fixturePlayback } from '../game/fixturePlayback.svelte';
	import { winLinePresentation } from '../game/winLinePresentation.svelte';
	import { stateGame } from '../game/stateGame.svelte';
	import { SYMBOL_SIZE, SYMBOL_WIDTH } from '../game/constants';
	import { getSymbolX } from '../game/utils';
</script>

<!-- Roots can extend across cells, but reel symbols always render above them. -->
{#each fixturePlayback.sticky as p (`${p.reel}:${p.row}`)}
	<Container x={getSymbolX(p.reel)} y={(p.row + 0.5) * SYMBOL_SIZE}>
		<Rectangle x={-SYMBOL_WIDTH/2} y={-SYMBOL_SIZE/2} width={SYMBOL_WIDTH}
			height={SYMBOL_SIZE} backgroundColor={0x283e26} />
	</Container>
{/each}
{#each fixturePlayback.sticky as p (`${p.reel}:${p.row}`)}
	<Container x={getSymbolX(p.reel)} y={(p.row + 0.5) * SYMBOL_SIZE}>
		<WildSpine locked rootsOnly startLocked={fixturePlayback.instantSticky}
			releasing={fixturePlayback.releasingSticky}
			state={stateGame.board[p.reel].reelState.symbols[p.row + 1].symbolState === 'win' ||
				(winLinePresentation.active && !winLinePresentation.boardReleased &&
				 winLinePresentation.winnerKeys.has(`${p.reel}:${p.row+1}`)) ? 'win' : 'static'} />
	</Container>
{/each}
