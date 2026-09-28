import { bonusEnding } from './bonusEndingController';
import { bonusEndingProfile, planBonusEnding } from './bonusEnding.mjs';
import { bonusWin, resetBonusWin, startBonusWin, updateBonusWin } from './bonusWin.svelte';
import { autoplaySettings } from './playerAutoplay';
import { celebrateSeeds, seedCelebration } from './seedCelebration.svelte';
import { scatterAnticipation } from './scatterAnticipation';
import _ from 'lodash';

import { recordBookEvent, checkIsMultipleRevealEvents, type BookEventHandlerMap } from 'utils-book';
import { stateBet, stateUi } from 'state-shared';

import { eventEmitter } from './eventEmitter';
import { playBookEvent } from './utils';
import { winLevelMap, type WinLevel } from './winLevelMap';
import { stateGame, stateGameDerived } from './stateGame.svelte';
import { presentWinLines } from './winLinePresentation.svelte';
import type { BookEvent, BookEventOfType, BookEventContext } from './typesBookEvent';
import config from './config';

let presentedLinePayout = false;

export const bookEventHandlerMap: BookEventHandlerMap<BookEvent, BookEventContext> = {
	reveal: async (bookEvent: BookEventOfType<'reveal'>, { bookEvents }: BookEventContext) => {
		bonusEnding.arm(planBonusEnding(bookEvents,bookEvent));
		presentedLinePayout = false;
		if(bookEvent.gameType==='basegame')resetBonusWin();
		const isBonusGame = checkIsMultipleRevealEvents({ bookEvents });
		if (isBonusGame) {
			eventEmitter.broadcast({ type: 'stopButtonEnable' });
			recordBookEvent({ bookEvent });
		}

		stateGame.gameType = bookEvent.gameType;
		await stateGameDerived.enhancedBoard.spin({
			revealEvent: { ...bookEvent, anticipation: scatterAnticipation(bookEvent.board, stateBet.isTurbo) },
			paddingBoard: config.paddingReels[bookEvent.gameType],
		});
		seedCelebration.openTriggerBags = [];
		bonusEnding.begin('landed');
	},
	winInfo: async (bookEvent: BookEventOfType<'winInfo'>, { bookEvents }: BookEventContext) => {
        const following = bookEvents.slice(bookEvents.indexOf(bookEvent) + 1);
        const nextReveal = following.findIndex(event => event.type === 'reveal');
        const award = following.slice(0, nextReveal < 0 ? undefined : nextReveal).find(event => event.type === 'setWin');
		const spinPayout = award?.amount ?? bookEvent.totalWin;
        presentedLinePayout = spinPayout > 0;
        if (spinPayout > 0 && (stateGame.gameType === 'basegame' || spinPayout < 1000))
         eventEmitter.broadcast({type:'soundOnce',name:'sfx_money_drop'});
		if (bookEvent.wins.length) {
			eventEmitter.broadcast({ type: 'boardShow' });
			await presentWinLines(bookEvent.wins.map(win => ({amount:win.win,positions:win.positions})));
		}
        if(stateGame.gameType==='freegame' && spinPayout>=1000 && !bonusEnding.active) eventEmitter.broadcast({type:'soundOnce',name:'sfx_money_pour'});
	},
	setTotalWin: async (bookEvent: BookEventOfType<'setTotalWin'>) => {
		stateBet.winBookEventAmount = bookEvent.amount;
		updateBonusWin(bookEvent.amount);
	},
	freeSpinTrigger: async (bookEvent: BookEventOfType<'freeSpinTrigger'>) => {
        await eventEmitter.broadcastAsync({type:'soundBonusEntryReady'});
        startBonusWin(stateBet.winBookEventAmount);
        if (autoplaySettings.stopOnBonus) stateBet.autoSpinsCounter=0;
        eventEmitter.broadcast({type:'freeSpinCounterUpdate',current:0,total:bookEvent.totalFs});
        eventEmitter.broadcast({type:'freeSpinCounterShow'});
        await celebrateSeeds(bookEvent.totalFs,undefined,()=>{stateGame.gameType='freegame';},event=>eventEmitter.broadcast(event));
        eventEmitter.broadcast({type:'soundMusic',name:'bgm_freespin'});
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
	freeSpinEnd: async (bookEvent: BookEventOfType<'freeSpinEnd'>) => {
		const outcome=bonusEndingProfile(bookEvent.amount);
		const winLevelData = {...winLevelMap[outcome.winLevel as WinLevel],presentDuration:outcome.countUp};
        await eventEmitter.broadcastAsync({type:'uiHide'});
        const completed = await bonusEnding.finish(async()=>{
         bonusWin.amount=bookEvent.amount;
         eventEmitter.broadcast({type:'boardFrameGlowHide'});
         eventEmitter.broadcast({type:'freeSpinOutroShow'});
         await eventEmitter.broadcastAsync({type:'freeSpinOutroCountUp',amount:bookEvent.amount,winLevelData});
        },bookEvent.amount);
        if(!completed)return;
        stateGame.gameType='basegame';
		eventEmitter.broadcast({ type: 'freeSpinOutroHide' });
		eventEmitter.broadcast({ type: 'freeSpinCounterHide' });
		stateUi.freeSpinCounterShow = false;
		await eventEmitter.broadcastAsync({ type: 'transition' });
		await eventEmitter.broadcastAsync({ type: 'uiShow' });
		await eventEmitter.broadcastAsync({ type: 'drawerUnfold' });
		eventEmitter.broadcast({ type: 'drawerButtonHide' });
	},
	setWin: async (bookEvent: BookEventOfType<'setWin'>) => {
        if (!presentedLinePayout && bookEvent.amount > 0) {
         if(stateGame.gameType==='basegame' || bookEvent.amount<1000)eventEmitter.broadcast({type:'soundOnce',name:'sfx_money_drop'});
         else if(!bonusEnding.active)eventEmitter.broadcast({type:'soundOnce',name:'sfx_money_pour'});
        }
        presentedLinePayout = false;
		// The line presentation and settled round total own the visible payout.
	},
	finalWin: async (bookEvent: BookEventOfType<'finalWin'>) => {
		// Do nothing
	},
	// customised
	createBonusSnapshot: async (bookEvent: BookEventOfType<'createBonusSnapshot'>) => {
		const { bookEvents } = bookEvent;

		function findLastBookEvent<T>(type: T) {
			return _.findLast(bookEvents, (bookEvent) => bookEvent.type === type) as
				| BookEventOfType<T>
				| undefined;
		}

		const lastFreeSpinTriggerEvent = findLastBookEvent('freeSpinTrigger' as const);
		const lastUpdateFreeSpinEvent = findLastBookEvent('updateFreeSpin' as const);
		const lastSetTotalWinEvent = findLastBookEvent('setTotalWin' as const);
		const lastUpdateGlobalMultEvent = findLastBookEvent('updateGlobalMult' as const);

		if (lastFreeSpinTriggerEvent) await playBookEvent(lastFreeSpinTriggerEvent, { bookEvents });
		if (lastUpdateFreeSpinEvent) playBookEvent(lastUpdateFreeSpinEvent, { bookEvents });
		if (lastSetTotalWinEvent) playBookEvent(lastSetTotalWinEvent, { bookEvents });
		if (lastUpdateGlobalMultEvent) playBookEvent(lastUpdateGlobalMultEvent, { bookEvents });
	},
};
