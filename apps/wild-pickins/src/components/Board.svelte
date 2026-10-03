<script lang="ts" module>
	import type { RawSymbol, Position } from '../game/types';

	export type EmitterEventBoard =
		| { type: 'boardSettle'; board: RawSymbol[][] }
		| { type: 'boardShow' }
		| { type: 'boardHide' }
		| {
				type: 'boardWithAnimateSymbols';
				symbolPositions: Position[];
		  };
</script>

<script lang="ts">
	import { waitForResolve } from 'utils-shared/wait';
	import { Container, Graphics, Rectangle } from 'pixi-svelte';

	import { getContext } from '../game/context';
	import BoardContainer from './BoardContainer.svelte';
	import BoardMask from './BoardMask.svelte';
	import BoardBase from './BoardBase.svelte';
	import StickyFixtureOverlay from './StickyFixtureOverlay.svelte';
	import StickyRootsBackdrop from './StickyRootsBackdrop.svelte';
	import GoldenCropOverlay from './GoldenCropOverlay.svelte';
	import WinLines from './WinLines.svelte';
	import WildLandingOverlay from './WildLandingOverlay.svelte';
	import { cancelWinLinePresentation, winLinePresentation } from '../game/winLinePresentation.svelte';
	import { fixturePlayback } from '../game/fixturePlayback.svelte';
	import { SYMBOL_SIZE, SYMBOL_WIDTH } from '../game/constants';
	import { getSymbolX } from '../game/utils';

	const context = getContext();

	let show = $state(true);

	context.eventEmitter.subscribeOnMount({
		stopButtonClick: () => {
			context.stateGameDerived.enhancedBoard.stop();
			cancelWinLinePresentation();
		},
		boardSettle: ({ board }) => context.stateGameDerived.enhancedBoard.settle(board),
		boardShow: () => (show = true),
		boardHide: () => (show = false),
		boardWithAnimateSymbols: async ({ symbolPositions }) => {
			const getPromises = () =>
				symbolPositions.map(async (position) => {
					const reelSymbol = context.stateGame.board[position.reel].reelState.symbols[position.row];
					reelSymbol.symbolState = 'win';
					await waitForResolve((resolve) => (reelSymbol.oncomplete = resolve));
					reelSymbol.symbolState = 'postWinStatic';
				});

			await Promise.all(getPromises());
		},
	});

	context.stateGameDerived.enhancedBoard.readyToSpinEffect();
</script>

{#if show}
	<BoardContainer>
		<BoardMask />
		{#if winLinePresentation.active}
			<Rectangle width={5 * SYMBOL_WIDTH} height={3 * SYMBOL_SIZE}
				backgroundColor={0x08101a} backgroundAlpha={0.65 * winLinePresentation.darkness} />
		{/if}
		<StickyRootsBackdrop />
		<Container>
			<!-- The mask is fixed in board coordinates while reel symbols move. -->
			<Graphics isMask draw={(graphics) => {
				for (let reel = 0; reel < 5; reel++) {
					for (let row = 0; row < 3; row++) {
						if (fixturePlayback.sticky.some(p => p.reel === reel && p.row === row)) continue;
						graphics.rect(getSymbolX(reel) - SYMBOL_WIDTH / 2,
							row * SYMBOL_SIZE, SYMBOL_WIDTH, SYMBOL_SIZE);
					}
				}
				graphics.fill(0xffffff);
			}} />
			<BoardBase />
		</Container>
	</BoardContainer>
	<BoardContainer>
		<WildLandingOverlay />
	</BoardContainer>
	<StickyFixtureOverlay />
	<GoldenCropOverlay />
	<WinLines />
{/if}
