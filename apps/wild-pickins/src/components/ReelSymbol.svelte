<script lang="ts">
	import Symbol from './Symbol.svelte';
	import { fixturePlayback } from '../game/fixturePlayback.svelte';
	import { stateGame } from '../game/stateGame.svelte';
	import SymbolWrap from './SymbolWrap.svelte';
	import { getSymbolInfo, getSymbolX } from '../game/utils';
	import type { ReelSymbol } from '../game/stateGame.svelte';

	type Props = {
		reelIndex: number;
		reelSymbol: ReelSymbol;
	};

	const props: Props = $props();
	const symbolInfo = $derived(
		getSymbolInfo({ rawSymbol: props.reelSymbol.rawSymbol, state: props.reelSymbol.symbolState }),
	);
</script>

{#if !fixturePlayback.sticky.some(p=>p.reel===props.reelIndex && stateGame.board[p.reel].reelState.symbols[p.row+1]===props.reelSymbol) && !(fixturePlayback.pick && ['lift','reveal'].includes(fixturePlayback.pick.phase) && fixturePlayback.pick.reel===props.reelIndex && stateGame.board[props.reelIndex].reelState.symbols[fixturePlayback.pick.row+1]===props.reelSymbol)}
<SymbolWrap
	x={getSymbolX(props.reelIndex)}
	y={props.reelSymbol.symbolY()}
	animating={symbolInfo.type === 'spine' &&
		(props.reelSymbol.symbolState === 'land' || props.reelSymbol.symbolState === 'win')}
>
	<Symbol
		state={props.reelSymbol.symbolState}
		rawSymbol={props.reelSymbol.rawSymbol}
		oncomplete={() => {
			if (props.reelSymbol.symbolState === 'win') props.reelSymbol.oncomplete();
			if (props.reelSymbol.symbolState === 'land') props.reelSymbol.symbolState = 'static';
		}}
	/>
</SymbolWrap>

{/if}
