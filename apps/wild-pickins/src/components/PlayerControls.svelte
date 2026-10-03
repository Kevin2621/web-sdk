<script lang="ts">
	import { onMount, tick, untrack } from 'svelte';

	import { bonusWin, resetBonusWin } from '../game/bonusWin.svelte';
	import { playerMotion } from '../game/playerMotion.svelte';
	import { autoplaySettings, autoplayStopReason, type AutoplayRound } from '../game/playerAutoplay';
	import { playerSpeed, cyclePlayerSpeed } from '../game/playerSpeed.svelte';
	import {
		stateBet,
		stateConfig,
		stateSound,
		stateModal,
		stateBetDerived,
		stateUrlDerived,
	} from 'state-shared';
	import { getContext } from '../game/context';
	import { playerLanguage } from '../game/playerLanguage.svelte';
	import translations from '../game/playerTranslations';
	import { playerLabel } from '../game/playerLabels';
	import { PlayerControlsSurface, registerDismissiblePopup } from 'components-ui-html';
	import money from '../game/playerMoney';
	import BonusMenu from './BonusMenu.svelte';
	import InformationCatalog from './InformationCatalog.svelte';
	import { stateMeta } from 'state-shared';
	import config from '../game/config';
	import defaultMath from '../game/selectedPaytable.json';
	let {
		simulated = false,
		simulatedBonusCost,
		simulatedBonusTier,
		onbonustierchange,
		simulatedBonusRtp,
		simulatedBonusMaxX,
		simulatedBonusSpins = 10,
		simulatedBonusTitle = 'Standard Bonus Buy',
		simulatedBonusArmed = false,
		simulatedBuyArmsNextSpin = false,
		busy = false,
		onspin,
		onbuy,
		math = defaultMath,
		multiplierRules = false,
		goldenPicksEnabled = true,
	}: {
		simulated?: boolean;
		simulatedBonusCost?: number;
		simulatedBonusTier?: 'low' | 'medium' | 'high';
		onbonustierchange?: (tier: 'low' | 'medium' | 'high') => void;
		simulatedBonusRtp?: number;
		simulatedBonusMaxX?: number;
		simulatedBonusSpins?: number;
		simulatedBonusTitle?: string;
		simulatedBonusArmed?: boolean;
		simulatedBuyArmsNextSpin?: boolean;
		busy?: boolean;
		onspin?: () => Promise<AutoplayRound | void>;
		onbuy?: () => Promise<AutoplayRound | void>;
		math?: typeof defaultMath;
		multiplierRules?: boolean;
		goldenPicksEnabled?: boolean;
	} = $props();
	const context = getContext();
	const language = $derived(playerLanguage());
	const text = $derived(translations[language]);
	const locked = $derived(
		busy ||
			context.stateLayout.showLoadingScreen ||
			(!simulated && !context.stateXstateDerived.isIdle()),
	);
	const levels = $derived(
		simulated ? [0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10] : stateConfig.betAmountOptions,
	);
	let autoPanel = $state<HTMLDialogElement>(undefined!);
	let autoOpen = $state(false),
		menuOpen = $state(false),
		menuClosing = $state(false);
	function animatePopupClose(panel: HTMLDialogElement) {
		return panel.animate(
			[
				{ opacity: 1, transform: 'translateY(0)' },
				{ opacity: 0, transform: 'translateY(6px)' },
			],
			{ duration: 160, easing: 'ease-in', fill: 'forwards' },
		);
	}
	let menuCloseAnimation: Animation | undefined;
	async function closeMenu() {
		if (menuClosing || !menu?.open) return;
		menuClosing = true;
		if (!motionReduced) {
			menuCloseAnimation = animatePopupClose(menu);
			try {
				await menuCloseAnimation.finished;
			} catch {}
		}
		menu.close();
		menuOpen = false;
		menuCloseAnimation?.cancel();
		menuCloseAnimation = undefined;
		menuClosing = false;
	}
	let autoClosing = $state(false);
	const motionReduced = $derived(playerMotion.uiReduced);
	let closeAnimation: Animation | undefined;
	async function closeAuto(animate = true) {
		if (autoClosing || !autoPanel?.open) return;
		finishCustom(true);
		autoClosing = true;
		if (animate && !motionReduced) {
			closeAnimation = animatePopupClose(autoPanel);
			try {
				await closeAnimation.finished;
			} catch {}
		}
		autoPanel.close();
		autoOpen = false;
		closeAnimation?.cancel();
		closeAnimation = undefined;
		autoClosing = false;
	}
	function saveMotion() {
		try {
			localStorage.setItem('wp-ui-reduced-motion', String(playerMotion.uiReduced));
			localStorage.setItem('wp-screen-shake-disabled', String(playerMotion.shakeDisabled));
		} catch {}
	}
	onMount(() => {
		try {
			const previous = localStorage.getItem('wp-reduced-motion');
			playerMotion.uiReduced =
				(localStorage.getItem('wp-ui-reduced-motion') ?? previous) === 'true';
			playerMotion.shakeDisabled =
				(localStorage.getItem('wp-screen-shake-disabled') ??
					localStorage.getItem('wp-game-reduced-motion') ??
					previous) === 'true';
		} catch {}
		return () => {
			closeAnimation?.cancel();
			menuCloseAnimation?.cancel();
		};
	});
	let rememberedVolume = 50;
	function mute() {
		if (stateSound.volumeValueMaster > 0) {
			rememberedVolume = stateSound.volumeValueMaster;
			stateSound.volumeValueMaster = 0;
		} else stateSound.volumeValueMaster = rememberedVolume;
		save();
	}
	function clampVolume(value: unknown) {
		const n = Number(value);
		return Number.isFinite(n) ? Math.min(100, Math.max(0, n)) : 0;
	}
	function volumeInput(event: Event, channel: 'master' | 'music' | 'effects') {
		const value = clampVolume((event.currentTarget as HTMLInputElement).value);
		if (channel === 'master') stateSound.volumeValueMaster = value;
		else if (channel === 'music') stateSound.volumeValueMusic = value;
		else stateSound.volumeValueSoundEffect = value;
		save();
	}
	let stopQueued = $state(false);
	const autoplayActive = $derived(running || stateBet.autoSpinsCounter > 0 || stopQueued);
	$effect(() => {
		if (stopQueued && !running && !locked) stopQueued = false;
	});
	function stopAutoplay() {
		if (stopQueued) return;
		stopQueued = running || locked;
		remaining = 0;
		stateBet.autoSpinsCounter = 0;
		closeAuto();
	}
	async function pressSpin() {
		if (autoClosing || stopQueued) return;
		if (autoplayActive) {
			stopAutoplay();
			return;
		}
		if (autoOpen) {
			if (!readyToStart || locked || !canAfford) return;
			finishCustom();
			await closeAuto();
			void auto();
		} else void spin();
	}
	const betLocked = $derived(locked || running || stateBet.autoSpinsCounter > 0 || simulatedBonusArmed);
	function setAmount(value: number) {
		if (!betLocked && levels.includes(value) && value !== stateBet.betAmount) {
			stateBet.betAmount = value;
			context.eventEmitter.broadcast({ type: 'soundPressPlayAmount' });
		}
	}
	function openAuto() {
		closeMenu();
		if (autoClosing) return;
		if (autoplayActive) {
			stopAutoplay();
			return;
		}
		if (autoPanel.open) {
			closeAuto();
			return;
		}
		if (locked || !canAfford || simulatedBonusArmed || stateConfig.jurisdiction.disabledAutoplay) return;
		autoPanel.show();
		autoOpen = true;
		autoPanel.focus({ preventScroll: true });
	}
	onMount(() => {
		const removeMenu = registerDismissiblePopup({
			isOpen: () => !!menu?.open,
			contains: (target) => !!menu?.contains(target),
			close: () => { void closeMenu(); },
		});
		const removeAuto = registerDismissiblePopup({
			isOpen: () => !!autoPanel?.open,
			contains: (target) =>
				!!autoPanel?.contains(target) ||
				(target instanceof Element && !!target.closest('.player-controls button.spin:not(:disabled)')),
			close: () => { void closeAuto(); },
		});
		return () => { removeMenu(); removeAuto(); };
	});
	let advanced = $state(false),
		stopOnBonus = $state(true);
	let lossEnabled = $state(false),
		winEnabled = $state(false);
	let lossTouched = $state(false),
		winTouched = $state(false);
	let lossAmount = $state<number | undefined>(undefined),
		winAmount = $state<number | undefined>(undefined);
	let stopReason = $state('');
	const positive = (value: number | undefined) =>
		value !== undefined && Number.isFinite(value) && value > 0;
	const lossError = $derived(lossEnabled && lossTouched && !positive(lossAmount));
	const winError = $derived(winEnabled && winTouched && !positive(winAmount));
	const validLimits = $derived(
		(!lossEnabled || positive(lossAmount)) && (!winEnabled || positive(winAmount)),
	);
	let customCount = $state('');
	let customEditing = $state(false);
	let customInput = $state<HTMLInputElement>();
	let customDraft = $state('');
	async function editCustom() {
		customDraft = customCount;
		customEditing = true;
		await tick();
		customInput?.focus();
		customInput?.select();
	}
	const validCustomCount = (value: number) =>
		Number.isSafeInteger(value) && value > 0 && value <= 9999;
	function finishCustom(cancel = false) {
		if (!customEditing) return;
		const value = Number(customDraft);
		if (!cancel && validCustomCount(value)) {
			customCount = String(value);
			customSelected = true;
			chosen = value;
		}
		if (cancel || validCustomCount(value)) customEditing = false;
	}

	let customSelected = $state(false);
	const validCount = $derived((!customSelected && chosen === Infinity) || validCustomCount(chosen));
	const readyToStart = $derived(
		validLimits && (customEditing ? validCustomCount(Number(customDraft)) : validCount),
	);
	const displayCount = (value: number) => (value === Infinity ? '∞' : String(value));
	function selectCount(value: number) {
		customEditing = false;
		customSelected = false;
		chosen = value;
	}
	function digitsOnly(event: InputEvent) {
		if (event.data && !/^[0-9]+$/.test(event.data)) event.preventDefault();
	}
	function pasteCount(event: ClipboardEvent) {
		if (!/^[0-9]+$/.test(event.clipboardData?.getData('text') ?? '')) event.preventDefault();
	}
	function enterCustom(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		if (!/^[0-9]*$/.test(input.value)) input.value = customDraft;
		if (Number(input.value) > 9999) input.value = '9999';
		customDraft = input.value;
	}
	let menu = $state<HTMLDialogElement>(undefined!);
	let informationOpen = $state(false);
	async function openInformation() {
		if (informationOpen) return;
		await closeMenu();
		informationOpen = true;
	}
	let remaining = $state(0),
		running = $state(false),
		chosen = $state(10);
	const symbolNames: Record<string, string> = {
		C01: 'Corn',
		C02: 'Apples',
		C03: 'Pumpkin',
		C04: 'A',
		C05: 'K',
		C06: 'Q',
		C07: 'J',
		C08: '10',
	};
	const t = (key: string) => playerLabel(language, key, stateUrlDerived.social());
	const canAfford = $derived(simulated || stateBetDerived.isBetCostAvailable());
	let lastWin = $state(0);
	$effect(() => {
		// The settled round total is the authoritative amount for the HUD.
		const roundTotal = stateBet.winBookEventAmount;
		if (roundTotal > 0)
			lastWin = (roundTotal / 100) * untrack(() => stateBet.wageredBetAmount);
	});
	function controlLabel(key: string) {
		if (key === 'Win') return text[0];
		if (key === 'Close') return text[3];
		if (key === 'Menu') return text[1];
		return t(
			(
				{
					Balance: 'BALANCE',
					Play: 'BET',
					Bonus: 'BONUS',
					Spin: 'SPIN',
					Stop: 'STOP',
					Auto: 'AUTO SPIN',
					Speed: 'TURBO',
					Start: 'START',
				} as Record<string, string>
			)[key] || key,
		);
	}
	const bonusMeta = $derived(stateMeta.betModeMeta?.BONUS ?? stateMeta.betModeMeta?.bonus);
	const bonusCost = $derived(
		simulated
			? (simulatedBonusCost ?? config.betModes.bonus.cost)
			: (bonusMeta?.costMultiplier ?? config.betModes.bonus.cost),
	);
	const bonusAvailable = $derived(simulated ? !!onbuy : bonusMeta?.type === 'buy');
	function bonus() {
		if (betLocked || stateConfig.jurisdiction.disabledBuyFeature) return;
		void closeMenu();
		void closeAuto(false);
		stateBet.isSpaceHold = false;
		stateModal.modal = { name: 'buyBonus' };
	}
	async function buyBonus() {
		if (
			betLocked ||
			!bonusAvailable ||
			stateConfig.jurisdiction.disabledBuyFeature ||
			(!simulated && stateBet.balanceAmount < stateBet.betAmount * bonusCost)
		)
			return;
		stateModal.modal = null;
		resetBonusWin();
		if (onbuy) {
			const result = await onbuy();
			if (result) lastWin = result.win;
		} else {
			stateBet.activeBetModeKey = stateMeta.betModeMeta?.BONUS ? 'BONUS' : 'bonus';
			context.eventEmitter.broadcast({ type: 'bet' });
		}
	}
	async function spin() {
		if (locked || !canAfford || stateModal.modal || informationOpen || menu?.open || autoPanel?.open) return;
		resetBonusWin();
		// The reel layer supplies Ultra's start cue and live autoplay cues.
		// Manual Normal/Quick spins and simulated autoplay start here instead.
		if (playerSpeed.mode !== 2 && (simulated || (!running && !stateBet.autoSpinsCounter)))
			context.eventEmitter.broadcast({ type: 'soundPressSpin' });
		if (onspin) return await onspin();
		else {
			stateBet.activeBetModeKey = 'BASE';
			context.eventEmitter.broadcast({ type: 'bet' });
		}
	}
	async function auto() {
		if (
			menu?.open ||
			informationOpen ||
			autoPanel?.open ||
			stateModal.modal ||
			locked ||
			!canAfford ||
			!validCount ||
			!validLimits ||
			running ||
			stateBet.autoSpinsCounter ||
			simulatedBonusArmed ||
			stateConfig.jurisdiction.disabledAutoplay
		)
			return;
		const lossLimit = lossEnabled ? lossAmount! : Infinity,
			winLimit = winEnabled ? winAmount! : Infinity;
		autoplaySettings.stopOnBonus = stopOnBonus;
		stateBet.autoSpinsLossLimitAmount = lossLimit;
		stateBet.autoSpinsSingleWinLimitAmount = winLimit;
		stopReason = '';
		if (!simulated) {
			stateBet.autoSpinsCounter = chosen;
			await spin();
			return;
		}
		running = true;
		remaining = chosen;
		let netLoss = 0;
		try {
			while (remaining > 0) {
				if (document.hidden || locked) break;
				const wager = stateBet.betAmount;
				remaining--;
				const result = await spin();
				if (!result) break;
				netLoss += wager - result.win;
				stopReason = autoplayStopReason(result, netLoss, stopOnBonus, lossLimit, winLimit);
				if (stopReason) break;
			}
		} finally {
			remaining = 0;
			running = false;
		}
	}
	function settings() {
		if (menu.open) {
			closeMenu();
			return;
		}
		void closeAuto(false);
		remaining = 0;
		stateBet.autoSpinsCounter = 0;
		menu.show();
		menuOpen = true;
		menu.focus({ preventScroll: true });
	}
	onMount(() => {
		try {
			const saved = JSON.parse(localStorage.getItem('wp-volume') || 'null');
			if (saved) {
				stateSound.volumeValueMaster = clampVolume(saved.master);
				stateSound.volumeValueMusic = clampVolume(saved.music);
				if (saved.effects !== undefined)
					stateSound.volumeValueSoundEffect = clampVolume(saved.effects);
			}
		} catch {}
		const hide = () => {
			if (document.hidden) {
				remaining = 0;
				stateBet.autoSpinsCounter = 0;
			}
		};
		document.addEventListener('visibilitychange', hide);
		return () => {
			remaining = 0;
			document.removeEventListener('visibilitychange', hide);
		};
	});
	function save() {
		try {
			localStorage.setItem(
				'wp-volume',
				JSON.stringify({
					master: stateSound.volumeValueMaster,
					music: stateSound.volumeValueMusic,
					effects: stateSound.volumeValueSoundEffect,
				}),
			);
		} catch {}
	}
	function controlKey(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			if (autoPanel?.open) void closeAuto();
			if (menu?.open) closeMenu();
		}
		if (event.target instanceof Element && event.target.closest('.player-controls, .info-dialog'))
			event.stopPropagation();
	}
	const multiplierPaytableRules = [
		'All symbols can land on all five reels. Lines pay left to right from reel 1 with at least three matches. Only the highest award on each line pays.',
		"Wilds substitute for paying symbols, never scatters. Wild values are 1×, 2× or 3×. Add the values of Wilds in the winning combination, then multiply that line's paytable award. For example, 2× + 3× gives 5×. Two 1× Wilds give 2×.",
		goldenPicksEnabled
			? 'New Wilds on the same reel share a value for that spin. During free spins, Wilds and their values stick. Golden Picks create multiplier Wilds.'
			: 'New Wilds on the same reel share a value for that spin. During free spins, Wilds and their values stick. Golden Picks are not active in this game mode.',
		'3 / 4 / 5 base scatters award 10 / 15 / 20 free spins with no scatter cash payout. Scatters do not appear during free spins. Wild collisions can award extra spins within the 30-spin lifetime limit.',
		'Each Wild collision awards +1 spin, up to 30 total granted spins including the starting award. Collisions do not increase Wild multipliers. A full Wild board keeps paying on available spins, without a separate prize. The round ends when free spins run out or total winnings reach 5,000×, including all previous awards. The final payout is limited to the remaining amount under that cap.',
	];
	const view = $derived({
		stopQueued: stopQueued,
		stopReason: stopReason,
		motionReduced: motionReduced,
		language: language,
		balance: stateBet.balanceAmount,
		simulated: simulated,
		balanceNote: simulated ? t('Simulated play') : '',
		amount: stateBet.betAmount,
		currency: stateBet.currency,
		levels: levels,
		win: bonusWin.visible ? (bonusWin.amount / 100) * stateBet.wageredBetAmount : lastWin,
		winLabel: bonusWin.visible ? 'Bonus win' : 'Last win',
		showZeroWin: bonusWin.visible,
		locked: locked,
		loading: context.stateLayout.showLoadingScreen,
		modal: stateModal.modal,
		canAfford: canAfford,
		readyToStart: readyToStart,
		autoplayActive: autoplayActive,
		running: running,
		remaining: remaining,
		customEditing: customEditing,
		customDraft: customDraft,
		customCount: customCount,
		chosen: chosen,
		customSelected: customSelected,
		displayCount: displayCount,
		playerSpeed: playerSpeed,
		autoClosing: autoClosing,
		text: text,
		lossError: lossError,
		winError: winError,
		menuClosing: menuClosing,
		stateSound: {
			master: stateSound.volumeValueMaster,
			music: stateSound.volumeValueMusic,
			effects: stateSound.volumeValueSoundEffect,
		},
		playerMotion: playerMotion,
		math: math,
		paytableRules: multiplierRules ? multiplierPaytableRules : [],
		shakeHelp: 'Disables scatter landing screen shakes. Other game animations stay on.',
		symbolNames: symbolNames,
		betLocked: betLocked,
		buyDisabled: stateConfig.jurisdiction.disabledBuyFeature,
		turboDisabled: stateConfig.jurisdiction.disabledTurbo,
		autoplayDisabled: stateConfig.jurisdiction.disabledAutoplay || simulatedBonusArmed,
		speedText: t(playerSpeed.mode === 0 ? 'NORMAL' : playerSpeed.mode === 1 ? 'QUICK' : 'ULTRA'),
		autoCount: stopQueued
			? '…'
			: autoplayActive
				? displayCount(running ? remaining : stateBet.autoSpinsCounter)
				: autoOpen
					? readyToStart
						? displayCount(customEditing ? Number(customDraft) : chosen)
						: '—'
					: '',
	});
	const actions = {
		controlLabel: controlLabel,
		formatAmount: (value: number) => money.formatMoney(value, stateBet.currency, language).text,
		setAmount: setAmount,
		pressSpin: pressSpin,
		onspeedchange: () => {
			cyclePlayerSpeed();
			context.eventEmitter.broadcast({ type: 'soundPressSpeed' });
		},
		openAuto: openAuto,
		settings: settings,
		openInformation: openInformation,
		bonus: bonus,
		closeAuto: closeAuto,
		t: t,
		selectCount: selectCount,
		editCustom: editCustom,
		digitsOnly: digitsOnly,
		pasteCount: pasteCount,
		enterCustom: enterCustom,
		finishCustom: finishCustom,
		closeMenu: closeMenu,
		volumeInput: volumeInput,
		mute: mute,
		saveMotion: saveMotion,
	};
	const session = {
		get menuOpen() {
			return menuOpen;
		},
		set menuOpen(value) {
			menuOpen = value;
		},
		get autoOpen() {
			return autoOpen;
		},
		set autoOpen(value) {
			autoOpen = value;
		},
		get stopOnBonus() {
			return stopOnBonus;
		},
		set stopOnBonus(value) {
			stopOnBonus = value;
		},
		get lossEnabled() {
			return lossEnabled;
		},
		set lossEnabled(value) {
			lossEnabled = value;
		},
		get lossAmount() {
			return lossAmount;
		},
		set lossAmount(value) {
			lossAmount = value;
		},
		get lossTouched() {
			return lossTouched;
		},
		set lossTouched(value) {
			lossTouched = value;
		},
		get winEnabled() {
			return winEnabled;
		},
		set winEnabled(value) {
			winEnabled = value;
		},
		get winAmount() {
			return winAmount;
		},
		set winAmount(value) {
			winAmount = value;
		},
		get winTouched() {
			return winTouched;
		},
		set winTouched(value) {
			winTouched = value;
		},
		get autoPanel() {
			return autoPanel;
		},
		set autoPanel(value) {
			autoPanel = value;
		},
		get menu() {
			return menu;
		},
		set menu(value) {
			menu = value;
		},
		get customInput() {
			return customInput;
		},
		set customInput(value) {
			customInput = value;
		},
	};
