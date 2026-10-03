import _ from 'lodash';
import { visibleScatterCount, shouldPlayReelStop } from './scatterSound.mjs';
import { createRoundState } from './selectedBook';
import type { Tween } from 'svelte/motion';

import { stateBet } from 'state-shared';
import { createEnhanceBoard, createReelForSpinning } from 'utils-slots';
import { createGetWinLevelDataByWinLevelAlias } from 'utils-shared/winLevel';

import type { GameType, RawSymbol, SymbolState } from './types';
import { stateLayoutDerived } from './stateLayout';
import { winLevelMap } from './winLevelMap';
import { eventEmitter } from './eventEmitter';
import { playerSpeed } from './playerSpeed.svelte';
import { seedCelebration } from './seedCelebration.svelte';
import {
	SYMBOL_SIZE,
	BOARD_SIZES,
	INITIAL_BOARD,
	BOARD_DIMENSIONS,
	SPIN_OPTIONS_DEFAULT,
	SPIN_OPTIONS_FAST,
	SPIN_OPTIONS_MEDIUM,
	INITIAL_SYMBOL_STATE,
} from './constants';

type Landing = {
	id: object;
	reelIndex: number;
	symbol: ReelSymbol;
	finished: boolean;
	done: Promise<void>;
	finish: () => void;
};
const landings = $state<Landing[]>([]);
export const wildLandingInstances = {
	get active() {
		return landings;
	},
	has(id: object) {
		return landings.some((landing) => landing.id === id);
	},
	remove(id: object) {
		const index = landings.findIndex((landing) => landing.id === id);
		if (index !== -1) {
			landings[index].finish();
			landings.splice(index, 1);
		}
	},
	clear() {
		for (const landing of [...landings]) this.remove(landing.id);
	},
	async finishAt(positions: { reel: number; row: number }[]) {
		const pending = landings.filter((landing) =>
			positions.some(
				(cell) => cell.reel === landing.reelIndex && cell.row + 1 === landing.symbol.symbolIndex,
			),
		);
		if (!pending.length) return;
		let timer: ReturnType<typeof setTimeout> | undefined;
		await Promise.race([
			Promise.all(pending.map((landing) => landing.done)),
			new Promise<void>((resolve) => {
				timer = setTimeout(resolve, 1200);
			}),
		]);
		clearTimeout(timer);
		for (const landing of pending) this.remove(landing.id);
	},
};
const soundedBatches = new WeakSet<object>();
const onSymbolLand = ({
	rawSymbol,
	reelIndex,
	reelSymbol,
	landingBatch,
}: {
	rawSymbol: RawSymbol;
	reelIndex?: number;
	reelSymbol?: { id: object; symbolY: () => number };
	landingBatch?: object;
}) => {
	if (rawSymbol.skipLanding) return;
	if (rawSymbol.name === 'S') {
		eventEmitter.broadcast({ type: 'scatterLandingThud' });
		eventEmitter.broadcast({ type: 'soundScatterCounterIncrease' });
		eventEmitter.broadcast({
			type: 'soundScatterLand',
		});
	}

	if (rawSymbol.name === 'W') {
		if (reelIndex !== undefined && reelSymbol && !wildLandingInstances.has(reelSymbol.id)) {
			let finish = () => {};
			const done = new Promise<void>((resolve) => {
				finish = resolve;
			});
			landings.push({
				id: reelSymbol.id,
				reelIndex,
				symbol: reelSymbol as ReelSymbol,
				finished: false,
				done,
				finish,
			});
		}
		if (landingBatch && soundedBatches.has(landingBatch)) return;
		if (landingBatch) soundedBatches.add(landingBatch);
		eventEmitter.broadcast({
			type: 'soundOnce',
			name: 'sfx_multiplier_landing',
		});
	}
};

