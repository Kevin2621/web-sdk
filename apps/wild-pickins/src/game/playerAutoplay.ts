export type AutoplayRound = { win: number; bonus: boolean };

// Snapshot at Start: editing the panel never changes an ongoing session.
export const autoplaySettings = { stopOnBonus: true };

export function autoplayStopReason(round: AutoplayRound, netLoss: number, stopOnBonus: boolean, lossLimit: number, winLimit: number) {
 if (stopOnBonus && round.bonus) return 'Autoplay stopped after the bonus.';
 if (Number.isFinite(lossLimit) && netLoss >= lossLimit - 1e-9) return 'Autoplay stopped: session loss limit reached.';
 if (Number.isFinite(winLimit) && round.win >= winLimit - 1e-9) return 'Autoplay stopped: single-win limit reached.';
 return '';
}
