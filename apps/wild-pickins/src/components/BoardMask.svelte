<script lang="ts">
	import { Rectangle } from 'pixi-svelte';

	import { getContext } from '../game/context';
	import { SYMBOL_SIZE } from '../game/constants';

	type Props = { debug?: boolean };

	const props: Props = $props();
	const context = getContext();
	const topExtension = 2;
</script>

{#if props.debug}
	<Rectangle
		y={-topExtension}
		alpha={0.5}
		backgroundColor={0xffffff}
		width={context.stateGameDerived.boardLayout().width}
		height={context.stateGameDerived.boardLayout().height + topExtension}
	/>
{/if}

<Rectangle
	isMask
	y={-topExtension}
	x={-SYMBOL_SIZE}
	width={context.stateGameDerived.boardLayout().width + SYMBOL_SIZE * 2}
	height={context.stateGameDerived.boardLayout().height + topExtension}
/>
