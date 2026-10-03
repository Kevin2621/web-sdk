<script lang="ts">
	import { stateGame, wildLandingInstances } from '../game/stateGame.svelte';
	import { BOARD_DIMENSIONS, SYMBOL_SIZE } from '../game/constants';
	import { getSymbolX } from '../game/utils';
	import WildSpine from './WildSpine.svelte';
	import type { ReelSymbol } from '../game/stateGame.svelte';

	let {
		landing,
	}: { landing: { id: object; reelIndex: number; symbol: ReelSymbol; finished: boolean } } =
		$props();
	const y = $derived(landing.symbol.symbolY());
	$effect(() => {
		const motion = stateGame.board[landing.reelIndex].reelState.motion;
		if (
			motion !== 'stopped' &&
			(y < -SYMBOL_SIZE / 2 || y > BOARD_DIMENSIONS.y * SYMBOL_SIZE + SYMBOL_SIZE / 2)
		) {
			wildLandingInstances.remove(landing.id);
		} else if (landing.finished && motion === 'stopped') {
			wildLandingInstances.remove(landing.id);
		}
	});
</script>

<WildSpine
	x={getSymbolX(landing.reelIndex)}
	{y}
	state="land"
	multiplier={landing.symbol.rawSymbol.multiplier}
	oncomplete={() => {
		landing.finished = true;
		wildLandingInstances.remove(landing.id);
		if (landing.symbol.symbolState === 'land') landing.symbol.symbolState = 'static';
	}}
/>
