<script lang="ts">
	import { wildLandingInstances } from '../game/stateGame.svelte';
	import WildLandingInstance from './WildLandingInstance.svelte';
</script>

{#each wildLandingInstances.active as landing (landing.id)}
	<WildLandingInstance {landing} />
{/each}
