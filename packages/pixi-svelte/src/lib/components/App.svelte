<script lang="ts">
	import { onDestroy, type Snippet } from 'svelte';

	import { getContextApp } from '../context.svelte';

	import InitialiseApplication from './InitialiseApplication.svelte';
	import InitialiseParent from './InitialiseParent.svelte';
	import AssetsLoader from './AssetsLoader.svelte';

	type Props = { children: Snippet; preloadTemplateFont?: boolean };

	const props: Props = $props();
	const context = getContextApp();

	// Reset before children mount; their async renderer startup must not be cleared.
	context.stateApp.reset();
	onDestroy(() => context.stateApp.reset());
</script>

<InitialiseApplication preloadTemplateFont={props.preloadTemplateFont}>
	<InitialiseParent>
		<AssetsLoader>
			{@render props.children()}
		</AssetsLoader>
	</InitialiseParent>
</InitialiseApplication>
