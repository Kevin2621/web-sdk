<script lang="ts">
	import type { Snippet } from 'svelte';

	import { Container } from 'pixi-svelte';

	import { SYMBOL_SIZE, BOARD_DIMENSIONS } from '../game/constants';

	type Props = {
		debug?: boolean;
		x: number;
		y: number;
		alpha?: number;
		children: Snippet;
	};

	const props: Props = $props();
	const top = 0;
	const bottom = SYMBOL_SIZE * BOARD_DIMENSIONS.y;
	const inFrame = $derived(props.y >= top && props.y <= bottom);
</script>

{#if props.debug || inFrame}
	<Container x={props.x} y={props.y} alpha={props.alpha ?? 1}>
		{@render props.children()}
	</Container>
{/if}
