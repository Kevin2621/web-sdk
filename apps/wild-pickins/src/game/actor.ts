import _ from 'lodash';

import { stateBet, stateUi } from 'state-shared';
import { checkIsMultipleRevealEvents } from 'utils-book';
import { createPrimaryMachines, createIntermediateMachines, createGameActor } from 'utils-xstate';

import type { Bet } from './typesBookEvent';
import { stateXstateDerived } from './stateXstate';
import { playBet, convertTorResumableBet } from './utils';
import { stateGame, stateGameDerived, stateRound } from './stateGame.svelte';
import config from './config';
import { isSelectedEvents, restoreRoundState, validateSelectedEvents } from './selectedBook';
import { cancelPlayBet } from './utils';
import { statePresentation } from './statePresentation.svelte';
import { bonusWin, startBonusWin } from './bonusWin.svelte';

const primaryMachines = createPrimaryMachines<Bet>({
	onResumeGameActive: (betToResume) => convertTorResumableBet(betToResume),
	onResumeGameInactive: (betToResume) => {
		if (isSelectedEvents(betToResume.state)) {
			validateSelectedEvents(betToResume.state);
			cancelPlayBet();
			Object.assign(stateRound, restoreRoundState(betToResume.state));
			stateGameDerived.enhancedBoard.settle(stateRound.board);
			stateGame.gameType = stateRound.inBonus ? 'freegame' : 'basegame';
			stateBet.winBookEventAmount = stateRound.roundTotal;
			statePresentation.remaining = stateRound.remaining;
			statePresentation.bonusSummary = betToResume.state.some(
				(event) => event.type === 'freeSpinEnd',
			);
			stateUi.freeSpinCounterShow = stateRound.inBonus;
			stateUi.freeSpinCounterCurrent = stateRound.completed;
			stateUi.freeSpinCounterTotal = stateRound.granted;
			if (betToResume.state.some((event) => event.type === 'freeSpinTrigger')) {
				startBonusWin();
				bonusWin.amount = stateRound.bonusTotal;
			}
			return;
		}

		const lastRevealEvent = _.findLast(
			betToResume.state,
			(bookEvent) => bookEvent?.type === 'reveal',
		);

		if (lastRevealEvent) stateGameDerived.enhancedBoard.settle(lastRevealEvent.board);
	},
	onNewGameStart: async () => {
		if ((stateBet.isTurbo && stateXstateDerived.isAutoBetting()) || stateBet.isSpaceHold) return;
		stateBet.winBookEventAmount = 0;
		await stateGameDerived.enhancedBoard.preSpin({
			paddingBoard: config.paddingReels[stateGame.gameType],
		});
	},
	onNewGameError: () => stateGameDerived.enhancedBoard.settle(),
	onPlayGame: async (bet) => await playBet(bet),
	checkIsBonusGame: (bet) => checkIsMultipleRevealEvents({ bookEvents: bet.state }),
});

const intermediateMachines = createIntermediateMachines(primaryMachines);

export const gameActor = createGameActor(intermediateMachines);
