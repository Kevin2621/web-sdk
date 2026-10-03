import type { BetType } from 'rgs-requests';

import type { SymbolName, RawSymbol, GameType, Position } from './types';
import type { MathSymbolName } from './selectedConfig';

// book events shared with scatter game
type BookEventReveal = {
	index: number;
	type: 'reveal';
	board: RawSymbol[][];
	paddingPositions: number[];
	anticipation: number[];
	gameType: GameType;
	underlyingBoard?: MathSymbolName[][];
	stickyBefore?: Position[];
	goldenTarget?: Position | null;
};

type BookEventSetTotalWin = {
	index: number;
	type: 'setTotalWin';
	amount: number;
};

type BookEventFinalWin = {
	index: number;
	type: 'finalWin';
	amount: number;
};

type BookEventFreeSpinTrigger = {
	index: number;
	type: 'freeSpinTrigger';
	totalFs: number;
	positions: Position[];
};

type BookEventUpdateFreeSpin = {
	index: number;
	type: 'updateFreeSpin';
	amount: number;
	total: number;
};

type BookEventSetWin = {
	index: number;
	type: 'setWin';
	amount: number;
	winLevel: number;
};

type BookEventFreeSpinEnd = {
	index: number;
	type: 'freeSpinEnd';
	amount: number;
	winLevel: number;
};

type BookEventWinInfo = {
	index: number;
	type: 'winInfo';
	totalWin: number;
	wins: {
		symbol: SymbolName;
		kind: number;
		win: number;
		positions: Position[];
		meta: {
			lineIndex: number;
			multiplier: number;
			winWithoutMult: number;
			globalMult: number;
			lineMultiplier: number;
		};
	}[];
};

// Canonical math coordinates are zero-based visible cells; reveal/winInfo
// boards retain the SDK's one-cell top/bottom padding.
export type WildMultiplier = Position & { multiplier: 1 | 2 | 3 };
export type RoundEndReason = 'roundCap' | 'spinBudget' | 'spinsExhausted' | null;
export type BookEventWildPickinsSpinResult = {
	index: number;
	type: 'wildPickinsSpinResult';
	spinId: number;
	finalBoard: MathSymbolName[][];
	stickyAfter: Position[];
	collisionPositions: Position[];
	scatterPositions: Position[];
	wildMultipliers: WildMultiplier[];
	nominalCollisionAward: number;
	nominalRetriggerAward: number;
	grantedExtraSpins: number;
	completedBonusSpins: number;
	remaining: number;
	totalGranted: number;
	lineWin: number;
	scatterWin: number;
	nominalScatterWin: number;
	harvestTopUp: number;
	spinWin: number;
	bonusTotal: number;
	roundTotal: number;
	endReason: RoundEndReason;
};

// customised
type BookEventCreateBonusSnapshot = {
	index: number;
	type: 'createBonusSnapshot';
	bookEvents: BookEvent[];
};

export type BookEvent = (
	| BookEventWildPickinsSpinResult
	| BookEventReveal
	| BookEventWinInfo
	| BookEventSetTotalWin
	| BookEventFreeSpinTrigger
	| BookEventUpdateFreeSpin
	| BookEventCreateBonusSnapshot
	| BookEventFinalWin
	| BookEventSetWin
	| BookEventFreeSpinEnd
) & { spinId?: number };

export type Bet = BetType<BookEvent>;
export type BookEventOfType<T> = Extract<BookEvent, { type: T }>;
export type BookEventContext = { bookEvents: BookEvent[]; signal?: AbortSignal };
