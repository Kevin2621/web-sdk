<script lang="ts">
	import { Container, Rectangle } from 'pixi-svelte';
	import { stateGame, stateRound } from '../game/stateGame.svelte';
	import { SYMBOL_SIZE, SYMBOL_WIDTH } from '../game/constants';
	import { getSymbolX } from '../game/utils';
	import WildSpine from './WildSpine.svelte';
	import { statePresentation } from '../game/statePresentation.svelte';
	import { winLinePresentation } from '../game/winLinePresentation.svelte';

	let { foreground = false }: { foreground?: boolean } = $props();
</script>

{#each stateRound.sticky as cell (`${cell.reel}:${cell.row}`)}
	<Container
		x={getSymbolX(cell.reel)}
		y={(cell.row + 0.5) * SYMBOL_SIZE}
		alpha={winLinePresentation.active &&
		!winLinePresentation.boardReleased &&
		winLinePresentation.winnerKeys.has(`${cell.reel}:${cell.row + 1}`)
			? 1
			: 1 - winLinePresentation.darkness * 0.65}
	>
		{#if !foreground}
			<Rectangle
				x={-SYMBOL_WIDTH / 2}
				y={-SYMBOL_SIZE / 2}
				width={SYMBOL_WIDTH}
				height={SYMBOL_SIZE}
				backgroundColor={0x283e26}
			/>
		{/if}
		<WildSpine
			locked
			releasing={statePresentation.releasingSticky}
			rootsOnly={!foreground}
			foregroundOnly={foreground}
			startLocked={!stateRound.newlyLocked.some(
				(fresh) => fresh.reel === cell.reel && fresh.row === cell.row,
			)}
			state={stateGame.board[cell.reel].reelState.symbols[cell.row + 1].symbolState === 'win' ||
			(winLinePresentation.active &&
				!winLinePresentation.boardReleased &&
				winLinePresentation.winnerKeys.has(`${cell.reel}:${cell.row + 1}`))
				? 'win'
				: 'static'}
			multiplier={stateRound.multipliers.find(
				(wild) => wild.reel === cell.reel && wild.row === cell.row,
			)?.multiplier}
			oncomplete={foreground
				? () => stateGame.board[cell.reel].reelState.symbols[cell.row + 1].oncomplete()
				: undefined}
		/>
	</Container>
{/each}
