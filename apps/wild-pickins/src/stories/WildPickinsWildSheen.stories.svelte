<script lang="ts" module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	const { Story } = defineMeta({ title: 'WILD_PICKINS/Wild landing sheen' });
</script>

<script lang="ts">
	import WildSheenPreview from './WildSheenPreview.svelte';
</script>

<Story name="1 · Soft mirror sweep" exportName="SoftMirrorSweep">
	{#snippet template()}<WildSheenPreview treatment="soft" />{/snippet}
</Story>
<Story name="2 · Bright mirror sweep" exportName="BrightMirrorSweep">
	{#snippet template()}<WildSheenPreview treatment="mirror" />{/snippet}
</Story>
<Story name="3 · Warm gold sweep" exportName="WarmGoldSweep">
	{#snippet template()}<WildSheenPreview treatment="gold" />{/snippet}
</Story>
