import {
	mathToArtwork,
	selectedRules,
	selectedModes,
	bookUnitsToMultiplier,
} from './selectedConfig.ts';
import type { SelectedMode, MathSymbolName } from './selectedConfig.ts';
import type {
	BookEvent,
	BookEventWildPickinsSpinResult,
	WildMultiplier,
	RoundEndReason,
} from './typesBookEvent.ts';
import type { Position, RawSymbol } from './types.ts';

export type SelectedBook = { id: number; payoutMultiplier: number; events: BookEvent[] };
export function isSelectedEvents(events: BookEvent[]): boolean {
	return events.some(
		(event) =>
			event.type === 'wildPickinsSpinResult' ||
			(event.type === 'reveal' && Array.isArray(event.stickyBefore)) ||
			(event.type === 'createBonusSnapshot' && isSelectedEvents(event.bookEvents)),
	);
}
export const selectedEventTypes = new Set([
	'reveal',
	'wildPickinsSpinResult',
	'winInfo',
	'setWin',
	'setTotalWin',
	'freeSpinTrigger',
	'freeSpinEnd',
	'finalWin',
]);
function check(value: unknown, message: string): asserts value {
	if (!value) throw new Error(`Wild Pickins book: ${message}`);
}
const units = (value: unknown) => Number.isSafeInteger(value) && Number(value) >= 0;
// Event books are JSON; copying this way also accepts Storybook/Svelte proxies.
const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value));
const symbol = (name: unknown) => typeof name === 'string' && Object.hasOwn(mathToArtwork, name);
function positions(value: unknown, padded = false): void {
	check(Array.isArray(value), 'missing positions');
	const seen = new Set<string>();
	for (const cell of value) {
		check(
			Number.isInteger(cell?.reel) &&
				cell.reel >= 0 &&
				cell.reel < 5 &&
				Number.isInteger(cell?.row) &&
				cell.row >= (padded ? 1 : 0) &&
				cell.row < (padded ? 4 : 3),
			'invalid cell',
		);
		const key = `${cell.reel}:${cell.row}`;
		check(!seen.has(key), 'duplicate cell');
		seen.add(key);
	}
}

// Transport/presentation validation only. Python's existing rule validator is
// used when extracting books. The browser never rolls or recalculates a win.
export function validateSelectedEvents(input: unknown): asserts input is BookEvent[] {
	check(Array.isArray(input) && input.length > 0, 'empty events');
	let total = 0;
	let reveals = 0;
	let results = 0;
	let revealPending = false;
	let revealSpinId: number | undefined;
	let spin: BookEventWildPickinsSpinResult | undefined;
	for (const [index, event] of input.entries()) {
		check(
			event?.index === index && selectedEventTypes.has(event.type),
			'unsupported event or index',
		);
		if (event.type === 'reveal') {
			check(!revealPending, 'reveal without result');
			check(units(event.spinId), 'invalid spin identity');
			revealSpinId = event.spinId;
			revealPending = true;
			reveals++;
			check(['basegame', 'freegame'].includes(event.gameType), 'unknown game type');
			check(
				Array.isArray(event.board) &&
					event.board.length === 5 &&
					event.board.every(
						(reel: any) =>
							Array.isArray(reel) && reel.length === 5 && reel.every((s: any) => symbol(s?.name)),
					),
				'invalid padded board',
			);
			check(
				Array.isArray(event.paddingPositions) &&
					event.paddingPositions.length === 5 &&
					event.paddingPositions.every(units),
				'invalid reel stops',
			);
			check(
				Array.isArray(event.anticipation) &&
					event.anticipation.length === 5 &&
					event.anticipation.every(units),
				'invalid anticipation',
			);
			positions(event.stickyBefore);
			check(event.goldenTarget === null, 'Golden Picks are disabled');
			spin = undefined;
		} else if (event.type === 'wildPickinsSpinResult') {
			check(revealPending && !spin && event.spinId === revealSpinId, 'unexpected spin result');
			revealPending = false;
			results++;
			check(
				Array.isArray(event.finalBoard) &&
					event.finalBoard.length === 5 &&
					event.finalBoard.every(
						(reel: any) => Array.isArray(reel) && reel.length === 3 && reel.every(symbol),
					),
				'invalid final board',
			);
			for (const key of [
				'lineWin',
				'scatterWin',
				'spinWin',
				'bonusTotal',
				'roundTotal',
				'remaining',
				'completedBonusSpins',
				'totalGranted',
				'grantedExtraSpins',
			])
				check(units(event[key]), `invalid ${key}`);
			check(
				event.harvestTopUp === 0 && event.spinWin === event.lineWin + event.scatterWin,
				'spin total mismatch',
			);
			total += event.spinWin;
			check(
				event.roundTotal === total && total <= selectedRules.roundCap && event.bonusTotal <= total,
				'round total mismatch',
			);
			check(
				event.remaining + event.completedBonusSpins <= event.totalGranted &&
					event.totalGranted <= selectedRules.spinBudget,
				'spin budget exceeded',
			);
			check(
				[null, 'roundCap', 'spinBudget', 'spinsExhausted'].includes(event.endReason),
				'unsupported ending',
			);
			positions(event.stickyAfter);
			positions(event.collisionPositions);
			positions(event.scatterPositions);
			positions(event.wildMultipliers);
			for (const cell of event.wildMultipliers) {
				check(
					[1, 2, 3].includes(cell.multiplier) && event.finalBoard[cell.reel][cell.row] === 'W',
					'invalid Wild multiplier',
				);
			}
			for (const [r, reel] of event.finalBoard.entries())
				for (const [y, name] of reel.entries()) {
					if (name === 'W')
						check(
							event.wildMultipliers.some((p: WildMultiplier) => p.reel === r && p.row === y),
							'missing Wild multiplier',
						);
				}
			for (const cell of event.stickyAfter)
				check(event.finalBoard[cell.reel][cell.row] === 'W', 'sticky cell is not Wild');
			spin = event;
		} else if (event.type === 'winInfo') {
			check(
				spin && event.totalWin === spin.lineWin && Array.isArray(event.wins),
				'line total mismatch',
			);
			let lineTotal = 0;
			for (const win of event.wins) {
				check(symbol(win.symbol) && units(win.win), 'invalid line award');
				positions(win.positions, true);
				lineTotal += win.win;
			}
			check(lineTotal === spin.lineWin, 'line awards mismatch');
		} else if (event.type === 'setWin') {
			check(spin && event.amount === spin.spinWin, 'setWin mismatch');
		} else if (event.type === 'setTotalWin' || event.type === 'finalWin') {
			check(event.amount === total, 'display total mismatch');
			if (event.type === 'finalWin') check(index === input.length - 1, 'early finalWin');
		} else if (event.type === 'freeSpinTrigger') {
			check([10, 15, 20].includes(event.totalFs), 'invalid bonus entry');
			positions(event.positions, true);
		} else if (event.type === 'freeSpinEnd') {
			check(spin && event.amount === spin.bonusTotal, 'bonus total mismatch');
		}
	}
	check(input.at(-1).type === 'finalWin', 'missing finalWin');
	check(reveals > 0 && reveals === results && !revealPending, 'incomplete spin sequence');
}

