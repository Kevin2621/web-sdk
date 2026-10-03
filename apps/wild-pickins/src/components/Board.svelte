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
	import { BoardContext } from 'components-shared';
	import { Container, Graphics, Rectangle } from 'pixi-svelte';
	import WinLines from './WinLines.svelte';
	import BonusCues from './BonusCues.svelte';
	import {
		winLinePresentation,
		cancelWinLinePresentation,
	} from '../game/winLinePresentation.svelte';

	import { getContext } from '../game/context';
	import BoardContainer from './BoardContainer.svelte';
	import BoardMask from './BoardMask.svelte';
	import BoardBase from './BoardBase.svelte';
	import StickyWilds from './StickyWilds.svelte';
	import WildLandingOverlay from './WildLandingOverlay.svelte';
	import { stateRound } from '../game/stateGame.svelte';
	import { BOARD_DIMENSIONS, SYMBOL_SIZE, SYMBOL_WIDTH } from '../game/constants';
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
	<!-- Existing locks stay fixed while ordinary reel symbols pass behind them. -->
	<BoardContext animate={false}>
		<BoardContainer>
			<BoardMask />
			{#if winLinePresentation.active}
				<Rectangle
					width={BOARD_DIMENSIONS.x * SYMBOL_WIDTH}
					height={BOARD_DIMENSIONS.y * SYMBOL_SIZE}
					backgroundColor={0x08101a}
					backgroundAlpha={0.65 * winLinePresentation.darkness}
				/>
			{/if}
			<StickyWilds />
			<Container>
				<Graphics
					isMask
					draw={(graphics) => {
						for (let reel = 0; reel < BOARD_DIMENSIONS.x; reel++) {
							for (let row = 0; row < BOARD_DIMENSIONS.y; row++) {
								if (stateRound.sticky.some((cell) => cell.reel === reel && cell.row === row))
									continue;
								graphics.rect(
									getSymbolX(reel) - SYMBOL_WIDTH / 2,
									row * SYMBOL_SIZE,
									SYMBOL_WIDTH,
									SYMBOL_SIZE,
								);
							}
						}
						graphics.fill(0xffffff);
					}}
				/>
				<BoardBase />
			</Container>
		</BoardContainer>
	</BoardContext>

	<BoardContext animate={true}>
		<BoardContainer>
			<Container>
				<Graphics
					isMask
					draw={(graphics) => {
						for (let reel = 0; reel < BOARD_DIMENSIONS.x; reel++) {
							for (let row = 0; row < BOARD_DIMENSIONS.y; row++) {
								if (stateRound.sticky.some((cell) => cell.reel === reel && cell.row === row))
									continue;
								graphics.rect(
									getSymbolX(reel) - SYMBOL_WIDTH / 2,
									row * SYMBOL_SIZE,
									SYMBOL_WIDTH,
									SYMBOL_SIZE,
								);
							}
						}
						graphics.fill(0xffffff);
					}}
				/>
				<BoardBase />
			</Container>
		</BoardContainer>
	</BoardContext>
	<BoardContainer>
		<WildLandingOverlay />
		<StickyWilds foreground />
	</BoardContainer>
	<BonusCues />
	<WinLines />
{/if}
