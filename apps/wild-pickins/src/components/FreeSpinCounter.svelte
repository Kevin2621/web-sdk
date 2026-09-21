<script lang="ts" module>
	export type EmitterEventFreeSpinCounter =
		| { type: 'freeSpinCounterShow' }
		| { type: 'freeSpinCounterHide' }
		| { type: 'freeSpinCounterUpdate'; current?: number; total?: number };
</script>
<script lang="ts">
 import { getContext } from '../game/context';
 import { fixturePlayback } from '../game/fixturePlayback.svelte';
 import FreeSpinPlaque from './FreeSpinPlaque.svelte';
 const context = getContext();
 let show = $state(false), current = $state(0), total = $state(0);
 context.eventEmitter.subscribeOnMount({
  freeSpinCounterShow: () => (show = true),
  freeSpinCounterHide: () => (show = false),
  freeSpinCounterUpdate: (event) => {
   if (event.current !== undefined) current = event.current;
   if (event.total !== undefined) total = event.total;
  },
 });
</script>
{#if show && !fixturePlayback.inBonus}
 <FreeSpinPlaque count={Math.max(0,total-current)} />
{/if}
