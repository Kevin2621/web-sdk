<script lang="ts">
 import { onDestroy, type Snippet } from 'svelte';
 import { cancelFixtureAction } from '../game/fixturePlayback.svelte';
 let { storyKey, children }: { storyKey: string; children: Snippet } = $props();
 // Storybook can reuse the story module when selecting another named story.
 // A stable story key avoids cancelling a running action when args are refreshed.
 $effect(() => {
  storyKey;
  return () => cancelFixtureAction();
 });
 onDestroy(cancelFixtureAction);
</script>
{@render children()}
