import { bonusEnding } from './bonusEndingController';
import { planBonusEnding } from './bonusEnding.mjs';
import { bonusWin, resetBonusWin, startBonusWin, updateBonusWin } from './bonusWin.svelte';
import { autoplaySettings } from './playerAutoplay';
import { celebrateSeeds } from './seedCelebration.svelte';
import { scatterAnticipation } from './scatterAnticipation';
import _ from 'lodash';

import { recordBookEvent, checkIsMultipleRevealEvents, type BookEventHandlerMap } from 'utils-book';
import { stateBet, stateUi } from 'state-shared';

import { eventEmitter } from './eventEmitter';
import { playBookEvent } from './utils';
import { winLevelMap, type WinLevel, type WinLevelData } from './winLevelMap';
import { stateGame, stateGameDerived } from './stateGame.svelte';
import type { BookEvent, BookEventOfType, BookEventContext } from './typesBookEvent';
import type { Position } from './types';
import config from './config';

const winLevelSoundsPlay = ({ winLevelData }: { winLevelData: WinLevelData }) => {
	if (bonusEnding.active) return;
	if (winLevelData?.alias === 'max') eventEmitter.broadcastAsync({ type: 'uiHide' });
	if (stateGame.gameType === 'basegame') return;
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
		// Resume bonus music after a win celebration.
		eventEmitter.broadcast({ type: 'soundMusic', name: 'bgm_freespin' });
	}
	// Base payouts leave the relaxing music running underneath the money drop.
	eventEmitter.broadcastAsync({ type: 'uiShow' });
};

const animateSymbols = async ({ positions }: { positions: Position[] }) => {
	eventEmitter.broadcast({ type: 'boardShow' });
	await eventEmitter.broadcastAsync({
		type: 'boardWithAnimateSymbols',
		symbolPositions: positions,
	});
};

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
		const cells = new Map<string, Position>();
		for (const win of bookEvent.wins) for (const p of win.positions) cells.set(`${p.reel}:${p.row}`, p);
		if (cells.size) await animateSymbols({ positions: [...cells.values()] });
        if(stateGame.gameType==='freegame' && spinPayout>0) eventEmitter.broadcast({type:'soundOnce',name:'sfx_money_pour'});
	},
	setTotalWin: async (bookEvent: BookEventOfType<'setTotalWin'>) => {
		stateBet.winBookEventAmount = bookEvent.amount;
		updateBonusWin(bookEvent.amount);
	},
	freeSpinTrigger: async (bookEvent: BookEventOfType<'freeSpinTrigger'>) => {
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
        const winLevelData = winLevelMap[bookEvent.winLevel as WinLevel];
        await eventEmitter.broadcastAsync({type:'uiHide'});
        const completed = await bonusEnding.finish(async()=>{
         bonusWin.amount=bookEvent.amount;
         eventEmitter.broadcast({type:'boardFrameGlowHide'});
         eventEmitter.broadcast({type:'freeSpinOutroShow'});
         await eventEmitter.broadcastAsync({type:'freeSpinOutroCountUp',amount:bookEvent.amount,winLevelData});
        });
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
        if (!presentedLinePayout && bookEvent.amount > 0 && (stateGame.gameType === 'basegame' || bookEvent.amount < 1000))
         eventEmitter.broadcast({type:'soundOnce',name:'sfx_money_drop'});
        presentedLinePayout = false;
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
