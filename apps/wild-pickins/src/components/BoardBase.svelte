<script lang="ts">
	import ReelSymbol from './ReelSymbol.svelte';
	import { getContext } from '../game/context';

	const context = getContext();
	const symbols = $derived(context.stateGame.board.flatMap((reel, reelIndex) =>
		reel.reelState.symbols.map((reelSymbol, rowIndex) => ({ reelIndex, rowIndex, reelSymbol }))
	));
</script>

{#each symbols as { reelIndex, rowIndex, reelSymbol } (reelSymbol.id)}
	<ReelSymbol {reelIndex} {rowIndex} {reelSymbol} />
{/each}
