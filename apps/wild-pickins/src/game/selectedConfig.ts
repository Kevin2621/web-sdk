import math from './selectedMath.json' with { type: 'json' };
import modes from './selectedModes.json' with { type: 'json' };

export const mathToArtwork = {
	C01: 'H1',
	C02: 'H2',
	C03: 'H3',
	C04: 'L1',
	C05: 'L2',
	C06: 'L3',
	C07: 'L4',
	C08: 'L5',
	W: 'W',
	S: 'S',
} as const;
export type MathSymbolName = keyof typeof mathToArtwork;
export const BOOK_AMOUNT_SCALE = 100;
export const selectedModes = {
	base: { ...modes.base, title: 'Regular game' },
	bonus: { ...modes.bonus, title: 'Standard Bonus Buy · Low' },
	standard_bonus_buy_medium: {
		...modes.standard_bonus_buy_medium,
		title: 'Standard Bonus Buy · Medium',
	},
	standard_bonus_buy_high: { ...modes.standard_bonus_buy_high, title: 'Standard Bonus Buy · High' },
} as const;
export type SelectedMode = keyof typeof selectedModes;
export const selectedRules = {
	profile: 'candidate-corrected-1m-1',
	roundCap: math.roundCap,
	spinBudget: math.spinBudget,
	goldenPicksEnabled: false,
	paytable: math.fixtureMath.paytable,
	bonusPaytable: math.fixtureMath.bonusPaytable,
	paylines: Object.fromEntries(math.fixtureMath.paths.map((path, index) => [index + 1, path])),
};
export const bookUnitsToMultiplier = (amount: number) => amount / BOOK_AMOUNT_SCALE;
export { math };
