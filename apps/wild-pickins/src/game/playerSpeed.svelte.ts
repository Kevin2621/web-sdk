import { stateBet, stateConfig } from 'state-shared';

export const playerSpeed = $state({ mode: 0 as 0 | 1 | 2 });
export function cyclePlayerSpeed() {
 if (stateConfig.jurisdiction.disabledTurbo) return;
 playerSpeed.mode = ((playerSpeed.mode + 1) % (stateConfig.jurisdiction.disabledSuperTurbo ? 2 : 3)) as 0 | 1 | 2;
 // Preserve the SDK's existing fastest path only for the double-bolt mode.
 stateBet.isTurbo = playerSpeed.mode === 2;
}

// Shared win pacing; capture once when a presentation starts.
const winTimings = [
 { symbols: 1750, paylines: 1350, countUp: 450, entrance: 180 },
 { symbols: 900, paylines: 700, countUp: 200, entrance: 90 },
 { symbols: 400, paylines: 300, countUp: 80, entrance: 0 },
] as const;
export const getWinTiming = () => winTimings[playerSpeed.mode];
