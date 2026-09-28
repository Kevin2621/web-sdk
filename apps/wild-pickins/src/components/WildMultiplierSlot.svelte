<script lang="ts">
	import { getContextSpine } from 'pixi-svelte';

	let { multiplier }: { multiplier?: number } = $props();
	const spine = getContextSpine();
	const slot = spine.skeleton.findSlot('W-multiplier');
	$effect(() => {
		if (!slot) return;
		const name = multiplier === 1 || multiplier === 2 || multiplier === 3 ? `${multiplier}X` : null;
		slot.setAttachment(name ? spine.skeleton.getAttachmentByName('W-multiplier', name) : null);
	});
</script>
