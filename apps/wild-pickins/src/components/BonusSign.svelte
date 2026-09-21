<script lang="ts">
 import { fixturePlayback } from '../game/fixturePlayback.svelte';
 import FreeSpinPlaque from './FreeSpinPlaque.svelte';
</script>

{#if fixturePlayback.inBonus}
 <FreeSpinPlaque count={fixturePlayback.remaining} />
{/if}
