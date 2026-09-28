export type SurfaceFields = {
	stopQueued: boolean;
	stopReason: string;
	motionReduced: boolean;
	language: string;
	balance: number;
	simulated: boolean;
	balanceNote: string;
	amount: number;
	currency: string;
	levels: number[];
	win: number;
	winLabel: string;
	showZeroWin: boolean;
	locked: boolean;
	loading: boolean;
	modal: unknown;
	menuOpen: boolean;
	autoOpen: boolean;
	canAfford: boolean;
	readyToStart: boolean;
	autoplayActive: boolean;
	running: boolean;
	remaining: number;
	customEditing: boolean;
	customDraft: string;
	customCount: string;
	chosen: number;
	customSelected: boolean;
	displayCount: (value: number) => string;
	playerSpeed: { mode: number };
	controlLabel: (key: string) => string;
	formatAmount: (value: number) => string;
	setAmount: (value: number) => void;
	pressSpin: () => void | Promise<void>;
	onspeedchange: () => void;
	openAuto: () => void;
	settings: () => void;
	openInformation: () => void;
	bonus: () => void;
	autoClosing: boolean;
	closeAuto: (animate?: boolean) => void | Promise<void>;
	text: string[];
	t: (key: string) => string;
	selectCount: (value: number) => void;
	editCustom: () => void | Promise<void>;
	digitsOnly: (event: InputEvent) => void;
	pasteCount: (event: ClipboardEvent) => void;
	enterCustom: (event: Event) => void;
	finishCustom: (cancel?: boolean) => void;
	stopOnBonus: boolean;
	lossEnabled: boolean;
	lossError: boolean;
	lossAmount?: number;
	lossTouched: boolean;
	winEnabled: boolean;
	winError: boolean;
	winAmount?: number;
	winTouched: boolean;
	menuClosing: boolean;
	closeMenu: () => void | Promise<void>;
	stateSound: { master: number; music: number; effects: number };
	volumeInput: (event: Event, channel: 'master' | 'music' | 'effects') => void;
	mute: () => void;
	playerMotion: { uiReduced: boolean; shakeDisabled: boolean };
	saveMotion: () => void;
	math: {
		paths: number[][];
		paytable: Record<string, Record<string, number>>;
		bonusPaytable: Record<string, Record<string, number>>;
	};
	paytableRules: string[];
	shakeHelp: string;
	symbolNames: Record<string, string>;
	betLocked: boolean;
	buyDisabled: boolean;
	turboDisabled: boolean;
	autoplayDisabled: boolean;
	speedText: string;
	autoCount: string;
	autoPanel: HTMLDialogElement;
	menu: HTMLDialogElement;
	customInput?: HTMLInputElement;
};
export type PlayerControlsSurfaceProps = {
	view: Omit<
		SurfaceFields,
		| 'menuOpen'
		| 'autoOpen'
		| 'stopOnBonus'
		| 'lossEnabled'
		| 'lossAmount'
		| 'lossTouched'
		| 'winEnabled'
		| 'winAmount'
		| 'winTouched'
		| 'autoPanel'
		| 'menu'
		| 'customInput'
		| 'controlLabel'
		| 'formatAmount'
		| 'setAmount'
		| 'pressSpin'
		| 'onspeedchange'
		| 'openAuto'
		| 'settings'
		| 'openInformation'
		| 'bonus'
		| 'closeAuto'
		| 't'
		| 'selectCount'
		| 'editCustom'
		| 'digitsOnly'
		| 'pasteCount'
		| 'enterCustom'
		| 'finishCustom'
		| 'closeMenu'
		| 'volumeInput'
		| 'mute'
		| 'saveMotion'
	>;
	actions: Pick<
		SurfaceFields,
		| 'controlLabel'
		| 'formatAmount'
		| 'setAmount'
		| 'pressSpin'
		| 'onspeedchange'
		| 'openAuto'
		| 'settings'
		| 'bonus'
		| 'closeAuto'
		| 't'
		| 'selectCount'
		| 'editCustom'
		| 'digitsOnly'
		| 'pasteCount'
		| 'enterCustom'
		| 'finishCustom'
		| 'closeMenu'
		| 'volumeInput'
		| 'mute'
		| 'saveMotion'
	>;
	session: Pick<
		SurfaceFields,
		| 'menuOpen'
		| 'autoOpen'
		| 'stopOnBonus'
		| 'lossEnabled'
		| 'lossAmount'
		| 'lossTouched'
		| 'winEnabled'
		| 'winAmount'
		| 'winTouched'
		| 'autoPanel'
		| 'menu'
		| 'customInput'
	>;
};
