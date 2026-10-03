import { isSelectedEvents, validateSelectedEvents } from './selectedBook.ts';
import type { Bet, BookEventOfType } from './typesBookEvent.ts';
const snapshotTypes = new Set([
	'reveal',
	'wildPickinsSpinResult',
	'freeSpinEnd',
	'freeSpinTrigger',
	'updateFreeSpin',
	'setTotalWin',
]);
// The template treats event as the first event to play; prefix state is restored silently.
export function convertTorResumableBet(betToResume: Bet): Bet {
	if (isSelectedEvents(betToResume.state)) validateSelectedEvents(betToResume.state);
	const value = betToResume.event;
	if (
		value !== null &&
		value !== undefined &&
		typeof value !== 'string' &&
		typeof value !== 'number'
	)
		throw new Error('Invalid resume event index');
	if (typeof value === 'string' && !/^\d+$/.test(value))
		throw new Error('Invalid resume event index');
	const resumingIndex = value == null ? 0 : Number(value);
	if (
		!Number.isSafeInteger(resumingIndex) ||
		resumingIndex < 0 ||
		resumingIndex > betToResume.state.length
	)
		throw new Error('Invalid resume event index');
	const snapshot: BookEventOfType<'createBonusSnapshot'> = {
		index: 0,
		type: 'createBonusSnapshot',
		bookEvents: betToResume.state
			.slice(0, resumingIndex)
			.filter((event) => snapshotTypes.has(event.type)),
	};
	return { ...betToResume, state: [snapshot, ...betToResume.state.slice(resumingIndex)] };
}
