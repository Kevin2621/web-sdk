<script lang="ts">
	import { getWinTiming } from '../game/playerSpeed.svelte';

	import { Sprite, Container } from 'pixi-svelte';
	import { untrack, onDestroy } from 'svelte';
	import { stateBet } from 'state-shared';
	import { Tween } from 'svelte/motion';
	import { cubicInOut } from 'svelte/easing';
	import { BlurFilter, ColorMatrixFilter } from 'pixi-svelte';
	import { stateGame, stateGameDerived } from '../game/stateGame.svelte';
	import type { SymbolState } from '../game/types';
	import { seedCelebration } from '../game/seedCelebration.svelte';
	import { SYMBOL_SIZE } from '../game/constants';
	import LetterSymbol from './LetterSymbol.svelte';
	import BakedLetterSymbol from './BakedLetterSymbol.svelte';
	import GeneratedLetterSymbol from './GeneratedLetterSymbol.svelte';
	import { symbolRanks, symbolArtwork, symbolLayout, symbolStyle } from '../game/symbolStyle.svelte';
	let {
		x = 0,
		y = 0,
		state: symbolState,
		name,
		oncomplete,
	}: {
		x?: number;
		y?: number;
		state: SymbolState;
		name: string;
		oncomplete?: () => void;
	} = $props();
	const art = $derived(symbolArtwork[name]);
	const size = SYMBOL_SIZE * symbolLayout.artworkFill;
	const artworkSize = $derived(
		size * (['H1', 'H2', 'H3'].includes(name) ? symbolLayout.highSymbolScale : 1),
	);
	const width = $derived(artworkSize * Math.min(1, art?.ratio ?? 1));
	const height = $derived(artworkSize / Math.max(1, art?.ratio ?? 1));
	const activeWin = $derived(stateGameDerived.hasActiveWin());
	const anticipating = $derived(
		!stateBet.isTurbo && stateGame.board.some((reel) => reel.reelState.anticipating),
	);
	const shade = new Tween(255, { duration: 300, easing: cubicInOut });
	$effect(() => {
		const target = anticipating
			? name === 'S'
				? 255
				: 166
			: activeWin && symbolState !== 'win'
				? 166
				: 255;
		void shade.set(target, { duration: 300 });
	});
	// Interpolate brightness, not the packed RGB integer, to keep the fade neutral.
	const tint = $derived(Math.round(shade.current) * 0x010101);
	const scrollBlur = new BlurFilter({ strengthX: 0, strengthY: 5, quality: 2 });
	const shineFilter = new ColorMatrixFilter();
	onDestroy(() => shineFilter.destroy());
	const blurFilters = $derived(
		symbolState === 'spin' ? [scrollBlur] : symbolState === 'win' ? [shineFilter] : [],
	);
	onDestroy(() => scrollBlur.destroy());
	let pulse = $state(1);
	let lift = $state(0);

	$effect(() => {
		const phase = symbolState;
		pulse = 1;
		lift = 0;
		shineFilter.brightness(1, false);
		let frame = 0;
		const duration = phase === 'win' ? untrack(getWinTiming).symbols : 0;
		// Completion is asynchronous so the reel can attach its resolver after changing state.
		const timer = setTimeout(() => untrack(() => oncomplete?.()), duration);
		if (duration) {
			const start = performance.now();
			const tick = (now: number) => {
				const t = Math.min(1, Math.max(0, (now - start) / duration));
				if (phase === 'win') {
					const raised =
						t < 0.2
							? Math.sin(((t / 0.2) * Math.PI) / 2)
							: t < 0.78
								? 1
								: (1 + Math.cos(((t - 0.78) / 0.22) * Math.PI)) / 2;
					pulse = 1 + 0.12 * raised;
					lift = -SYMBOL_SIZE * 0.06 * raised;
					const shine = t > 0.2 && t < 0.65 ? Math.sin(((t - 0.2) / 0.45) * Math.PI) : 0;
					shineFilter.brightness(1 + 0.3 * shine, false);
				}
				if (t < 1) frame = requestAnimationFrame(tick);
			};
			frame = requestAnimationFrame(tick);
		}
		return () => {
			clearTimeout(timer);
			cancelAnimationFrame(frame);
		};
	});
</script>

<Container {x} {y}>
	<Container y={lift} scale={pulse} filters={blurFilters}>
		{#if symbolRanks[name]}
			{#if !import.meta.env.DEV || !symbolStyle.livePreview}
				<BakedLetterSymbol rank={symbolRanks[name]} {size} {tint} />
			{:else if symbolStyle.generated}
				<GeneratedLetterSymbol rank={symbolRanks[name]} {size} {tint} />
			{:else}
				<LetterSymbol rank={symbolRanks[name]} {size} {tint} />
			{/if}
		{:else if art}
			<Sprite
				alpha={name === 'S' && seedCelebration.active ? 0 : 1}
				key={art.key}
				anchor={0.5}
				{width}
				{height}
				{tint}
			/>
		{/if}
	</Container>
</Container>
