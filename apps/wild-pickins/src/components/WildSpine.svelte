<script lang="ts">
	import { SpineProvider, SpineTrack, ColorMatrixFilter } from 'pixi-svelte';
	import { onDestroy, untrack } from 'svelte';
	import { getWinTiming } from '../game/playerSpeed.svelte';
	import { SYMBOL_WIDTH, SYMBOL_SIZE } from '../game/constants';
	import type { SymbolState } from '../game/types';
	import WildMultiplierSlot from './WildMultiplierSlot.svelte';
	import WildLockTrack from './WildLockTrack.svelte';
	import WildSlotVisibility from './WildSlotVisibility.svelte';

	let {
		x = 0,
		y = 0,
		state: symbolState,
		multiplier,
		locked = false,
		releasing = false,
		startLocked = false,
		rootsOnly = false,
		foregroundOnly = false,
		oncomplete,
	}: {
		x?: number;
		y?: number;
		state: SymbolState;
		multiplier?: number;
		locked?: boolean;
		releasing?: boolean;
		startLocked?: boolean;
		rootsOnly?: boolean;
		foregroundOnly?: boolean;
		oncomplete?: () => void;
	} = $props();
	let lift = $state(0);
	const shineFilter = new ColorMatrixFilter();
	onDestroy(() => shineFilter.destroy());
	$effect(() => {
		lift = 0;
		shineFilter.brightness(1, false);
		if (symbolState !== 'win') return;
		const duration = untrack(getWinTiming).symbols;
		const start = performance.now();
		let frame = 0;
		const tick = (now: number) => {
			const t = Math.min(1, Math.max(0, (now - start) / duration));
			const raised =
				t < 0.2
					? Math.sin(((t / 0.2) * Math.PI) / 2)
					: t < 0.78
						? 1
						: (1 + Math.cos(((t - 0.78) / 0.22) * Math.PI)) / 2;
			lift = -SYMBOL_SIZE * 0.06 * raised;
			const shine = t > 0.2 && t < 0.65 ? Math.sin(((t - 0.2) / 0.45) * Math.PI) : 0;
			shineFilter.brightness(1 + 0.3 * shine, false);
			if (t < 1) frame = requestAnimationFrame(tick);
		};
		frame = requestAnimationFrame(tick);
		const timer = setTimeout(() => {
			cancelAnimationFrame(frame);
			lift = 0;
			shineFilter.brightness(1, false);
			untrack(() => oncomplete?.());
		}, duration);
		return () => {
			clearTimeout(timer);
			cancelAnimationFrame(frame);
		};
	});
</script>

<!-- Move the whole persistent skeleton, including roots and multiplier.
     Its board origin and lock track stay unchanged during win presentation. -->
<SpineProvider
	key="wpWildSpine"
	{x}
	y={y + lift}
	filters={symbolState === 'win' ? [shineFilter] : []}
	width={SYMBOL_WIDTH * 0.94}
>
	<WildMultiplierSlot {multiplier} />
	{#if rootsOnly || foregroundOnly}<WildSlotVisibility {foregroundOnly} />{/if}
	<SpineTrack
		trackIndex={0}
		animationName={symbolState === 'land' ? 'wild_land' : 'animation'}
		loop={false}
		listener={{
			complete: () => {
				if (symbolState === 'land') oncomplete?.();
			},
		}}
	/>
	{#if locked}<WildLockTrack {releasing} {startLocked} />{/if}
</SpineProvider>
