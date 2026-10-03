<script lang="ts">
	import { Container, Rectangle, SpineProvider, SpineSlot } from 'pixi-svelte';
	import { getContext } from '../game/context';
	import { sceneRegistration } from '../game/artRefresh';
	import Board from './Board.svelte';
	import PlayBoardSpine from './PlayBoardSpine.svelte';
	import Anticipations from './Anticipations.svelte';

	const { arriving = false } = $props<{ arriving?: boolean }>();
	const context = getContext();
	const board = $derived(context.stateGameDerived.boardLayout());
	const scene = $derived(sceneRegistration(board));
	const origin = $derived({
		x: scene.x + scene.width / 2,
		y: scene.y + scene.height / 2,
	});
	let glow = $state(false);
	context.eventEmitter.subscribeOnMount({
		boardFrameGlowShow: () => (glow = true),
		boardFrameGlowHide: () => (glow = false),
	});
</script>

<!-- The Spine board bone carries the backing, frame, and reel content together. -->
<Container x={origin.x} y={origin.y}>
	<SpineProvider key="wpBaseScene" x={0} y={0} scale={{ x: scene.scaleX, y: scene.scaleY }}>
		<PlayBoardSpine {arriving} />
		<SpineSlot slotName="play-board">
			<Container
				x={-origin.x / scene.scaleX}
				y={-origin.y / scene.scaleY}
				scale={{ x: 1 / scene.scaleX, y: 1 / scene.scaleY }}
			>
				{#if context.stateGameDerived.hasActiveWin()}
					<Rectangle
						x={board.x}
						y={board.y}
						anchor={0.5}
						width={board.width}
						height={board.height}
						backgroundColor={0x102010}
						backgroundAlpha={0.18}
					/>
				{/if}
				<Board />
				<Anticipations />
				{#if glow}
					<Rectangle
						x={board.x}
						y={board.y}
						anchor={0.5}
						width={board.width + 10}
						height={board.height + 10}
						backgroundAlpha={0}
						borderColor={0xf7d16b}
						borderWidth={5}
					/>
				{/if}
			</Container>
		</SpineSlot>
	</SpineProvider>
</Container>
