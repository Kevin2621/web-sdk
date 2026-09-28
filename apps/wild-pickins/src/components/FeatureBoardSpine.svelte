<script lang="ts">
  import { onMount } from 'svelte';
  import { getContextSpine } from 'pixi-svelte';
  import { SESSION_ENTRY_WHIP_MS } from '../game/sessionIntro.mjs';

  type Pose = { x: number; y: number; rotation: number; scaleX: number; scaleY: number };
  let { entering, scaleX, scaleY, onpose, oncomplete } = $props<{
    entering: boolean;
    scaleX: number;
    scaleY: number;
    onpose: (pose: Pose) => void;
    oncomplete: () => void;
  }>();

  const spine = getContextSpine();
  let mounted = $state(false);
  let started = false;
  let finished = false;

  onMount(() => {
    spine.skeleton.setSkinByName('feature-board');
    spine.skeleton.setSlotsToSetupPose();
    spine.skeleton.setAttachment('stitches-surround', 'feature-board');
    spine.skeleton.setAttachment('feature-dividers', 'feature-board');
    // The feature copy stays live HTML so it remains sharp at every size.
    for (const name of ['environment', 'cloud-1', 'cloud-2', 'cloud-3',
      'board-heading', 'max-win-image', 'max-win-title', 'max-win-amount', 'max-win-caption']) {
      spine.skeleton.findSlot(name)?.setAttachment(null);
    }

    const previousUpdate = spine.afterUpdateWorldTransforms;
    spine.afterUpdateWorldTransforms = (object) => {
      previousUpdate(object);
      const board = spine.skeleton.findBone('board');
      if (!board) return;
      onpose({
        x: board.x * scaleX,
        y: -board.y * scaleY,
        rotation: -board.rotation,
        scaleX: board.scaleX,
        scaleY: board.scaleY,
      });
    };

    const listener = {
      event: (_entry: unknown, event: { data: { name: string } }) => {
        if (event.data.name === 'whip') spine.state.timeScale = 1;
        if (event.data.name === 'feature_board_clear' && !finished) {
          finished = true;
          oncomplete();
        }
      },
      complete: () => {
        if (!finished && started) {
          finished = true;
          oncomplete();
        }
      },
    };
    spine.state.addListener(listener);
    mounted = true;
    return () => {
      spine.state.removeListener(listener);
      spine.afterUpdateWorldTransforms = previousUpdate;
    };
  });

  $effect(() => {
    if (!mounted || !entering || started) return;
    started = true;
    // Stretch just the anticipation to meet the whip in the guitar cue.
    spine.state.timeScale = 1.28 / (SESSION_ENTRY_WHIP_MS / 1000);
    spine.state.setAnimation(0, 'feature_board_depart_character', false);
  });
</script>
