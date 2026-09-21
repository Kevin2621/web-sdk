<script lang="ts">
 import { onDestroy } from 'svelte';
 import { Container, Sprite, BlurFilter } from 'pixi-svelte';
 import bounds from '../game/generatedLetterBounds.json';
 import { symbolLayout, symbolStyle } from '../game/symbolStyle.svelte';
 let { rank, size, tint = 0xffffff }: { rank: string; size: number; tint?: number } = $props();
 const art = $derived(bounds[rank as keyof typeof bounds]);
 // Normalize visible pixels, not the transparent PNG canvas; preserve proportions.
 const factor = $derived(Math.min(size * symbolLayout.letterHeight / art.height, size * symbolLayout.letterMaxWidth / art.width));
 const width = $derived(art.canvasWidth * factor);
 const height = $derived(art.canvasHeight * factor);
 const anchor = $derived({x:(art.x + art.width / 2) / art.canvasWidth,y:(art.y + art.height / 2) / art.canvasHeight});
 const blur = new BlurFilter({strength:0,quality:4});
 // Match the former letter renderer's design-unit shadow controls.
 const effectScale = $derived(size * symbolLayout.letterHeight / symbolLayout.fontSize);
 $effect(() => { blur.strength = symbolStyle.shadowSoftness * effectScale; });
 onDestroy(() => blur.destroy());
</script>

<Container rotation={symbolStyle.tilt * Math.PI / 180}>
 {#if symbolStyle.shadowStrength > 0}
  <Container x={5 * effectScale} y={5 * effectScale} alpha={symbolStyle.shadowStrength / 100} filters={symbolStyle.shadowSoftness > 0 ? [blur] : []}>
   <Sprite key={art.key} {anchor} {width} {height} tint={0x000000} />
  </Container>
 {/if}
 <Sprite key={art.key} {anchor} {width} {height} {tint} />
</Container>