</script>

{#if stateModal.modal?.name === 'buyBonus'}
	<BonusMenu
		label={controlLabel}
		{simulated}
		cost={bonusCost}
		tier={simulated ? simulatedBonusTier : undefined}
		ontierchange={onbonustierchange}
		rtp={simulated ? simulatedBonusRtp : undefined}
		maxWinX={simulated ? simulatedBonusMaxX : undefined}
		initialSpins={simulatedBonusSpins}
		purchaseTitle={simulatedBonusTitle}
		armsNextSpin={simulatedBuyArmsNextSpin}
		{levels}
		disabled={betLocked || !bonusAvailable || stateConfig.jurisdiction.disabledBuyFeature}
		onamount={setAmount}
		onclose={() => (stateModal.modal = null)}
		onbuy={buyBonus}
	/>
{/if}
<svelte:document onkeydown={controlKey} onkeyup={controlKey} />
<PlayerControlsSurface {view} {actions} {session} />
<InformationCatalog
	open={informationOpen || stateModal.modal?.name === 'payTable' || stateModal.modal?.name === 'gameRules'}
	onclose={() => {
		informationOpen = false;
		if (stateModal.modal?.name === 'payTable' || stateModal.modal?.name === 'gameRules')
			stateModal.modal = null;
	}}
	bet={stateBet.betAmount}
	{levels}
	{simulated}
	bonusAvailable={bonusAvailable && !stateConfig.jurisdiction.disabledBuyFeature}
	{bonusCost}
	{math}
	{multiplierRules}
	{goldenPicksEnabled}
	autoplayDisabled={stateConfig.jurisdiction.disabledAutoplay}
	turboDisabled={stateConfig.jurisdiction.disabledTurbo}
/>
