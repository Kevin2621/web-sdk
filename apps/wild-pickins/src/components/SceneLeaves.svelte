<script lang="ts">
	import { Sprite } from 'pixi-svelte';
	import { getContext } from '../game/context';
	import { sceneRegistration } from '../game/artRefresh';
	const context = getContext();
	const scene = $derived(sceneRegistration(context.stateGameDerived.boardLayout()));
</script>

<Sprite
	key="wpRefreshLeaves"
	x={scene.x + 38 * scene.scaleX}
	y={scene.y - 12 * scene.scaleY}
	width={215 * scene.scaleX}
	height={215 * scene.scaleY}
/>
