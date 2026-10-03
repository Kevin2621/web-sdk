import _ from 'lodash';

import { recordBookEvent, checkIsMultipleRevealEvents, type BookEventHandlerMap } from 'utils-book';
import { stateBet, stateUi } from 'state-shared';
import { sequence } from 'utils-shared/sequence';
import { presentationWait } from './presentationWait';
import { bonusCues } from './bonusCues.mjs';
import { planBonusEnding } from './bonusEnding.mjs';
import { bonusEnding, statePresentation } from './statePresentation.svelte';
import { startBonusWin, bonusWin } from './bonusWin.svelte';
import { celebrateSeeds } from './seedCelebration.svelte';
import { presentWinLines } from './winLinePresentation.svelte';
import { autoplaySettings } from './playerAutoplay';
import { playerSpeed } from './playerSpeed.svelte';
import { scatterAnticipation } from './scatterAnticipation';
import { selectedRules } from './selectedConfig';

import { eventEmitter } from './eventEmitter';
import { playBookEvent } from './utils';
import { winLevelMap, type WinLevel, type WinLevelData } from './winLevelMap';
import { stateGame, stateGameDerived, stateRound, wildLandingInstances } from './stateGame.svelte';
import { applyRoundEvent, restoreRoundState, isSelectedEvents } from './selectedBook';
import type { BookEvent, BookEventOfType, BookEventContext } from './typesBookEvent';
import type { Position } from './types';
import config from './config';

const winLevelSoundsPlay = ({ winLevelData }: { winLevelData: WinLevelData }) => {
	if (winLevelData?.alias === 'max') eventEmitter.broadcastAsync({ type: 'uiHide' });
	if (winLevelData?.sound?.sfx) {
		eventEmitter.broadcast({ type: 'soundOnce', name: winLevelData.sound.sfx });
	}
	if (winLevelData?.sound?.bgm) {
		eventEmitter.broadcast({ type: 'soundMusic', name: winLevelData.sound.bgm });
	}
	if (winLevelData?.type === 'big') {
		eventEmitter.broadcast({ type: 'soundLoop', name: 'sfx_bigwin_coinloop' });
	}
};

const winLevelSoundsStop = () => {
	eventEmitter.broadcast({ type: 'soundStop', name: 'sfx_bigwin_coinloop' });
	if (stateBet.activeBetModeKey === 'SUPERSPIN' || stateGame.gameType === 'freegame') {
		// check if SUPERSPIN, when finishing a bet.
		eventEmitter.broadcast({ type: 'soundMusic', name: 'bgm_freespin' });
	} else {
		eventEmitter.broadcast({ type: 'soundMusic', name: 'bgm_main' });
	}
	eventEmitter.broadcastAsync({ type: 'uiShow' });
};

const animateSymbols = async ({ positions }: { positions: Position[] }) => {
	eventEmitter.broadcast({ type: 'boardShow' });
	await eventEmitter.broadcastAsync({
		type: 'boardWithAnimateSymbols',
		symbolPositions: positions,
	});
};

