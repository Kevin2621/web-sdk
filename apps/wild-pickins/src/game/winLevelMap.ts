import { SECOND } from 'constants-shared/time';

export const winLevelMap = {
	1: {
		level: 1,
		alias: 'zero',
		type: 'small',
		presentDuration: 0,
	},
	2: {
		level: 2,
		alias: 'standard',
		type: 'small',
		presentDuration: 0.6 * SECOND,
	},
	3: {
		level: 3,
		alias: 'small',
		type: 'small',
		presentDuration: 1 * SECOND,
	},
	4: {
		level: 4,
		alias: 'nice',
		type: 'medium',
		presentDuration: 1.5 * SECOND,
	},
	5: {
		level: 5,
		alias: 'substantial',
		type: 'medium',
		presentDuration: 2.0 * SECOND,
	},
	6: {
		level: 6,
		alias: 'big',
		type: 'big',
		presentDuration: 6 * SECOND,
	},
	7: {
		level: 7,
		alias: 'superwin',
		type: 'big',
		presentDuration: 18 * SECOND,
	},
	8: {
		level: 8,
		alias: 'mega',
		type: 'big',
		presentDuration: 20 * SECOND,
	},
	9: {
		level: 9,
		alias: 'epic',
		type: 'big',
		presentDuration: 26 * SECOND,
	},
	10: {
		level: 10,
		alias: 'max',
		type: 'big',
		presentDuration: 32 * SECOND,
	},
} as const;

export type WinLevelMap = typeof winLevelMap;
export type WinLevel = keyof typeof winLevelMap;
export type WinLevelData = {level:number;alias:WinLevelMap[WinLevel]['alias'];type:'small'|'medium'|'big';presentDuration:number};
export type WinLevelAlias = WinLevelData['alias'];
