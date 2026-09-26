<script lang="ts">
	import { sceneRegistration } from '../game/artRefresh';
	import { Rectangle, Sprite } from 'pixi-svelte';
	import { getContext } from '../game/context';
	const context = getContext();
	const board = $derived(context.stateGameDerived.boardLayout());
	const scene = $derived(sceneRegistration(board));
	let glow = $state(false);
	context.eventEmitter.subscribeOnMount({
		boardFrameGlowShow: () => (glow = true),
		boardFrameGlowHide: () => (glow = false),
	});
</script>

<Sprite
	key="wpRefreshBacking"
	x={scene.x}
	y={scene.y}
	width={scene.width}
	height={scene.height}
	tint={context.stateGameDerived.hasActiveWin() ? 0xc8d0c8 : 0xffffff}
/>
{#if glow}<Rectangle
		x={board.x}
		y={board.y}
		anchor={0.5}
		width={board.width + 10}
		height={board.height + 10}
		backgroundAlpha={0}
		borderColor={0xf7d16b}
		borderWidth={5}
	/>{/if}
