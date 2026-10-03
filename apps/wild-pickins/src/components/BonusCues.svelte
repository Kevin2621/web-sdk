<script lang="ts">
	import { Text } from 'pixi-svelte';
	import BoardContainer from './BoardContainer.svelte';
	import { statePresentation } from '../game/statePresentation.svelte';
	import { stateGame } from '../game/stateGame.svelte';
	import { getSymbolX } from '../game/utils';
</script>

<BoardContainer>
	{#each statePresentation.cuePositions as cell}
		<Text
			x={getSymbolX(cell.reel)}
			y={stateGame.board[cell.reel].reelState.symbols[cell.row + 1].symbolY() - 40}
			anchor={0.5}
			text="▼"
			style={{
				fontFamily: 'Arial',
				fontSize: 34,
				fill: 0xffd34e,
				stroke: { color: 0x172019, width: 4 },
			}}
		/>
	{/each}
</BoardContainer>