let anticipationReels: boolean[] = [];
let scatterReels: boolean[] = [];
let ultraRound = false;
const board = _.range(BOARD_DIMENSIONS.x).map((reelIndex) => {
	const reel = createReelForSpinning({
		reelIndex,
		symbolHeight: SYMBOL_SIZE,
		initialSymbols: INITIAL_BOARD[reelIndex],
		initialSymbolState: INITIAL_SYMBOL_STATE,
		onReelStopping: () => {
			if (reelIndex === BOARD_DIMENSIONS.x - 1)
				eventEmitter.broadcast({ type: 'soundScatterFinalImpact' });
			if (
				!shouldPlayReelStop({
					ultra: ultraRound,
					baseGame: stateGame.gameType === 'basegame',
					anticipated: anticipationReels[reelIndex],
					scatter: scatterReels[reelIndex],
				})
			)
				return;
			eventEmitter.broadcast({
				type: 'soundOnce',
				name: (
					[
						'sfx_reel_stop_1',
						'sfx_reel_stop_2',
						'sfx_reel_stop_3',
						'sfx_reel_stop_4',
						'sfx_reel_stop_5',
					] as const
				)[reelIndex],
			});
		},
		onSpinTravelStart: (duration) => {
			if (reelIndex === BOARD_DIMENSIONS.x - 1)
				eventEmitter.broadcast({ type: 'soundScatterFinalTravel', duration });
		},
		onSymbolLand: (args) => onSymbolLand({ ...args, reelIndex }),
		landOnImpact: true,
		spinStartLift: () => ({
			distance: SYMBOL_SIZE * 0.14,
			duration: playerSpeed.mode === 1 ? 75 : 150,
		}),
	});

	reel.reelState.spinOptions = () =>
		reel.reelState.spinType === 'fast'
			? SPIN_OPTIONS_FAST
			: playerSpeed.mode === 1
				? SPIN_OPTIONS_MEDIUM
				: SPIN_OPTIONS_DEFAULT;

	return reel;
});

export type Reel = (typeof board)[number];
export type ReelSymbol = Reel['reelState']['symbols'][number];

export type MultiplierSymbol = {
	initX: number;
	initY: number;
	symbolX: Tween<number>;
	symbolY: Tween<number>;
	rawSymbol: RawSymbol;
	symbolState: SymbolState;
	oncomplete: () => void;
};

export const stateRound = $state(createRoundState());

export const stateGame = $state({
	board,
	gameType: 'basegame' as GameType,
	multiplierBoard: [] as (MultiplierSymbol | undefined)[][],
	scatterCounter: 0,
});

const boardLayout = () => ({
	x: stateLayoutDerived.mainLayout().width * 0.5,
	y: stateLayoutDerived.mainLayout().height * 0.5,
	anchor: { x: 0.5, y: 0.5 },
	pivot: { x: BOARD_SIZES.width / 2, y: BOARD_SIZES.height / 2 },
	...BOARD_SIZES,
});

const boardRaw = () =>
	board.map((reel) => reel.reelState.symbols.map((reelSymbol) => reelSymbol.rawSymbol));

const scatterLandIndex = () => {
	if (stateGame.scatterCounter > 5) return 5;
	if (stateGame.scatterCounter < 1) return 1;
	return stateGame.scatterCounter as 1 | 2 | 3 | 4 | 5;
};

const { enhanceBoard } = createEnhanceBoard();
const templateBoard = enhanceBoard({ board: stateGame.board });
const enhancedBoard = {
	...templateBoard,
	async spin(args: Parameters<typeof templateBoard.spin>[0]) {
		const sticky =
			'stickyBefore' in args.revealEvent
				? (args.revealEvent.stickyBefore as { reel: number; row: number }[])
				: [];
		const board = args.revealEvent.board.map((reel, r) =>
			reel.map((symbol, row) => ({
				...symbol,
				skipLanding:
					row === 0 ||
					row === reel.length - 1 ||
					(sticky ?? []).some((cell) => cell.reel === r && cell.row + 1 === row),
			})),
		);
		ultraRound = stateBet.isTurbo || playerSpeed.mode === 2;
		anticipationReels = args.revealEvent.anticipation.map(Boolean);
		scatterReels = board.map((reel) =>
			reel.slice(1, -1).some((symbol) => symbol.name === 'S' && !symbol.skipLanding),
		);
		if (ultraRound || (stateBet.autoSpinsCounter > 0 && stateGame.gameType === 'basegame'))
			eventEmitter.broadcast({ type: 'soundPressSpin' });
		eventEmitter.broadcast({
			type: 'soundScatterSequenceStart',
			total: visibleScatterCount(board),
			baseGame: stateGame.gameType === 'basegame',
			anticipation: anticipationReels.some(Boolean),
		});
		try {
			const result = await templateBoard.spin({
				...args,
				revealEvent: { ...args.revealEvent, board },
			});
			seedCelebration.openTriggerBags = [];
			return result;
		} catch (error) {
			wildLandingInstances.clear();
			eventEmitter.broadcast({ type: 'soundScatterSequenceCancel' });
			throw error;
		} finally {
			anticipationReels = [];
			scatterReels = [];
		}
	},
};

export const { getWinLevelDataByWinLevelAlias } = createGetWinLevelDataByWinLevelAlias({
	winLevelMap,
});

export const stateGameDerived = {
	hasActiveWin: () =>
		stateGame.board.some((reel) =>
			reel.reelState.symbols.some((symbol) => symbol.symbolState === 'win'),
		),
	onSymbolLand,
	boardLayout,
	boardRaw,
	scatterLandIndex,
	enhancedBoard,
	getWinLevelDataByWinLevelAlias,
};
