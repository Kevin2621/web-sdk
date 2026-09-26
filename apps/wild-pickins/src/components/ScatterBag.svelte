<script lang="ts">
 import { SpineProvider } from 'pixi-svelte';
 import ScatterBagTrack from './ScatterBagTrack.svelte';
 let { x, y, size, animation, onburst, oncomplete }: {
  x: number; y: number; size: number;
  animation: 'shake_open' | 'idle' | 'bag_pop';
  onburst?: () => void; oncomplete?: () => void;
 } = $props();
</script>
<SpineProvider key="wpScatterBag" {x} {y} scale={size / 1254}>
 <ScatterBagTrack {animation} {onburst} {oncomplete} />
</SpineProvider>
