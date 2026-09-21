<script lang="ts">
 import { onDestroy, type Snippet } from 'svelte';
 import { cancelFixtureAction } from '../game/fixturePlayback.svelte';
 let { action, data, children }: { action: unknown; data: unknown; children: Snippet } = $props();
 // Storybook can reuse the story module when selecting another named story.
 // React to the active snippet's inputs rather than relying on module teardown.
 $effect(() => {
  action; data;
  return () => cancelFixtureAction();
 });
 onDestroy(cancelFixtureAction);
</script>
{@render children()}
