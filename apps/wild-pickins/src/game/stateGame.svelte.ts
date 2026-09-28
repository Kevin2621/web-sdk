import { stateLayoutDerived } from './stateLayout';
import _ from 'lodash';
import { visibleScatterCount, shouldPlayReelStop } from './scatterSound.mjs';
import { playerSpeed } from './playerSpeed.svelte';
import { stateBet } from 'state-shared';
import type { Tween } from 'svelte/motion';

import { createEnhanceBoard, createReelForSpinning } from 'utils-slots';
import { createGetWinLevelDataByWinLevelAlias } from 'utils-shared/winLevel';

import type { GameType, RawSymbol, SymbolState } from './types';
import { winLevelMap } from './winLevelMap';
import { eventEmitter } from './eventEmitter';
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

const wildLandings = $state<{ id: object; reelIndex: number; symbol: ReelSymbol; finished: boolean }[]>([]);
export const wildLandingInstances = {
	get active() { return wildLandings; },
	has(id: object) { return wildLandings.some(landing => landing.id === id); },
	remove(id: object) {
		const index = wildLandings.findIndex(landing => landing.id === id);
		if (index !== -1) wildLandings.splice(index, 1);
	},
};

const soundedWildLandingBatches = new WeakSet<object>();
const onSymbolLand = ({ rawSymbol, reelIndex, reelSymbol, landingBatch }: { rawSymbol: RawSymbol; reelIndex?: number; reelSymbol?: { id: object; symbolY: () => number }; landingBatch?: object }) => {
	if (rawSymbol.suppressFixtureLanding) return;
	if (rawSymbol.name === 'S') {
		eventEmitter.broadcast({ type: 'scatterLandingThud' });
		eventEmitter.broadcast({ type: 'soundScatterLand' });
	}

	if (rawSymbol.name === 'W') {
		if (reelIndex !== undefined && reelSymbol && !wildLandingInstances.has(reelSymbol.id)) {
			wildLandings.push({ id: reelSymbol.id, reelIndex, symbol: reelSymbol as ReelSymbol, finished: false });
		}
		if (!landingBatch || !soundedWildLandingBatches.has(landingBatch)) {
			if (landingBatch) soundedWildLandingBatches.add(landingBatch);
			eventEmitter.broadcast({
				type: 'soundOnce',
				name: 'sfx_multiplier_landing',
				forcePlay: true,
			});
		}
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
			if (reelIndex === BOARD_DIMENSIONS.x-1) eventEmitter.broadcast({type:'soundScatterFinalImpact'});
			if (!shouldPlayReelStop({ultra:ultraRound,baseGame:stateGame.gameType==='basegame',anticipated:anticipationReels[reelIndex],scatter:scatterReels[reelIndex]})) return;
			// Anticipated non-scatter reels retain the ordinary reel landing.
			eventEmitter.broadcast({
				type: 'soundOnce',
				name: (['sfx_reel_stop_1', 'sfx_reel_stop_2', 'sfx_reel_stop_3', 'sfx_reel_stop_4', 'sfx_reel_stop_5'] as const)[reelIndex],
			});
		},
		onSpinTravelStart: (duration) => {
			if (reelIndex === BOARD_DIMENSIONS.x-1) eventEmitter.broadcast({type:'soundScatterFinalTravel',duration});
		},
		onSymbolLand: ({ rawSymbol, reelSymbol, landingBatch }) => onSymbolLand({ rawSymbol, reelIndex, reelSymbol, landingBatch }),
		landOnImpact: true,
		spinStartLift: () => ({
			distance: SYMBOL_SIZE * 0.14,
			duration: playerSpeed.mode === 1 ? 75 : 150,
		}),
	});

	reel.reelState.spinOptions = () =>
		reel.reelState.spinType === 'fast' ? SPIN_OPTIONS_FAST : playerSpeed.mode === 1 ? SPIN_OPTIONS_MEDIUM : SPIN_OPTIONS_DEFAULT;

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

export const stateGame = $state({
	scatterCounter: 0,
	board,
	activePayline: [] as {reel:number;row:number}[],
	gameType: 'basegame' as GameType,
	multiplierBoard: [] as (MultiplierSymbol | undefined)[][],
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


const { enhanceBoard } = createEnhanceBoard();
const rawEnhancedBoard = enhanceBoard({ board: stateGame.board });
const enhancedBoard = {
 ...rawEnhancedBoard,
 async spin(args: Parameters<typeof rawEnhancedBoard.spin>[0]) {
  // Capture speed for this round. Ultra gets one whoosh instead of separate
  // reel-stop impacts that can outrun the animation.
  ultraRound = playerSpeed.mode === 2;
  const visibleCount = visibleScatterCount(args.revealEvent.board);
  anticipationReels=args.revealEvent.anticipation.map(Boolean);
  scatterReels=args.revealEvent.board.map(reel => reel.slice(1,-1).some(s => s.name==='S'&&!s.suppressFixtureLanding));
  // Reel callbacks include padding too. Never count or sound hidden symbols.
  const board = args.revealEvent.board.map(reel => reel.map((symbol,index) =>
   index === 0 || index === reel.length - 1 ? {...symbol,suppressFixtureLanding:true} : symbol));
  // Live autoplay does not call the Spin button for every round. Give each
  // accepted base-game reveal its own start cue at normal and quick speed.
  if (playerSpeed.mode !== 2 && stateBet.autoSpinsCounter > 0 && stateGame.gameType === 'basegame')
   eventEmitter.broadcast({type:'soundPressSpin'});
  if (ultraRound) eventEmitter.broadcast({type:'soundPressSpin'});
  eventEmitter.broadcast({type:'soundScatterSequenceStart',total:visibleCount,baseGame:stateGame.gameType==='basegame',anticipation:anticipationReels.some(Boolean)});
  try { return await rawEnhancedBoard.spin({...args,revealEvent:{...args.revealEvent,board}}); }
  catch(error) { eventEmitter.broadcast({type:'soundScatterSequenceCancel'});throw error; }
  finally { anticipationReels=[]; scatterReels=[]; }
 },
};

export const { getWinLevelDataByWinLevelAlias } = createGetWinLevelDataByWinLevelAlias({
	winLevelMap,
});

export const stateGameDerived = {
	hasActiveWin: () => stateGame.board.some(reel => reel.reelState.symbols.some(symbol => symbol.symbolState === 'win')),
	onSymbolLand,
	boardLayout,
	boardRaw,
	enhancedBoard,
	getWinLevelDataByWinLevelAlias,
};
