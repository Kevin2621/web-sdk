import { createBonusEnding } from './bonusEnding.mjs';
import { cancelWinLinePresentation } from './winLinePresentation.svelte';
import { cancelSeedCelebration } from './seedCelebration.svelte';
import { resetBonusWin } from './bonusWin.svelte';
import { eventEmitter } from './eventEmitter';
import type { Position } from './types';

export const statePresentation = $state({
	message: '',
	cuePositions: [] as Position[],
	remaining: 0,
	releasingSticky: false,
	bonusSummary: false,
});
export const bonusEnding = createBonusEnding({
	emit: (
		phase: 'begin' | 'summary' | 'return' | 'cancel' | 'complete',
		profile: { tier: 'quiet' | 'modest' | 'strong' | 'grand' },
	) => eventEmitter.broadcast({ type: 'soundBonusEnding', phase, tier: profile.tier }),
});
export function resetPresentation() {
	bonusEnding.cancel();
	cancelWinLinePresentation();
	cancelSeedCelebration();
	resetBonusWin();
	Object.assign(statePresentation, {
		message: '',
		cuePositions: [],
		remaining: 0,
		releasingSticky: false,
		bonusSummary: false,
	});
}
