<script lang="ts">
	import Symbol from './Symbol.svelte';
	import { fixturePlayback } from '../game/fixturePlayback.svelte';
	import { winLinePresentation } from '../game/winLinePresentation.svelte';
	import { stateGame, wildLandingInstances } from '../game/stateGame.svelte';
	import SymbolWrap from './SymbolWrap.svelte';
	import { getSymbolX } from '../game/utils';
	import type { ReelSymbol } from '../game/stateGame.svelte';

	type Props = {
		reelIndex: number;
		rowIndex: number;
		reelSymbol: ReelSymbol;
	};

	const props: Props = $props();
	const presentedWinner = $derived(winLinePresentation.active && !winLinePresentation.boardReleased &&
		winLinePresentation.winnerKeys.has(`${props.reelIndex}:${props.rowIndex}`));
	const symbolState = $derived(presentedWinner ? 'win' : props.reelSymbol.symbolState);
	const sticky = $derived(fixturePlayback.sticky.some(p => p.reel === props.reelIndex && p.row + 1 === props.rowIndex));
</script>

{#if !wildLandingInstances.has(props.reelSymbol.id) && !(sticky && stateGame.board[props.reelIndex].reelState.motion === 'stopped') && !(fixturePlayback.pick && ['lift','reveal'].includes(fixturePlayback.pick.phase) && fixturePlayback.pick.reel===props.reelIndex && stateGame.board[props.reelIndex].reelState.symbols[fixturePlayback.pick.row+1]===props.reelSymbol)}
<SymbolWrap
	x={getSymbolX(props.reelIndex)}
	y={props.reelSymbol.symbolY()}
	alpha={presentedWinner ? 1 : 1 - winLinePresentation.darkness * 0.65}
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
