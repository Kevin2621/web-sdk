<script lang="ts">
	import { Sprite } from 'pixi-svelte';
	import bounds from '../game/bakedLetterBounds.json';
	import { symbolLayout, symbolStyleDefaults } from '../game/symbolStyle.svelte';
	let { rank, size, tint = 0xffffff }: { rank: string; size: number; tint?: number } = $props();
	const art = $derived(bounds[rank as keyof typeof bounds]);
	// Match the live renderer's face sizing and center; baked shadow is outside layout.
	const scaleY = $derived((size * symbolLayout.letterHeight) / art.faceHeight);
	const scaleX = $derived(Math.min(scaleY, (size * symbolLayout.letterMaxWidth) / art.faceWidth));
</script>

<Sprite
	rotation={(symbolStyleDefaults.tilt * Math.PI) / 180}
	key={art.key}
	anchor={{ x: art.anchorX, y: art.anchorY }}
	width={art.canvasWidth * scaleX}
	height={art.canvasHeight * scaleY}
	{tint}
/>
