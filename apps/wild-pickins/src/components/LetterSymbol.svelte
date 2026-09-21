<script lang="ts">
	import { onDestroy, untrack } from 'svelte';
	import { createLetterStyles, getLetterDepthOffsets } from '../game/letterRendering.mjs';
	import { Container, Text, BlurFilter, FillGradient } from 'pixi-svelte';
	import {
		symbolStyle,
		symbolFonts,
		symbolPalette,
		symbolLayout,
	} from '../game/symbolStyle.svelte';
	let { rank, size, tint = 0xffffff }: { rank: string; size: number; tint?: number } = $props();
	let bounds = $state({ width: 145, height: 145 });
	const styles = $derived(
		createLetterStyles(
			{
				fontFamily: symbolFonts[symbolStyle.font].split(',').map((value) => value.trim()),
				fontWeight: ['patua', 'luckiest'].includes(symbolStyle.font) ? '400' : '900',
				fontSize: symbolLayout.fontSize,
				edge: symbolStyle.edge,
				color: symbolStyle.multicolor ? symbolPalette[rank] : symbolStyle.color,
			},
			FillGradient,
		),
	);
	const face = $derived(styles.face);
	$effect(() => {
		const current = styles;
		return () => current.destroy();
	});

	const depthX = $derived(symbolStyle.depth * 0.3);
	const depthStyle = $derived(styles.depth);
	// Sweep the same silhouette from back to front at <= 1 design-unit intervals.
	// Reusing one style lets Pixi share the rasterized text across these layers.
	const depthOffsets = $derived(getLetterDepthOffsets(symbolStyle.depth));

	// Measure the outlined face. Shadow and depth do not participate in layout.
	const scaleY = $derived((size * symbolLayout.letterHeight) / Math.max(1, bounds.height));
	const scaleX = $derived(
		Math.min(scaleY, (size * symbolLayout.letterMaxWidth) / Math.max(1, bounds.width)),
	);
	const shadowBlur = new BlurFilter({ strength: symbolStyle.shadowSoftness, quality: 4 });
	$effect(() => {
		shadowBlur.strength = symbolStyle.shadowSoftness;
	});
	onDestroy(() => shadowBlur.destroy());
	function measure(next: { width: number; height: number }) {
		untrack(() => {
			if (next.width !== bounds.width || next.height !== bounds.height) bounds = next;
		});
	}
</script>

<Container rotation={(symbolStyle.tilt * Math.PI) / 180} scale={{ x: scaleX, y: scaleY }}>
	<!-- Center the solid face/depth pair; the cast shadow stays outside layout. -->
	<!-- Explicit ordering also covers depth/shadow layers mounted after a settings change. -->
	<Container x={-depthX / 2} y={-symbolStyle.depth / 2} sortableChildren={true}>
		{#if symbolStyle.shadowStrength > 0}
			<Container
				zIndex={0}
				x={depthX + 5}
				y={symbolStyle.depth + 5}
				alpha={symbolStyle.shadowStrength / 100}
				filters={symbolStyle.shadowSoftness > 0 ? [shadowBlur] : []}
			>
				<Text text={rank} anchor={0.5} style={styles.shadow} />
			</Container>
		{/if}
		<Container zIndex={1} sortableChildren={true}>
			{#each depthOffsets as offset, index (index)}
				<Text
					text={rank}
					anchor={0.5}
					x={offset.x}
					y={offset.y}
					zIndex={index}
					{tint}
					style={depthStyle}
				/>
			{/each}
		</Container>

		<!-- Dark outer bark edge underneath the lighter cut-wood rim. -->
		<Text text={rank} anchor={0.5} {tint} style={styles.rim} zIndex={2} onresize={measure} />
		<Text text={rank} anchor={0.5} zIndex={3} {tint} style={face} />
	</Container>
</Container>