export const bookEventHandlerMap: BookEventHandlerMap<BookEvent, BookEventContext> = {
	reveal: async (bookEvent: BookEventOfType<'reveal'>, { bookEvents }: BookEventContext) => {
		const selected = isSelectedEvents(bookEvents);
		if (selected) {
			statePresentation.message = '';
			statePresentation.cuePositions = [];
			bonusEnding.arm(planBonusEnding(bookEvents, bookEvent));
		}
		const isBonusGame = checkIsMultipleRevealEvents({ bookEvents });
		if (isBonusGame) {
			eventEmitter.broadcast({ type: 'stopButtonEnable' });
			recordBookEvent({ bookEvent });
		}

		applyRoundEvent(stateRound, bookEvent);
		stateGame.gameType = bookEvent.gameType;
		await stateGameDerived.enhancedBoard.spin({
			revealEvent:
				selected && bookEvent.gameType === 'basegame'
					? {
							...bookEvent,
							anticipation: scatterAnticipation(
								bookEvent.board,
								stateBet.isTurbo || playerSpeed.mode === 2,
							),
						}
					: bookEvent,
			paddingBoard: config.paddingReels[bookEvent.gameType],
		});
		eventEmitter.broadcast({ type: 'soundScatterCounterClear' });
		if (selected) bonusEnding.begin('landed');
	},
	wildPickinsSpinResult: async (
		bookEvent: BookEventOfType<'wildPickinsSpinResult'>,
		{ signal }: BookEventContext,
	) => {
		await wildLandingInstances.finishAt(
			bookEvent.stickyAfter.filter(
				(cell) => !stateRound.sticky.some((old) => old.reel === cell.reel && old.row === cell.row),
			),
		);
		signal?.throwIfAborted();
		applyRoundEvent(stateRound, bookEvent);
		// Landing completes before a newly rooted Wild takes over its fixed cell.
		stateGameDerived.enhancedBoard.settle(stateRound.board);
		if (bonusWin.visible) bonusWin.amount = bookEvent.bonusTotal;
		const cues = bonusCues(bookEvent, selectedRules.spinBudget, selectedRules.roundCap);
		statePresentation.remaining = bookEvent.remaining - bookEvent.grantedExtraSpins;
		try {
			for (const cue of cues) {
				statePresentation.message = cue.text;
				statePresentation.cuePositions = cue.positions;
				if (cue.sound) eventEmitter.broadcast({ type: 'soundOnce', name: cue.sound });
				await presentationWait(1600, signal);
				signal?.throwIfAborted();
			}
		} finally {
			if (!signal?.aborted) statePresentation.cuePositions = [];
		}
		for (let added = 0; added < bookEvent.grantedExtraSpins; added++) {
			statePresentation.remaining++;
			eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_fs_respins' });
			await presentationWait(140, signal);
			signal?.throwIfAborted();
		}
		statePresentation.remaining = bookEvent.remaining;
		if (stateRound.inBonus) await presentationWait(cues.length ? 700 : 650, signal);
		signal?.throwIfAborted();
		bonusEnding.begin('result');
		if (stateRound.inBonus) {
			eventEmitter.broadcast({
				type: 'freeSpinCounterUpdate',
				current: stateRound.completed,
				total: stateRound.granted,
			});
			stateUi.freeSpinCounterCurrent = stateRound.completed;
			stateUi.freeSpinCounterTotal = stateRound.granted;
		}
	},
	winInfo: async (
		bookEvent: BookEventOfType<'winInfo'>,
		{ bookEvents, signal }: BookEventContext,
	) => {
		if (isSelectedEvents(bookEvents)) {
			const following = bookEvents.slice(bookEvents.indexOf(bookEvent) + 1);
			const nextReveal = following.findIndex((event) => event.type === 'reveal');
			const award = following
				.slice(0, nextReveal < 0 ? undefined : nextReveal)
				.find((event) => event.type === 'setWin');
			const spinPayout = award?.amount ?? bookEvent.totalWin;
			if (spinPayout > 0 && (stateGame.gameType === 'basegame' || spinPayout < 1000))
				eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_money_drop' });
			if (bookEvent.wins.length) {
				await presentWinLines(
					bookEvent.wins.map((win) => ({ positions: win.positions, amount: win.win })),
					signal,
				);
			}
			if (stateGame.gameType === 'freegame' && spinPayout >= 1000 && !bonusEnding.active)
				eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_money_pour' });
			return;
		}
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_winlevel_small' });
		await sequence(bookEvent.wins, async (win) => {
			await animateSymbols({ positions: win.positions });
		});
	},
	setTotalWin: async (bookEvent: BookEventOfType<'setTotalWin'>) => {
		stateBet.winBookEventAmount = bookEvent.amount;
	},
	freeSpinTrigger: async (
		bookEvent: BookEventOfType<'freeSpinTrigger'>,
		{ bookEvents, signal }: BookEventContext,
	) => {
		applyRoundEvent(stateRound, bookEvent);
		statePresentation.remaining = bookEvent.totalFs;
		if (isSelectedEvents(bookEvents)) {
			await eventEmitter.broadcastAsync({ type: 'soundBonusEntryReady' });
			signal?.throwIfAborted();
			if (autoplaySettings.stopOnBonus) stateBet.autoSpinsCounter = 0;
			startBonusWin();
			statePresentation.remaining = bookEvent.totalFs;
			stateUi.freeSpinCounterShow = true;
			stateUi.freeSpinCounterCurrent = 0;
			stateUi.freeSpinCounterTotal = bookEvent.totalFs;
			await celebrateSeeds(
				bookEvent.totalFs,
				signal,
				() => {
					stateGame.gameType = 'freegame';
				},
				(event) => eventEmitter.broadcast(event),
			);
			signal?.throwIfAborted();
			eventEmitter.broadcast({ type: 'soundMusic', name: 'bgm_freespin' });
			return;
		}
		// animate scatters
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_scatter_win_v2' });
		await animateSymbols({ positions: bookEvent.positions });
		// show free spin intro
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_superfreespin' });
		await eventEmitter.broadcastAsync({ type: 'uiHide' });
		await eventEmitter.broadcastAsync({ type: 'transition' });
		eventEmitter.broadcast({ type: 'freeSpinIntroShow' });
		eventEmitter.broadcast({ type: 'soundOnce', name: 'jng_intro_fs' });
		eventEmitter.broadcast({ type: 'soundMusic', name: 'bgm_freespin' });
		await eventEmitter.broadcastAsync({
			type: 'freeSpinIntroUpdate',
			totalFreeSpins: bookEvent.totalFs,
		});
		stateGame.gameType = 'freegame';
		eventEmitter.broadcast({ type: 'freeSpinIntroHide' });
		eventEmitter.broadcast({ type: 'boardFrameGlowShow' });
		eventEmitter.broadcast({ type: 'freeSpinCounterShow' });
		stateUi.freeSpinCounterShow = true;
		eventEmitter.broadcast({
			type: 'freeSpinCounterUpdate',
			current: undefined,
			total: bookEvent.totalFs,
		});
		stateUi.freeSpinCounterTotal = bookEvent.totalFs;
		await eventEmitter.broadcastAsync({ type: 'uiShow' });
		await eventEmitter.broadcastAsync({ type: 'drawerButtonShow' });
		eventEmitter.broadcast({ type: 'drawerFold' });
	},
	updateFreeSpin: async (bookEvent: BookEventOfType<'updateFreeSpin'>) => {
		statePresentation.remaining = Math.max(0, bookEvent.total - bookEvent.amount - 1);
		eventEmitter.broadcast({ type: 'freeSpinCounterShow' });
		stateUi.freeSpinCounterShow = true;
		eventEmitter.broadcast({
			type: 'freeSpinCounterUpdate',
			current: bookEvent.amount + 1,
			total: bookEvent.total,
		});
		stateUi.freeSpinCounterCurrent = bookEvent.amount + 1;
		stateUi.freeSpinCounterTotal = bookEvent.total;
	},
	freeSpinEnd: async (
		bookEvent: BookEventOfType<'freeSpinEnd'>,
		{ bookEvents, signal }: BookEventContext,
	) => {
		if (isSelectedEvents(bookEvents)) {
			await bonusEnding.finish(() => {
				bonusWin.amount = bookEvent.amount;
				statePresentation.bonusSummary = true;
				statePresentation.message = `BONUS COMPLETE · ${bookEvent.amount / 100}×`;
			}, bookEvent.amount);
			signal?.throwIfAborted();
			if (stateRound.sticky.length) {
				statePresentation.releasingSticky = true;
				await presentationWait(320, signal);
				signal?.throwIfAborted();
			}
			statePresentation.releasingSticky = false;
			applyRoundEvent(stateRound, bookEvent);
			statePresentation.remaining = 0;
			stateGame.gameType = 'basegame';
			stateUi.freeSpinCounterShow = false;
			eventEmitter.broadcast({ type: 'freeSpinCounterHide' });
			return;
		}
		const winLevelData = winLevelMap[bookEvent.winLevel as WinLevel];

		await eventEmitter.broadcastAsync({ type: 'uiHide' });
		applyRoundEvent(stateRound, bookEvent);
		stateGame.gameType = 'basegame';
		eventEmitter.broadcast({ type: 'boardFrameGlowHide' });
		eventEmitter.broadcast({ type: 'freeSpinOutroShow' });
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_youwon_panel' });
		winLevelSoundsPlay({ winLevelData });
		await eventEmitter.broadcastAsync({
			type: 'freeSpinOutroCountUp',
			amount: bookEvent.amount,
			winLevelData,
		});
		winLevelSoundsStop();
		eventEmitter.broadcast({ type: 'freeSpinOutroHide' });
		eventEmitter.broadcast({ type: 'freeSpinCounterHide' });
		stateUi.freeSpinCounterShow = false;
		await eventEmitter.broadcastAsync({ type: 'transition' });
		await eventEmitter.broadcastAsync({ type: 'uiShow' });
		await eventEmitter.broadcastAsync({ type: 'drawerUnfold' });
		eventEmitter.broadcast({ type: 'drawerButtonHide' });
	},
	setWin: async (bookEvent: BookEventOfType<'setWin'>, { bookEvents }: BookEventContext) => {
		// Selected line totals were already shown by winInfo; scatter-only awards still need payout audio.
		if (isSelectedEvents(bookEvents)) {
			const before = bookEvents.slice(0, bookEvents.indexOf(bookEvent));
			const lastReveal = before.findLastIndex((event) => event.type === 'reveal');
			const linePaid = before
				.slice(lastReveal + 1)
				.some((event) => event.type === 'winInfo' && event.wins.length > 0);
			if (!linePaid && bookEvent.amount > 0) {
				if (stateGame.gameType === 'basegame' || bookEvent.amount < 1000)
					eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_money_drop' });
				else if (!bonusEnding.active)
					eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_money_pour' });
			}
			return;
		}
		const winLevelData = winLevelMap[bookEvent.winLevel as WinLevel];

		eventEmitter.broadcast({ type: 'winShow' });
		winLevelSoundsPlay({ winLevelData });
		await eventEmitter.broadcastAsync({
			type: 'winUpdate',
			amount: bookEvent.amount,
			winLevelData,
		});
		winLevelSoundsStop();
		eventEmitter.broadcast({ type: 'winHide' });
	},
	finalWin: async (bookEvent: BookEventOfType<'finalWin'>) => {
		// Do nothing
	},
	// customised
	createBonusSnapshot: async (bookEvent: BookEventOfType<'createBonusSnapshot'>) => {
		const { bookEvents } = bookEvent;
		if (isSelectedEvents(bookEvents)) {
			Object.assign(stateRound, restoreRoundState(bookEvents));
			statePresentation.remaining = stateRound.remaining;
			statePresentation.bonusSummary = bookEvents.some((event) => event.type === 'freeSpinEnd');
			if (stateRound.inBonus) {
				if (autoplaySettings.stopOnBonus) stateBet.autoSpinsCounter = 0;
				startBonusWin();
				bonusWin.amount = stateRound.bonusTotal;
			}
			if (stateRound.board.length) stateGameDerived.enhancedBoard.settle(stateRound.board);
			stateGame.gameType = stateRound.inBonus ? 'freegame' : 'basegame';
			stateBet.winBookEventAmount = stateRound.roundTotal;
			stateUi.freeSpinCounterShow = stateRound.inBonus;
			stateUi.freeSpinCounterCurrent = stateRound.completed;
			stateUi.freeSpinCounterTotal = stateRound.granted;
			eventEmitter.broadcast({
				type: stateRound.inBonus ? 'freeSpinCounterShow' : 'freeSpinCounterHide',
			});
			eventEmitter.broadcast({
				type: 'freeSpinCounterUpdate',
				current: stateRound.completed,
				total: stateRound.granted,
			});
			eventEmitter.broadcast({
				type: 'soundMusic',
				name: stateRound.inBonus ? 'bgm_freespin' : 'bgm_main',
			});
			return;
		}

		function findLastBookEvent<T>(type: T) {
			return _.findLast(bookEvents, (bookEvent) => bookEvent.type === type) as
				| BookEventOfType<T>
				| undefined;
		}

		const lastFreeSpinTriggerEvent = findLastBookEvent('freeSpinTrigger' as const);
		const lastUpdateFreeSpinEvent = findLastBookEvent('updateFreeSpin' as const);
		const lastSetTotalWinEvent = findLastBookEvent('setTotalWin' as const);

		if (lastFreeSpinTriggerEvent) await playBookEvent(lastFreeSpinTriggerEvent, { bookEvents });
		if (lastUpdateFreeSpinEvent) playBookEvent(lastUpdateFreeSpinEvent, { bookEvents });
		if (lastSetTotalWinEvent) playBookEvent(lastSetTotalWinEvent, { bookEvents });
	},
};
