<script lang="ts">
	import { onMount } from 'svelte';
	import { getContextSpine } from 'pixi-svelte';
	let { releasing = false, startLocked = false }: { releasing?: boolean; startLocked?: boolean } = $props();
	const spine = getContextSpine();
	onMount(() => {
		if (!releasing) {
			spine.state.setAnimation(1, startLocked ? 'wild_locked' : 'wild_lock', false);
			if (!startLocked) spine.state.addAnimation(1, 'wild_locked', false, 0);
		}
	});
	$effect(() => {
		if (releasing) spine.state.setAnimation(1, 'wild_unlock', false);
	});
</script>
