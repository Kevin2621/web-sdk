<script lang="ts">
	import { getContextSpine } from 'pixi-svelte';

	let { foregroundOnly = false }: { foregroundOnly?: boolean } = $props();
	const spine = getContextSpine();
	// Two persistent skeletons share the same lock lifecycle. Each owns only
	// the slots on its side of the reel layer.
	const backgroundSlots = [
		'lock-left-back',
		'lock-right-back',
		'lock-bottom',
		'lock-leaf6-bone',
		'lock-root-upper-front',
		'thorn-right-front-2',
		'leaf8',
		'leaf10',
		'leaf11',
		'leaf12',
	];
	const foregroundSlots = [
		'W',
		'W-multiplier',
		'W-sheen',
		'lock-left-front',
		'lock-right-front',
		'lock-leaf1',
		'lock-leaf2',
		'lock-leaf3',
		'lock-leaf4',
		'lock-leaf5',
	];
	for (const name of foregroundOnly ? backgroundSlots : foregroundSlots) {
		const slot = spine.skeleton.findSlot(name);
		if (slot) slot.color.a = 0;
	}
</script>
