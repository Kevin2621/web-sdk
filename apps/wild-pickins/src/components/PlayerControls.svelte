<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { bonusWin, resetBonusWin } from '../game/bonusWin.svelte';
	import { playerMotion } from '../game/playerMotion.svelte';
	import { slide } from 'svelte/transition';
	import { cubicInOut } from 'svelte/easing';
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
	import { SlotControlBar } from 'components-ui-html';
	import money from '../game/playerMoney';
	import defaultMath from '../game/playerPaytable.json';
	let {
		simulated = false,
		busy = false,
		onspin,
		math = defaultMath,
		multiplierRules = false,
	}: {
		simulated?: boolean;
		busy?: boolean;
		onspin?: () => Promise<AutoplayRound | void>;
		math?: typeof defaultMath;
		multiplierRules?: boolean;
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
	let autoPanel: HTMLDialogElement;
	let autoOpen = $state(false),
		menuOpen = $state(false);
	let motionOpen = $state(false),
		menuClosing = $state(false),
		paylinesOpen = $state(false),
		paytableOpen = $state(false);
	let moreMenuBelow = $state(false);
	function watchMenuScroll(node: HTMLDivElement) {
		const update = () => {
			moreMenuBelow = node.scrollHeight - node.clientHeight - Math.max(0, node.scrollTop) > 2;
		};
		const observer = new ResizeObserver(update);
		observer.observe(node);
		if (node.firstElementChild) observer.observe(node.firstElementChild);
		node.addEventListener('scroll', update, { passive: true });
		update();
		return {
			destroy() {
				observer.disconnect();
				node.removeEventListener('scroll', update);
			},
		};
	}
	function animatePopupClose(panel: HTMLDialogElement) {
		return panel.animate(
			[
				{ opacity: 1, transform: 'translateY(0)' },
				{ opacity: 0, transform: 'translateY(6px)' },
			],
			{ duration: 120, easing: 'ease-in', fill: 'forwards' },
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
	const betLocked = $derived(locked || running || stateBet.autoSpinsCounter > 0);
	function setAmount(value: number) {
		if (!betLocked && levels.includes(value)) stateBet.betAmount = value;
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
		if (locked || !canAfford || stateConfig.jurisdiction.disabledAutoplay) return;
		autoPanel.show();
		autoOpen = true;
		autoPanel.focus({ preventScroll: true });
	}
	function dismissMenus(event: PointerEvent) {
		if (
			menu?.open &&
			event.target instanceof Element &&
			!menu.contains(event.target) &&
			!event.target.closest('.menu')
		)
			closeMenu();
		if (
			autoPanel?.open &&
			event.target instanceof Element &&
			!autoPanel.contains(event.target) &&
			!event.target.closest('.auto, .spin')
		)
			closeAuto();
	}
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
	let menu: HTMLDialogElement,
		remaining = $state(0),
		running = $state(false),
		chosen = $state(10);
	const symbolNames: Record<string, string> = {
		C01: 'Wheat',
		C02: 'Corn',
		C03: 'Tomato',
		C04: 'Stone',
		C05: 'Wagon wheel',
		C06: 'Horseshoe',
		C07: 'Pinecone',
		C08: 'Clay pot',
	};
	const t = (key: string) => playerLabel(language, key, stateUrlDerived.social());
	const canAfford = $derived(simulated || stateBetDerived.isBetCostAvailable());
	let lastWin = $state(0);
	context.eventEmitter.subscribeOnMount({
		winUpdate: ({ amount }) => {
			if (amount > 0) lastWin = (amount / 100) * stateBet.wageredBetAmount;
		},
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
	function bonus() {
		if (!betLocked && !simulated && !stateConfig.jurisdiction.disabledBuyFeature)
			stateModal.modal = { name: 'buyBonus' };
	}
	async function spin() {
		if (locked || !canAfford || stateModal.modal || menu?.open || autoPanel?.open) return;
		resetBonusWin();
		context.eventEmitter.broadcast({ type: 'soundPressBet' });
		if (onspin) return await onspin();
		else context.eventEmitter.broadcast({ type: 'bet' });
	}
	async function auto() {
		if (
			menu?.open ||
			autoPanel?.open ||
			stateModal.modal ||
			locked ||
			!canAfford ||
			!validCount ||
			!validLimits ||
			running ||
			stateBet.autoSpinsCounter ||
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
</script>

<svelte:document onkeydown={controlKey} onkeyup={controlKey} onpointerdown={dismissMenus} />
<div class="stop-status" role="status">
	{stopQueued ? 'Autoplay will stop after this round.' : stopReason}
</div>
<div
	class="player-controls"
	class:reduced-motion={motionReduced}
	class:modal-open={!!stateModal.modal}
	dir={language === 'ar' ? 'rtl' : 'ltr'}
>
	<SlotControlBar
		balance={simulated ? undefined : stateBet.balanceAmount}
		balanceNote={simulated ? t('Simulated play') : ''}
		amount={stateBet.betAmount}
		amounts={levels}
		win={bonusWin.visible ? (bonusWin.amount / 100) * stateBet.wageredBetAmount : lastWin}
		persistWin={true}
		winLabel={bonusWin.visible ? 'Bonus win' : 'Last win'}
		showZeroWin={bonusWin.visible}
		spinning={locked}
		disabled={context.stateLayout.showLoadingScreen || !!stateModal.modal}
		{menuOpen}
		reducedMotion={motionReduced}
		autoSetup={autoOpen}
		spinDisabled={!canAfford || (autoOpen && !readyToStart)}
		bonusDisabled={simulated || stateConfig.jurisdiction.disabledBuyFeature}
		speedDisabled={stateConfig.jurisdiction.disabledTurbo}
		showAuto={!stateConfig.jurisdiction.disabledAutoplay}
		auto={autoplayActive}
		{stopQueued}
		autoCount={stopQueued
			? '…'
			: autoplayActive
				? displayCount(running ? remaining : stateBet.autoSpinsCounter)
				: autoOpen
					? readyToStart
						? displayCount(customEditing ? Number(customDraft) : chosen)
						: '—'
					: ''}
		speed={playerSpeed.mode + 1}
		speedText={t(playerSpeed.mode === 0 ? 'NORMAL' : playerSpeed.mode === 1 ? 'QUICK' : 'ULTRA')}
		label={controlLabel}
		formatAmount={(value) => money.formatMoney(value, stateBet.currency, language).text}
		onamountchange={setAmount}
		onspin={pressSpin}
		onspeedchange={cyclePlayerSpeed}
		onautochange={openAuto}
		onmenu={settings}
		onbonus={bonus}
	/>
	<dialog
		class="info-dialog auto-dialog"
		bind:this={autoPanel}
		inert={autoClosing}
		tabindex="-1"
		onclose={() => (autoOpen = autoPanel.open)}
		aria-label={t('AUTO SPIN')}
		dir={language === 'ar' ? 'rtl' : 'ltr'}
	>
		<header class="info-header">
			<h2>{t('AUTO SPIN')}</h2>
			<button class="info-close" onclick={() => closeAuto()} aria-label={text[3]}>
				<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6 18 18M18 6 6 18" /></svg>
			</button>
		</header>
		<div class="info-content">
			<p class="rounds-label">Number of rounds</p>
			<div class="autoplay-counts" role="group" aria-label={t('AUTO SPIN')}>
				{#each [10, 25, 50, 75, 100, 500, Infinity] as n}
					<button
						class="count-btn"
						aria-pressed={!customSelected && chosen === n}
						onclick={() => selectCount(n)}
						aria-label={n === Infinity ? 'Unlimited spins' : String(n)}>{displayCount(n)}</button
					>
				{/each}
				{#if customEditing}
					<input
						bind:this={customInput}
						class="custom-count"
						type="text"
						inputmode="numeric"
						pattern="[0-9]*"
						maxlength="4"
						placeholder="1–9999"
						onbeforeinput={digitsOnly}
						onpaste={pasteCount}
						aria-label="Custom number of rounds, 1 to 9999"
						value={customDraft}
						oninput={enterCustom}
						onblur={() => finishCustom()}
						onkeydown={(event) => {
							if (event.key === 'Enter' || event.key === 'Escape') {
								event.preventDefault();
								event.stopPropagation();
								finishCustom(event.key === 'Escape');
								tick().then(() =>
									autoPanel.querySelector<HTMLButtonElement>('.custom-choice')?.focus(),
								);
							}
						}}
					/>
				{:else}
					<button class="count-btn custom-choice" aria-pressed={customSelected} onclick={editCustom}
						>{customSelected ? customCount : 'Custom'}</button
					>
				{/if}
			</div>
			<button
				class="advanced-toggle"
				aria-expanded={advanced}
				aria-controls="autoplay-limits"
				onclick={() => (advanced = !advanced)}
				><span>Stop conditions</span><svg viewBox="0 0 16 16" aria-hidden="true"
					><path d="m6 3 5 5-5 5" /></svg
				></button
			>
			{#if advanced}
				<div transition:slide={{ duration: motionReduced ? 0 : 260, easing: cubicInOut }}>
					<div id="autoplay-limits" class="autoplay-limits">
						<label class="limit-row"
							><span>Stop on bonus</span><input
								type="checkbox"
								role="switch"
								bind:checked={stopOnBonus}
							/></label
						>
						<div class="limit-setting">
							<label class="limit-row"
								><span>Session loss limit</span><input
									type="checkbox"
									role="switch"
									bind:checked={lossEnabled}
									onchange={() => (lossTouched = false)}
								/></label
							>
							<label class="limit-amount" class:invalid={lossError} class:inactive={!lossEnabled}
								><span>{stateBet.currency}</span><input
									aria-label="Session loss limit amount"
									type="number"
									min="0"
									step="any"
									disabled={!lossEnabled}
									placeholder={lossEnabled ? 'Enter amount' : 'No limit'}
									value={lossEnabled ? lossAmount : undefined}
									oninput={(event) =>
										(lossAmount = Number.isFinite(event.currentTarget.valueAsNumber)
											? event.currentTarget.valueAsNumber
											: undefined)}
									onblur={() => (lossTouched = true)}
									aria-invalid={lossError}
									aria-describedby="loss-limit-help"
								/></label
							>
							<p
								class="limit-help"
								class:limit-error={lossError}
								id="loss-limit-help"
								aria-live="polite"
							>
								{lossError
									? 'Enter an amount greater than zero.'
									: 'Net loss since autoplay started.'}
							</p>
						</div>
						<div class="limit-setting">
							<label class="limit-row"
								><span>Single-win limit</span><input
									type="checkbox"
									role="switch"
									bind:checked={winEnabled}
									onchange={() => (winTouched = false)}
								/></label
							>
							<label class="limit-amount" class:invalid={winError} class:inactive={!winEnabled}
								><span>{stateBet.currency}</span><input
									aria-label="Single-win limit amount"
									type="number"
									min="0"
									step="any"
									disabled={!winEnabled}
									placeholder={winEnabled ? 'Enter amount' : 'No limit'}
									value={winEnabled ? winAmount : undefined}
									oninput={(event) =>
										(winAmount = Number.isFinite(event.currentTarget.valueAsNumber)
											? event.currentTarget.valueAsNumber
											: undefined)}
									onblur={() => (winTouched = true)}
									aria-invalid={winError}
									aria-describedby="win-limit-help"
								/></label
							>
							<p
								class="limit-help"
								class:limit-error={winError}
								id="win-limit-help"
								aria-live="polite"
							>
								{winError
									? 'Enter an amount greater than zero.'
									: 'Total win from one round, including its bonus.'}
							</p>
						</div>
					</div>
					<p class="limits-note">
						Stops after the current round and any awarded bonus finish. Losses can exceed the limit
						within that round.
					</p>
				</div>
			{/if}
		</div>
	</dialog>
	<dialog
		class="info-dialog auto-dialog settings-dialog"
		bind:this={menu}
		inert={menuClosing}
		tabindex="-1"
		onclose={() => (menuOpen = menu.open)}
		dir={language === 'ar' ? 'rtl' : 'ltr'}
		aria-labelledby="info-title"
	>
		<header class="info-header">
			<h2 id="info-title">{text[1]}</h2>
			<button class="info-close" onclick={closeMenu} aria-label={text[3]}>×</button>
		</header>
		<div class="info-content" use:watchMenuScroll>
			<div class="settings-body">
				<section class="settings-group">
					<h3>{t('SOUND')}</h3>
					{#each [['master', t('MASTER VOLUME')], ['music', t('MUSIC VOLUME')], ['effects', 'Sound effects']] as [channel, label]}
						<label class="volume-label"
							><span>{label}</span><input
								type="range"
								min="0"
								max="100"
								step="1"
								value={channel === 'master'
									? stateSound.volumeValueMaster
									: channel === 'music'
										? stateSound.volumeValueMusic
										: stateSound.volumeValueSoundEffect}
								oninput={(event) => volumeInput(event, channel as 'master' | 'music' | 'effects')}
							/></label
						>
					{/each}
					<button class="mute-btn" onclick={mute} aria-pressed={stateSound.volumeValueMaster === 0}
						>{stateSound.volumeValueMaster === 0 ? 'Unmute' : 'Mute'}</button
					>
				</section>
				<section class="settings-details">
					<button
						class="settings-disclosure"
						aria-expanded={motionOpen}
						aria-controls="menu-motion"
						onclick={() => (motionOpen = !motionOpen)}
						><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12h3l3-7 6 14 3-7h3" /></svg
						><span>Motion</span></button
					>
					{#if motionOpen}<div
							id="menu-motion"
							inert={!motionOpen}
							transition:slide={{ duration: motionReduced ? 0 : 260, easing: cubicInOut }}
						>
							<label class="limit-row"
								><span>Reduced UI motion</span><input
									type="checkbox"
									role="switch"
									bind:checked={playerMotion.uiReduced}
									onchange={saveMotion}
								/></label
							>
							<p class="limits-note">Reduces menu, button, and panel animations.</p>
							<label class="limit-row"
								><span>Turn off screen shake</span><input
									type="checkbox"
									role="switch"
									bind:checked={playerMotion.shakeDisabled}
									onchange={saveMotion}
								/></label
							>
							<p class="limits-note">
								Disables scatter landing screen shakes. Other game animations stay on.
							</p>
						</div>{/if}
				</section>
				<section class="settings-details">
					<button
						class="settings-disclosure"
						aria-expanded={paylinesOpen}
						aria-controls="menu-paylines"
						onclick={() => (paylinesOpen = !paylinesOpen)}
						><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 17 9 7l6 10 6-10" /></svg><span
							>{t('PAYLINES')}</span
						></button
					>{#if paylinesOpen}<div
							id="menu-paylines"
							inert={!paylinesOpen}
							transition:slide={{ duration: motionReduced ? 0 : 260, easing: cubicInOut }}
						>
							<div class="lines">
								{#each math.paths.map((rows, index) => [String(index + 1), rows] as const) as [id, rows]}<div
									>
										<small>{id}</small><svg
											viewBox="0 0 100 60"
											aria-label={`${t('PAYLINE')} ${id}`}
											><path
												d={rows
													.map((row, i) => `${i ? 'L' : 'M'}${10 + i * 20},${10 + row * 20}`)
													.join(' ')}
											/></svg
										>
									</div>{/each}
							</div>
						</div>{/if}
				</section>
				<section class="settings-details">
					<button
						class="settings-disclosure"
						aria-expanded={paytableOpen}
						aria-controls="menu-paytable"
						onclick={() => (paytableOpen = !paytableOpen)}
						><svg viewBox="0 0 24 24" aria-hidden="true"
							><path d="M5 3h14v18H5zM9 8h6M9 12h6M9 16h6" /></svg
						><span>{t('PAYTABLE')}</span></button
					>{#if paytableOpen}<div
							id="menu-paytable"
							inert={!paytableOpen}
							transition:slide={{ duration: motionReduced ? 0 : 260, easing: cubicInOut }}
						>
							{#if multiplierRules}
								<p>All symbols can land on all five reels. Lines pay left to right from reel 1 with at least three matches. Only the highest award on each line pays.</p>
								<p>Wilds substitute for paying symbols, never scatters. Wild values are 1×, 2× or 3×. Add the values of Wilds in the winning combination, then multiply that line's paytable award. For example, 2× + 3× gives 5×. Two 1× Wilds give 2×.</p>
								<p>New Wilds on the same reel share a value for that spin. During free spins, Wilds and their values stick. Golden Picks create multiplier Wilds.</p>
								<p>3 / 4 / 5 base scatters award 10 / 15 / 20 free spins with no scatter cash payout. Scatters do not appear during free spins. Wild collisions can award extra spins within the 30-spin lifetime limit.</p>
								<p>Each Wild collision awards +1 spin, up to 30 total granted spins including the starting award. Collisions do not increase Wild multipliers. A full Wild board keeps paying on available spins, without a separate prize. The round ends when free spins run out or total winnings reach 5,000×, including all previous awards. The final payout is limited to the remaining amount under that cap.</p>
							{/if}
							{#each [['BASE', math.paytable], ['BONUS', math.bonusPaytable]] as [name, table]}<h4>
									{t(String(name))} · ×
								</h4>
								<table>
									<thead><tr><th></th><th>3</th><th>4</th><th>5</th></tr></thead><tbody
										>{#each Object.entries(table) as [symbol, pays]}<tr
												><th>{symbolNames[symbol] || symbol}</th
												>{#each Object.values(pays) as pay}<td>{Number(pay) / 100}×</td>{/each}</tr
											>{/each}</tbody
									>
								</table>{/each}
						</div>{/if}
				</section>
			</div>
		</div>
		{#if moreMenuBelow}<div class="scroll-cue" aria-hidden="true">
				<svg viewBox="0 0 24 24"><path d="m7 9 5 5 5-5" /></svg>
			</div>{/if}
	</dialog>
</div>

<style>
	.player-controls,
	.info-dialog {
		--font-sans:
			-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Segoe UI', Roboto,
			Helvetica, Arial, sans-serif;
		--ease-out-quint: cubic-bezier(0.23, 1, 0.32, 1);
	}

	.player-controls {
		position: fixed;
		left: 50%;
		bottom: max(2.5vh, env(safe-area-inset-bottom));
		transform: translateX(-50%);
		width: 64vw;
		z-index: 10000;
		font-family: var(--font-sans);
		color: #f5f5f5;
		transition:
			opacity 0.25s var(--ease-out-quint),
			transform 0.25s var(--ease-out-quint);
	}

	.player-controls.modal-open {
		visibility: hidden;
		opacity: 0;
		pointer-events: none;
		transform: translate(-50%, 12px);
	}

	/* DIALOG & POPUP STYLING */
	.info-dialog {
		max-width: calc(100vw - 32px);
		padding: 0;
		box-sizing: border-box;
		color: #f5f5f5;
		border: 1px solid rgba(255, 255, 255, 0.12);
		font-family: var(--font-sans);
		overflow: hidden;
	}

	.info-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
		border-bottom: 1px solid rgba(255, 255, 255, 0.08);
		z-index: 2;
	}

	.info-header h2 {
		font-size: 14px;
		font-weight: 700;
		letter-spacing: 0.04em;
		margin: 0;
	}

	.info-close {
		border: 0;
		padding: 0;
		flex-shrink: 0;
		background: rgba(255, 255, 255, 0.06);
		color: rgba(255, 255, 255, 0.7);
		font-size: 20px;
		width: 32px;
		height: 32px;
		border-radius: 50%;
		display: grid;
		place-items: center;
		cursor: pointer;
	}
	.info-close svg {
		display: block;
		width: 18px;
		height: 18px;
		fill: none;
		stroke: currentColor;
		stroke-width: 2;
		stroke-linecap: round;
	}

	.info-close:hover {
		background: rgba(255, 255, 255, 0.15);
		color: #fff;
	}

	.info-content h3 {
		font-size: 13px;
		font-weight: 700;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: rgba(255, 255, 255, 0.5);
		margin: 24px 0 12px;
	}

	.info-content h3:first-child {
		margin-top: 0;
	}

	.volume-label {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
		margin: 14px 0;
		font-size: 14px;
		font-weight: 500;
	}

	input[type='range'] {
		accent-color: #ffffff;
		max-width: 50%;
		height: 4px;
	}

	.mute-btn {
		font-family: var(--font-sans);
		font-weight: 600;
		border-radius: 12px;
		padding: 12px;
		border: 1px solid rgba(255, 255, 255, 0.15);
		background: rgba(255, 255, 255, 0.08);
		color: #fff;
		cursor: pointer;
	}

	.mute-btn:hover {
		background: rgba(255, 255, 255, 0.16);
		border-color: rgba(255, 255, 255, 0.3);
	}

	.auto-dialog {
		--auto-header-height: 49px;
		/* Autoplay fits its content while leaving room for the controls. */
		--auto-max-height: calc(
			100dvh - 180px - env(safe-area-inset-top) - env(safe-area-inset-bottom)
		);
		position: absolute;
		inset: auto 0 calc(100% + 16px) auto;
		margin: 0;
		width: min(100%, max(280px, 38%));
		max-height: var(--auto-max-height);
		overflow: hidden;
		border-radius: 12px;
		background: #16181dcc;
		backdrop-filter: blur(16px);
		-webkit-backdrop-filter: blur(16px);
		box-shadow: 0 4px 16px #0003;
	}
	.auto-dialog[open] {
		animation: autoplay-enter 120ms ease-out;
	}
	.reduced-motion .auto-dialog[open] {
		animation: none;
	}
	.auto-dialog:focus {
		outline: none;
	}
	@keyframes autoplay-enter {
		from {
			opacity: 0;
			transform: translateY(6px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	/* Only the content bounces; the glass header stays attached to the clipped shell. */
	.auto-dialog .info-content {
		box-sizing: border-box;
		max-height: calc(var(--auto-max-height) - 2px);
		overflow-y: auto;
		overscroll-behavior-y: contain;
		scrollbar-width: thin;
		scrollbar-gutter: stable;
		scrollbar-color: #ffffff40 transparent;
		scroll-padding-top: calc(var(--auto-header-height) + 12px);
		padding: calc(var(--auto-header-height) + 12px) 20px 16px;
	}
	.auto-dialog .info-header {
		position: absolute;
		inset: 0 0 auto;
		box-sizing: border-box;
		height: var(--auto-header-height);
		padding: 8px 20px;
		background: #16181db3;
		backdrop-filter: blur(20px);
		-webkit-backdrop-filter: blur(20px);
	}
	.settings-dialog {
		--auto-max-height: min(
			560px,
			calc(100dvh - 180px - env(safe-area-inset-top) - env(safe-area-inset-bottom))
		);
		height: var(--auto-max-height);
		inset: auto auto calc(100% + 16px) 0;
		width: min(100%, 340px);
	}
	.settings-dialog .info-content {
		height: 100%;
	}
	.settings-dialog .settings-group {
		padding-bottom: 16px;
		margin-bottom: 6px;
		border-bottom: 1px solid #ffffff14;
	}
	.settings-dialog .settings-group h3 {
		margin: 10px 0 4px;
		font-size: 11px;
		color: #a7aab0;
	}
	.settings-dialog .limit-row {
		font-weight: 500;
	}
	.settings-dialog .limits-note {
		margin: 0 0 8px;
		font-size: 11px;
	}
	.settings-dialog .volume-label {
		font-size: 13px;
		margin: 16px 0;
	}
	.settings-dialog input[type='range'] {
		width: 44%;
	}
	.settings-dialog .mute-btn {
		width: 100%;
		padding: 8px;
		border-radius: 6px;
		font-size: 12px;
	}
	.settings-body {
		display: flow-root;
	}
	.scroll-cue {
		position: absolute;
		inset: auto 0 0;
		height: 38px;
		display: flex;
		align-items: flex-end;
		justify-content: center;
		padding-bottom: 6px;
		box-sizing: border-box;
		pointer-events: none;
		background: linear-gradient(transparent, #16181de6);
	}
	.scroll-cue svg {
		width: 20px;
		height: 20px;
		fill: none;
		stroke: #f5f5f5;
		stroke-width: 1.8;
		stroke-linecap: round;
		stroke-linejoin: round;
	}
	.settings-details {
		border-bottom: 1px solid #ffffff14;
	}
	.settings-details:last-child {
		border-bottom: 0;
	}
	.settings-disclosure {
		width: 100%;
		border: 0;
		background: none;
		color: inherit;
		font-family: inherit;
		text-align: start;
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 16px 0;
		cursor: pointer;
		font-size: 13px;
		font-weight: 600;
	}

	.settings-disclosure::after {
		content: '';
		width: 6px;
		height: 6px;
		margin-inline-start: auto;
		margin-inline-end: 3px;
		border-top: 1.5px solid #a7aab0;
		border-right: 1.5px solid #a7aab0;
		transform: rotate(45deg);
		transition: transform 260ms cubic-bezier(0.65, 0, 0.35, 1);
	}
	.reduced-motion .settings-disclosure::after {
		transition: none;
	}
	.settings-disclosure[aria-expanded='true']::after {
		transform: rotate(135deg);
	}
	.settings-disclosure svg {
		width: 20px;
		height: 20px;
		fill: none;
		stroke: #c4c7cc;
		stroke-width: 1.5;
		stroke-linecap: round;
		stroke-linejoin: round;
	}
	.settings-disclosure:hover {
		color: #fff;
	}
	.settings-details .lines {
		padding-bottom: 14px;
	}
	.settings-disclosure:focus-visible {
		outline: 2px solid white;
		outline-offset: 2px;
		border-radius: 4px;
	}
	.advanced-toggle {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		margin-top: 18px;
		padding: 12px 0;
		border: 0;
		border-top: 1px solid #ffffff14;
		color: #f5f5f5;
		background: none;
		font: inherit;
		font-size: 13px;
		font-weight: 600;
		letter-spacing: -0.01em;
		text-align: start;
		cursor: pointer;
	}
	.advanced-toggle svg {
		width: 14px;
		height: 14px;
		flex: none;
		fill: none;
		stroke: #a7aab0;
		stroke-width: 1.8;
		stroke-linecap: round;
		stroke-linejoin: round;
		transition: transform 260ms cubic-bezier(0.65, 0, 0.35, 1);
	}
	.reduced-motion .advanced-toggle svg {
		transition: none;
	}
	.advanced-toggle[aria-expanded='true'] svg {
		transform: rotate(90deg);
	}
	.advanced-toggle:hover svg {
		stroke: #fff;
	}
	.autoplay-limits {
		padding: 0 12px;
		border: 1px solid #ffffff10;
		border-radius: 10px;
		background: #ffffff06;
	}
	.limit-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 12px;
		font-size: 13px;
		padding: 12px 0;
	}
	.limit-row input {
		appearance: none;
		width: 30px;
		height: 18px;
		margin: 0;
		border-radius: 10px;
		background: #55585e;
		cursor: pointer;
		flex: none;
		transition: background-color 180ms ease-in-out;
	}
	.limit-row input::before {
		content: '';
		display: block;
		width: 12px;
		height: 12px;
		margin: 3px;
		border-radius: 50%;
		background: #fff;
		transform: translateX(0);
		transition:
			transform 180ms cubic-bezier(0.4, 0, 0.2, 1),
			background-color 180ms ease-in-out;
	}
	.limit-row input:checked {
		background: #eee;
	}
	.limit-row input:checked::before {
		transform: translateX(12px);
		background: #282c32;
	}
	.limit-row input:checked:dir(rtl)::before {
		transform: translateX(-12px);
	}
	.reduced-motion .limit-row input,
	.reduced-motion .limit-row input::before {
		transition: none;
	}
	.limit-setting {
		padding-bottom: 10px;
		border-top: 1px solid #ffffff12;
	}
	.limit-amount {
		display: flex;
		align-items: center;
		gap: 8px;
		background: #00000020;
		border: 1px solid #ffffff16;
		border-radius: 6px;
		padding: 8px 10px;
		font-size: 12px;
	}
	.limit-amount input {
		min-width: 0;
		width: 100%;
		border: 0;
		background: none;
		color: #fff;
		font: inherit;
	}
	.limit-setting p,
	.limits-note {
		margin: 6px 0;
		color: #bfc1c5;
		font-size: 11px;
		line-height: 1.4;
	}
	.limit-amount.inactive {
		opacity: 0.45;
	}
	.limit-amount input:disabled {
		cursor: default;
	}
	.limit-setting .limit-help {
		min-height: 2.8em;
	}
	.limit-amount.invalid {
		border-color: #cf8585;
	}
	.limit-setting .limit-error {
		color: #f0abab;
	}
	.limits-note {
		margin: 10px 12px 0;
		color: #a7aab0;
	}
	.rounds-label {
		margin: 0 0 8px;
		color: #c4c7cc;
		font-size: 12px;
		letter-spacing: 0.05em;
		text-transform: uppercase;
	}
	.auto-dialog button:disabled {
		opacity: 0.4;
		cursor: default;
	}
	.auto-dialog :is(button, input):focus-visible {
		outline: 2px solid white;
		outline-offset: 3px;
	}

	.autoplay-counts {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 6px;
		margin-bottom: 10px;
	}

	.count-btn,
	.custom-count {
		font-family: var(--font-sans);
		height: 32px;
		border-radius: 8px;
		border: 1px solid rgba(255, 255, 255, 0.08);
		background: rgba(255, 255, 255, 0.05);
		color: #fff;
		font-weight: 600;
		font-size: 13px;
		cursor: pointer;
	}

	.count-btn:hover {
		background: rgba(255, 255, 255, 0.12);
		border-color: rgba(255, 255, 255, 0.2);
	}

	.count-btn[aria-pressed='true'] {
		background: #ffffff;
		color: #0d0e11;
		font-weight: 700;
		border-color: #ffffff;
	}

	.info-dialog button {
		transition:
			background-color 80ms ease,
			color 80ms ease,
			scale 50ms ease-out;
	}
	.count-btn,
	.info-close {
		--press-scale: 0.95;
	}
	.info-dialog button:active:not(:disabled) {
		scale: var(--press-scale, 0.98);
	}
	.reduced-motion .info-dialog button {
		transition: none;
	}
	.reduced-motion .info-dialog button:active {
		scale: 1;
	}

	.custom-choice {
		display: grid;
		place-items: center;
		min-width: 0;
		padding: 0;
		text-align: center;
	}

	.custom-count {
		box-sizing: border-box;
		width: 100%;
		min-width: 0;
		text-align: center;
	}

	.info-content table {
		width: 100%;
		border-collapse: collapse;
		font-size: 13px;
		font-variant-numeric: tabular-nums;
	}

	.info-content th,
	.info-content td {
		padding: 10px 8px;
		border-bottom: 1px solid rgba(255, 255, 255, 0.08);
		text-align: end;
	}

	.info-content th:first-child {
		text-align: start;
		color: rgba(255, 255, 255, 0.6);
	}

	.lines {
		display: grid;
		grid-template-columns: repeat(5, 1fr);
		gap: 8px;
	}

	.lines div {
		background: rgba(255, 255, 255, 0.04);
		border: 1px solid rgba(255, 255, 255, 0.06);
		padding: 6px;
		border-radius: 8px;
	}

	.lines svg {
		width: 100%;
		fill: none;
		stroke: rgba(255, 255, 255, 0.8);
		stroke-width: 2.5;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	.stop-status {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip-path: inset(50%);
	}

	@media (max-width: 700px) {
		.player-controls {
			width: calc(100% - 16px);
			bottom: max(10px, env(safe-area-inset-bottom));
		}
	}

	@media (max-height: 540px) and (min-width: 701px) {
		.player-controls {
			bottom: 10px;
			width: 72vw;
		}
	}
</style>
