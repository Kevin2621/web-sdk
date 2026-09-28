<script lang="ts">
	import { SpineProvider, SpineTrack } from 'pixi-svelte';
	import { getWinTiming } from '../game/playerSpeed.svelte';
	import { SYMBOL_WIDTH } from '../game/constants';
	import type { SymbolState } from '../game/types';
	import WildMultiplierSlot from './WildMultiplierSlot.svelte';

	let { x = 0, y = 0, state, multiplier, oncomplete }: {
		x?: number;
		y?: number;
		state: SymbolState;
		multiplier?: number;
		oncomplete?: () => void;
	} = $props();
	$effect(() => {
		if (state !== 'win') return;
		const timer = setTimeout(() => oncomplete?.(), getWinTiming().symbols);
		return () => clearTimeout(timer);
	});
</script>

<SpineProvider key="wpWildSpine" {x} {y} width={SYMBOL_WIDTH * 0.94}>
	<WildMultiplierSlot {multiplier} />
	<SpineTrack
		trackIndex={0}
		animationName={state === 'land' ? 'wild_land' : 'animation'}
		loop={false}
		listener={{ complete: () => { if (state === 'land') oncomplete?.(); } }}
	/>
</SpineProvider>
