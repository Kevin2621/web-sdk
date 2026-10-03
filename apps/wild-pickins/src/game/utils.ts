import _ from 'lodash';
import { mathToArtwork } from './selectedConfig';
import type { MathSymbolName } from './selectedConfig';
import { validateSelectedEvents, createRoundState } from './selectedBook';
import { stateRound, wildLandingInstances } from './stateGame.svelte';
import { stateBet } from 'state-shared';
import { createPlayBookUtils } from 'utils-book';
import { createGetEmptyPaddedBoard } from 'utils-slots';

import {
	SYMBOL_SIZE,
	SYMBOL_WIDTH,
	REEL_PADDING,
	SYMBOL_INFO_MAP,
	BOARD_DIMENSIONS,
} from './constants';
import { eventEmitter } from './eventEmitter';
import type { Bet, BookEventOfType } from './typesBookEvent';
import { bookEventHandlerMap } from './bookEventHandlerMap';
import type { RawSymbol, SymbolState } from './types';
import { resetPresentation } from './statePresentation.svelte';

// general utils
export const { getEmptyBoard } = createGetEmptyPaddedBoard({ reelsDimensions: BOARD_DIMENSIONS });
const guardedHandlers = Object.fromEntries(
	Object.entries(bookEventHandlerMap).map(([type, handler]) => [
		type,
		async (event: never, context: import('./typesBookEvent').BookEventContext) => {
			context.signal?.throwIfAborted();
			await handler(event, context);
			context.signal?.throwIfAborted();
		},
	]),
) as typeof bookEventHandlerMap;
const bookPlayer = createPlayBookUtils({ bookEventHandlerMap: guardedHandlers });
export const playBookEvent: typeof bookPlayer.playBookEvent = async (event, context) => {
	if (!Object.hasOwn(bookEventHandlerMap, event.type))
		throw new Error(`Unsupported book event: ${event.type}`);
	await bookPlayer.playBookEvent(event, context);
};
export const playBookEvents: typeof bookPlayer.playBookEvents = async (events, context) => {
	// Check the whole sequence before starting any visual side effects.
	for (const event of events) {
		if (!Object.hasOwn(bookEventHandlerMap, event.type))
			throw new Error(`Unsupported book event: ${event.type}`);
	}
	if (
		events.some((event) => event.type === 'wildPickinsSpinResult') &&
		events[0]?.type !== 'createBonusSnapshot'
	)
		validateSelectedEvents(events);
	await bookPlayer.playBookEvents(events, context);
};
let activePlayback: AbortController | undefined;
export function cancelPlayBet() {
	activePlayback?.abort();
	activePlayback = undefined;
	resetPresentation();
	eventEmitter.broadcast({ type: 'soundInteractionsStop' });
	wildLandingInstances.clear();
}
export const playBet = async (bet: Bet) => {
	cancelPlayBet();
	const run = new AbortController();
	activePlayback = run;
	wildLandingInstances.clear();
	stateBet.winBookEventAmount = 0;
	Object.assign(stateRound, createRoundState());
	try {
		await playBookEvents(bet.state, { signal: run.signal });
	} catch (error) {
		if (activePlayback === run) resetPresentation();
		throw error;
	} finally {
		if (activePlayback === run) {
			activePlayback = undefined;
			eventEmitter.broadcast({ type: 'stopButtonEnable' });
		}
	}
};

// Pure recovery conversion is shared by the template actor and tests.
export { convertTorResumableBet } from './resumeBook';

// other utils
export const getSymbolX = (reelIndex: number) => SYMBOL_WIDTH * (reelIndex + REEL_PADDING);
export const getSymbolY = (symbolIndexOfBoard: number) => (symbolIndexOfBoard + 0.5) * SYMBOL_SIZE;

export const getArtworkName = (name: RawSymbol['name']) =>
	Object.hasOwn(mathToArtwork, name) ? mathToArtwork[name as MathSymbolName] : name;

export const getSymbolInfo = ({
	rawSymbol,
	state,
}: {
	rawSymbol: RawSymbol;
	state: SymbolState;
}) => {
	const name = getArtworkName(rawSymbol.name) as keyof typeof SYMBOL_INFO_MAP;
	if (name === 'S')
		return {
			type: 'spine' as const,
			assetKey: 'wpScatterBag',
			animationName: state === 'win' ? 'bag_shake' : state === 'land' ? 'bag_land' : 'closed_idle',
			sizeRatios: { width: 1.18, height: 1.18 },
		};
	return SYMBOL_INFO_MAP[name][state];
};
