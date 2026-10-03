export type WinLineSpeed = 'base' | 'quick' | 'ultra';
export type WinLinePayoutMode = 'float' | 'collect';

const schedules = {
	base: { dim: 420, line: 620, draw: 240, hold: 450, light: 300, pause: 450 },
	quick: { dim: 240, line: 400, draw: 180, hold: 200, light: 180, pause: 300 },
	ultra: { dim: 180, line: 350, draw: 238, hold: 280, light: 160, pause: 300 },
} as const;

export function getWinLineTiming(
	count: number,
	speed: WinLineSpeed,
	payoutMode: WinLinePayoutMode,
) {
	const collect = payoutMode === 'collect' && (count > 1 || (speed === 'ultra' && count > 0));
	const ultraCollect = speed === 'ultra' && collect;
	const quickTiming = speed === 'quick' || (speed === 'ultra' && payoutMode === 'collect');
	const schedule =
		count === 1 && speed === 'base'
			? { ...schedules.base, line: 830, draw: 500 }
			: ultraCollect
				? { ...schedules.quick, dim: 180, line: 300, light: 120, pause: 100 }
				: speed === 'ultra' && payoutMode === 'collect'
					? schedules.quick
					: schedules[speed];
	const sequenceDuration = schedule.line * (speed === 'ultra' ? 1 : count);
	const mergeStart = schedule.dim + sequenceDuration + (ultraCollect ? 0 : quickTiming ? 90 : 140);
	const mergeDuration = ultraCollect ? 140 : quickTiming ? 230 : 320;
	const mergeEnd = mergeStart + mergeDuration;
	const totalHold = ultraCollect ? 450 : quickTiming ? 350 : 500;
	const totalExitDuration = ultraCollect ? 160 : quickTiming ? 220 : 320;
	const lightStart = ultraCollect
		? mergeEnd
		: collect
			? mergeEnd + totalHold + totalExitDuration
			: schedule.dim + sequenceDuration + schedule.hold;
	const releaseAt = ultraCollect
		? lightStart + schedule.light + 100
		: lightStart + schedule.light + schedule.pause;
	return {
		schedule,
		collect,
		quickTiming,
		sequenceDuration,
		mergeStart,
		mergeDuration,
		mergeEnd,
		totalHold,
		totalExitDuration,
		lightStart,
		releaseAt,
		totalDuration: ultraCollect ? mergeEnd + totalHold + totalExitDuration : releaseAt,
	};
}
