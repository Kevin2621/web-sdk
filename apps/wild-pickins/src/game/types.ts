import { type SpinningReelSymbolState } from 'utils-slots';
import type config from './config';
import type { MathSymbolName } from './selectedConfig';
import type { SYMBOL_INFO_MAP } from './constants';

// Artwork aliases remain supported by the original template preview stories.
export type SymbolName = MathSymbolName | keyof typeof SYMBOL_INFO_MAP;
export type RawSymbol = {
	name: SymbolName;
	multiplier?: number;
	scatter?: boolean;
	wild?: boolean;
	/** Presentation-only: padding and retained locks must not land again. */
	skipLanding?: boolean;
};
export type BetMode = keyof typeof config.betModes;
export type GameType = keyof typeof config.paddingReels;

export const SYMBOL_STATES = [
	'static',
	'spin',
	'land',
	'win',
	'postWinStatic',
	'explosion',
] as const;

export type SymbolState = SpinningReelSymbolState | (typeof SYMBOL_STATES)[number];

export type Position = {
	reel: number;
	row: number;
};