export function validateSelectedBook(input: unknown): asserts input is SelectedBook {
	check(input && typeof input === 'object', 'missing book');
	const book = input as SelectedBook;
	check(units(book.id) && units(book.payoutMultiplier), 'invalid book identity/payout');
	validateSelectedEvents(book.events);
	const final = book.events.at(-1)!;
	check(
		final.type === 'finalWin' && final.amount === book.payoutMultiplier,
		'book payout mismatch',
	);
}

// SDK file payouts are hundredths; the RGS round multiplier is a decimal.
// This adapter is only for local book previews, never wallet settlement.
export function previewBet(book: unknown, mode: SelectedMode) {
	validateSelectedBook(book);
	check(Object.hasOwn(selectedModes, mode), 'unknown preview mode');
	const trigger = book.events.find((event) => event.type === 'freeSpinTrigger');
	if (mode !== 'base')
		check(
			trigger?.type === 'freeSpinTrigger' && trigger.totalFs === selectedModes[mode].initialSpins,
			'purchase tier mismatch',
		);
	return {
		betID: book.id,
		mode,
		active: false,
		event: '0',
		payoutMultiplier: bookUnitsToMultiplier(book.payoutMultiplier),
		state: copy(book.events),
	};
}

export function createRoundState() {
	return {
		board: [] as RawSymbol[][],
		sticky: [] as Position[],
		newlyLocked: [] as Position[],
		multipliers: [] as WildMultiplier[],
		collisions: [] as Position[],
		completed: 0,
		remaining: 0,
		granted: 0,
		roundTotal: 0,
		bonusTotal: 0,
		inBonus: false,
		endReason: null as RoundEndReason,
	};
}
export type RoundState = ReturnType<typeof createRoundState>;

export function resultBoard(
	event: BookEventWildPickinsSpinResult,
	previous: RawSymbol[][],
): RawSymbol[][] {
	return event.finalBoard.map((reel, r) => [
		{ ...(previous[r]?.[0] ?? { name: 'C08' as MathSymbolName }) },
		...reel.map((name, row) => {
			const multiplier = event.wildMultipliers.find(
				(p) => p.reel === r && p.row === row,
			)?.multiplier;
			return { name, ...(multiplier === undefined ? {} : { multiplier }) };
		}),
		{ ...(previous[r]?.[4] ?? { name: 'C08' as MathSymbolName }) },
	]);
}

// Shared authoritative state projection for playback and future resume tests.
// No timers, graphics, sounds, payout calculation or wallet operations here.
export function applyRoundEvent(state: RoundState, event: BookEvent): void {
	if (event.type === 'reveal') state.board = copy(event.board);
	if (event.type === 'wildPickinsSpinResult') {
		state.board = resultBoard(event, state.board);
		state.newlyLocked = event.stickyAfter.filter(
			(cell) => !state.sticky.some((old) => old.reel === cell.reel && old.row === cell.row),
		);
		state.sticky = copy(event.stickyAfter);
		state.multipliers = copy(event.wildMultipliers);
		state.collisions = copy(event.collisionPositions);
		state.completed = event.completedBonusSpins;
		state.remaining = event.remaining;
		state.granted = event.totalGranted;
		state.roundTotal = event.roundTotal;
		state.bonusTotal = event.bonusTotal;
		state.endReason = event.endReason;
	}
	if (event.type === 'freeSpinTrigger') {
		state.inBonus = true;
		state.sticky = [];
		state.newlyLocked = [];
		state.completed = 0;
		state.remaining = event.totalFs;
		state.granted = event.totalFs;
		state.bonusTotal = 0;
	}
	if (event.type === 'freeSpinEnd') {
		state.inBonus = false;
		state.sticky = [];
		state.newlyLocked = [];
		state.collisions = [];
		state.remaining = 0;
	}
}
export function restoreRoundState(events: BookEvent[]): RoundState {
	const state = createRoundState();
	for (const event of events) applyRoundEvent(state, event);
	// Recovery must display existing locks without replaying their arrival.
	state.newlyLocked = [];
	return state;
}
