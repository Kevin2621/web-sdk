import { stateBet, stateMeta, type BetModeMeta } from 'state-shared';
import { selectedModes, bookUnitsToMultiplier } from './selectedConfig';
import { setContextEventEmitter, getContextEventEmitter } from 'utils-event-emitter';
import { setContextXstate, getContextXstate } from 'utils-xstate';
import { setContextLayout, getContextLayout } from 'utils-layout';
import { setContextApp, getContextApp } from 'pixi-svelte';

import { eventEmitter, type EmitterEvent } from './eventEmitter';
import { stateXstate, stateXstateDerived } from './stateXstate';
import { stateLayout, stateLayoutDerived } from './stateLayout';
import { stateApp } from './stateApp';

import { stateGame, stateGameDerived } from './stateGame.svelte';
import { i18nDerived } from '../i18n/i18nDerived';

export const setContext = () => {
	stateMeta.betModeMeta = Object.fromEntries(
		Object.entries(selectedModes).map(([mode, data]) => [
			mode.toUpperCase(),
			{
				mode,
				costMultiplier: data.cost,
				type: mode === 'base' ? 'default' : 'buy',
				maxWin: bookUnitsToMultiplier(data.maxWinBookUnits),
				parent: '',
				children: '',
				assets: { icon: '', volatility: '', button: '', dialogImage: '', dialogVolatility: '' },
				text: {
					title: data.title,
					dialog:
						mode === 'base'
							? ''
							: `${data.initialSpins} initial free spins at ${data.cost}× the base bet.`,
					button: mode === 'base' ? 'SPIN' : 'BUY',
					tickerIdle: '',
					tickerSpin: '',
				},
			},
		]),
	) as BetModeMeta;
	if (!stateBet.betToResume) stateBet.activeBetModeKey = 'base';
	setContextEventEmitter<EmitterEvent>({ eventEmitter });
	setContextXstate({ stateXstate, stateXstateDerived });
	setContextLayout({ stateLayout, stateLayoutDerived });
	setContextApp({ stateApp });
};

export const getContext = () => ({
	...getContextEventEmitter<EmitterEvent>(),
	...getContextLayout(),
	...getContextXstate(),
	...getContextApp(),
	stateGame,
	stateGameDerived,
	i18nDerived,
});
