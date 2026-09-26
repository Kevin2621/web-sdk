<script lang="ts" module>
	export type EmitterEventBoardFrame =
		| { type: 'boardFrameGlowShow' }
		| { type: 'boardFrameGlowHide' };
</script>

<script lang="ts">
	import { sceneRegistration } from '../game/artRefresh';
	import { Sprite } from 'pixi-svelte';
	import { getContext } from '../game/context';
	const context = getContext();
	const board = $derived(context.stateGameDerived.boardLayout());
	const scene = $derived(sceneRegistration(board));
</script>

<Sprite key="wpRefreshFrame" x={scene.x} y={scene.y} width={scene.width} height={scene.height} />
