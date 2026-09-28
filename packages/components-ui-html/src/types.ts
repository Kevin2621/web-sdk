export type EmitterEventModal =
	| { type: 'soundPressGeneral'; action?: 'playAmount' | 'speed' }
	| { type: 'buyBonusConfirm' }
	| { type: 'bet' }
	| { type: 'autoBet' };
