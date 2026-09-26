<script lang="ts">
 import { onMount } from 'svelte';
 import { getContextSpine } from 'pixi-svelte';
 let { animation, onburst, oncomplete }: {
  animation: 'shake_open' | 'idle' | 'bag_pop';
  onburst?: () => void;
  oncomplete?: () => void;
 } = $props();
 const spine = getContextSpine();
 onMount(() => {
  const listener = {
   event: (_entry: unknown, event: { data: { name: string } }) => {
    if (event.data.name === 'seed_burst') onburst?.();
   },
   complete: (entry: { animation?: { name: string } | null }) => {
    if (entry.animation?.name === 'bag_pop') oncomplete?.();
   },
  };
  spine.state.addListener(listener);
  return () => { spine.state.removeListener(listener); };
 });
 $effect(() => {
  spine.state.setAnimation(0, animation, animation === 'idle');
  if (animation === 'shake_open') spine.state.addAnimation(0, 'idle', true, 0);
 });
</script>
