<script lang="ts">
	import Symbol from './Symbol.svelte';
	import SymbolWrap from './SymbolWrap.svelte';
	import { getSymbolInfo, getSymbolX } from '../game/utils';
	import type { ReelSymbol } from '../game/stateGame.svelte';
	import { wildLandingInstances } from '../game/stateGame.svelte';
	import { winLinePresentation } from '../game/winLinePresentation.svelte';

	type Props = {
		reelIndex: number;
		rowIndex: number;
		reelSymbol: ReelSymbol;
	};

	const props: Props = $props();
	const presentedWinner = $derived(
		winLinePresentation.active &&
			!winLinePresentation.boardReleased &&
			winLinePresentation.winnerKeys.has(`${props.reelIndex}:${props.rowIndex}`),
	);
	const symbolState = $derived(presentedWinner ? 'win' : props.reelSymbol.symbolState);
	const symbolInfo = $derived(
		getSymbolInfo({ rawSymbol: props.reelSymbol.rawSymbol, state: symbolState }),
	);
</script>

{#if !wildLandingInstances.has(props.reelSymbol.id)}
	<SymbolWrap
		x={getSymbolX(props.reelIndex)}
		y={props.reelSymbol.symbolY()}
		alpha={presentedWinner ? 1 : 1 - winLinePresentation.darkness * 0.65}
		animating={symbolInfo.type === 'spine' && (symbolState === 'land' || symbolState === 'win')}
	>
		<Symbol
			state={symbolState}
			rawSymbol={props.reelSymbol.rawSymbol}
			oncomplete={() => {
				if (props.reelSymbol.symbolState === 'win') props.reelSymbol.oncomplete();
				if (props.reelSymbol.symbolState === 'land') props.reelSymbol.symbolState = 'static';
			}}
		/>
	</SymbolWrap>
{/if}
