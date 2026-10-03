import { selectedModes, bookUnitsToMultiplier, type SelectedMode } from './selectedConfig.ts';
import { validateSelectedBook } from './selectedBook.ts';
import type { BookEvent } from './typesBookEvent.ts';
// Engine replay amounts are decimal multipliers; event-book amounts remain hundredths.
export function normalizeEngineReplay(data: unknown, mode: string) {
	if (!Object.hasOwn(selectedModes, mode)) throw new Error('Unknown replay mode');
	if (!data || typeof data !== 'object') throw new Error('Invalid replay response');
	const response = data as Record<string, unknown>;
	const state = response.state as
		| { events?: BookEvent[]; id?: number; payoutMultiplier?: number }
		| BookEvent[];
	const events = Array.isArray(state) ? state : state?.events;
	if (!Array.isArray(events) || !events.length) throw new Error('Replay has no events');
	const final = events.at(-1);
	if (final?.type !== 'finalWin') throw new Error('Replay has no final win');
	const book = {
		id: !Array.isArray(state) && Number.isSafeInteger(state?.id) ? (state.id as number) : 0,
		payoutMultiplier: final.amount,
		events,
	};
	validateSelectedBook(book);
	const tier = selectedModes[mode as SelectedMode];
	if (mode !== 'base') {
		const trigger = events.find((event) => event.type === 'freeSpinTrigger');
		if (trigger?.type !== 'freeSpinTrigger' || trigger.totalFs !== tier.initialSpins)
			throw new Error('Replay purchase tier mismatch');
	}
	const payoutMultiplier = bookUnitsToMultiplier(final.amount);
	if (response.payoutMultiplier !== undefined && response.payoutMultiplier !== payoutMultiplier)
		throw new Error('Replay payout mismatch');
	if (
		!Array.isArray(state) &&
		state.payoutMultiplier !== undefined &&
		state.payoutMultiplier !== final.amount
	)
		throw new Error('Replay book payout mismatch');
	const costMultiplier = tier.cost;
	if (response.costMultiplier !== undefined && response.costMultiplier !== costMultiplier)
		throw new Error('Replay cost mismatch');
	return {
		...response,
		state: JSON.parse(JSON.stringify(events)) as BookEvent[],
		payoutMultiplier,
		costMultiplier,
		mode,
	};
}
