import { math, selectedModes, selectedRules, bookUnitsToMultiplier } from './selectedConfig';
import type { MathSymbolName } from './selectedConfig';

// Selected game data, not the sample lines math. Reel strips provide visual
// padding only in the browser: all outcomes and awards come from event books.
const padding = (reels: string[][]) =>
	reels.map((reel) => reel.map((name) => ({ name: name as MathSymbolName })));
export default {
	providerName: 'sample_provider', // Provider identity is assigned for Engine submission.
	gameName: 'wild_pickins',
	gameID: 'wild_pickins',
	rtp: 0.967,
	numReels: 5,
	numRows: [3, 3, 3, 3, 3],
	betModes: Object.fromEntries(
		Object.entries(selectedModes).map(([name, mode]) => [
			name,
			{
				cost: mode.cost,
				feature: name === 'base',
				buyBonus: name !== 'base',
				rtp: 0.967,
				max_win: bookUnitsToMultiplier(mode.maxWinBookUnits),
			},
		]),
	),
	paylines: selectedRules.paylines,
	symbols: {
		...Object.fromEntries(
			Object.entries(selectedRules.paytable).map(([name, pays]) => [
				name,
				{
					paytable: Object.entries(pays).map(([count, value]) => ({
						[count]: bookUnitsToMultiplier(value),
					})),
				},
			]),
		),
		W: { special: ['wild'] },
		S: { special: ['scatter'] },
	},
	paddingReels: { basegame: padding(math.reels.basegame), freegame: padding(math.reels.freegame) },
};
