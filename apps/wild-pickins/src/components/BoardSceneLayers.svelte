<script lang="ts">
	import { getContextSpine } from 'pixi-svelte';
	const spine = getContextSpine();
	// The environment is rendered once at viewport scale, independently of this board.
	// Attachment filenames can change without renaming the exported slot.
	const slot = spine.skeleton.slots.find((slot) => slot.data.name.startsWith('environment-'));
	$effect(() => {
		if (!slot) return;
		const attachment = slot.getAttachment();
		slot.setAttachment(null);
		return () => slot.setAttachment(attachment);
	});
</script>
