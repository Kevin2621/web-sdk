<script lang="ts">
  import { onMount } from 'svelte';
  import { getContextSpine } from 'pixi-svelte';

  let { arriving = false } = $props<{ arriving?: boolean }>();
  const spine = getContextSpine();

  onMount(() => {
    spine.skeleton.setSkinByName('play-board');
    spine.skeleton.setSlotsToSetupPose();
    // The farm is already fitted separately to the full viewport.
    for (const name of ['environment', 'cloud-1', 'cloud-2', 'cloud-3']) {
      spine.skeleton.findSlot(name)?.setAttachment(null);
    }
    if (arriving) spine.state.setAnimation(0, 'play_board_arrive', false);
  });
</script>
