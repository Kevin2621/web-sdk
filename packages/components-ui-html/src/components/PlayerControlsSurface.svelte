<script lang="ts">
 import { tick } from 'svelte';
 import { slide } from 'svelte/transition';
 import { cubicInOut } from 'svelte/easing';
 import SlotControlBar from './SlotControlBar.svelte';
 import { draggablePanel } from './draggablePanel';
 import type { PlayerControlsSurfaceProps } from './PlayerControlsSurface.types';
 let { view, actions, session }: PlayerControlsSurfaceProps = $props();
 const stopQueued = $derived(view.stopQueued);
 const stopReason = $derived(view.stopReason);
 const motionReduced = $derived(view.motionReduced);
 const language = $derived(view.language);
 const balance = $derived(view.balance);
 const simulated = $derived(view.simulated);
 const balanceNote = $derived(view.balanceNote);
 const amount = $derived(view.amount);
 const currency = $derived(view.currency);
 const levels = $derived(view.levels);
 const win = $derived(view.win);
 const winLabel = $derived(view.winLabel);
 const showZeroWin = $derived(view.showZeroWin);
 const locked = $derived(view.locked);
 const loading = $derived(view.loading);
 const modal = $derived(view.modal);
 const canAfford = $derived(view.canAfford);
 const readyToStart = $derived(view.readyToStart);
 const autoplayActive = $derived(view.autoplayActive);
 const running = $derived(view.running);
 const remaining = $derived(view.remaining);
 const customEditing = $derived(view.customEditing);
 const customDraft = $derived(view.customDraft);
 const customCount = $derived(view.customCount);
 const chosen = $derived(view.chosen);
 const customSelected = $derived(view.customSelected);
 const displayCount = $derived(view.displayCount);
 const playerSpeed = $derived(view.playerSpeed);
 const autoClosing = $derived(view.autoClosing);
 const text = $derived(view.text);
 const lossError = $derived(view.lossError);
 const winError = $derived(view.winError);
 const menuClosing = $derived(view.menuClosing);
 const stateSound = $derived(view.stateSound);
 const playerMotion = $derived(view.playerMotion);
 const math = $derived(view.math);
 const paytableRules = $derived(view.paytableRules);
 const shakeHelp = $derived(view.shakeHelp);
 const symbolNames = $derived(view.symbolNames);
 const betLocked = $derived(view.betLocked);
 const buyDisabled = $derived(view.buyDisabled);
 const turboDisabled = $derived(view.turboDisabled);
 const autoplayDisabled = $derived(view.autoplayDisabled);
 const speedText = $derived(view.speedText);
 const autoCount = $derived(view.autoCount);
 const { controlLabel, formatAmount, setAmount, pressSpin, onspeedchange, openAuto, settings, openInformation, bonus, closeAuto, t, selectCount, editCustom, digitsOnly, pasteCount, enterCustom, finishCustom, closeMenu, volumeInput, mute, saveMotion } = actions;
 let advanced = $state(false), motionOpen = $state(false),
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
</script>

<div class="stop-status" role="status">
	{stopQueued ? 'Autoplay will stop after this round.' : stopReason}
</div>
<div
	class="player-controls"
	class:reduced-motion={motionReduced}
	class:modal-open={!!modal}
	dir={language === 'ar' ? 'rtl' : 'ltr'}
>
	<SlotControlBar
		balance={simulated ? undefined : balance}
		balanceNote={balanceNote}
		amount={amount}
		amounts={levels}
		win={win}
		persistWin={true}
		winLabel={winLabel}
		{showZeroWin}
		spinning={locked}
		amountDisabled={betLocked}
		disabled={loading || !!modal}
		menuOpen={session.menuOpen}
		reducedMotion={motionReduced}
		autoSetup={session.autoOpen}
		spinDisabled={!canAfford || (session.autoOpen && !readyToStart)}
		bonusDisabled={betLocked || buyDisabled}
		speedDisabled={turboDisabled}
		showAuto={!autoplayDisabled}
		auto={autoplayActive}
		{stopQueued}
		autoCount={autoCount}
		speed={playerSpeed.mode + 1}
		speedText={speedText}
		label={controlLabel}
		formatAmount={(value) => formatAmount(value)}
		onamountchange={setAmount}
		onspin={pressSpin}
		onspeedchange={onspeedchange}
		onautochange={openAuto}
		onmenu={settings}
		onbonus={bonus}
	/>
	<dialog
		class="info-dialog auto-dialog"
		use:draggablePanel={{ header: '.info-header', key: 'autoplay' }}
		bind:this={session.autoPanel}
		inert={autoClosing}
		tabindex="-1"
		onclose={() => { session.autoOpen = session.autoPanel.open; }}
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
						bind:this={session.customInput}
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
									session.autoPanel.querySelector<HTMLButtonElement>('.custom-choice')?.focus(),
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
			<section class="autoplay-details">
				<button
					class="settings-disclosure"
					aria-expanded={advanced}
					aria-controls="autoplay-limits"
					onclick={() => (advanced = !advanced)}
					><span>Stop conditions</span></button
				>
				{#if advanced}
					<div transition:slide={{ duration: motionReduced ? 0 : 160, easing: cubicInOut }}>
						<div id="autoplay-limits">
							<label class="limit-row"
								><span>Stop on bonus</span><input
									type="checkbox"
									role="switch"
									bind:checked={session.stopOnBonus}
								/></label
							>
							<div class="limit-setting">
								<label class="limit-row"
									><span>Session loss limit</span><input
										type="checkbox"
										role="switch"
										bind:checked={session.lossEnabled}
										onchange={() => (session.lossTouched = false)}
									/></label
								>
								<label class="limit-amount" class:invalid={lossError} class:inactive={!session.lossEnabled}
									><span>{currency}</span><input
										aria-label="Session loss limit amount"
										type="number"
										min="0"
										step="any"
										disabled={!session.lossEnabled}
										placeholder={session.lossEnabled ? 'Enter amount' : 'No limit'}
										value={session.lossEnabled ? session.lossAmount : undefined}
										oninput={(event) =>
											(session.lossAmount = Number.isFinite(event.currentTarget.valueAsNumber)
												? event.currentTarget.valueAsNumber
												: undefined)}
										onblur={() => (session.lossTouched = true)}
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
										bind:checked={session.winEnabled}
										onchange={() => (session.winTouched = false)}
									/></label
								>
								<label class="limit-amount" class:invalid={winError} class:inactive={!session.winEnabled}
									><span>{currency}</span><input
										aria-label="Single-win limit amount"
										type="number"
										min="0"
										step="any"
										disabled={!session.winEnabled}
										placeholder={session.winEnabled ? 'Enter amount' : 'No limit'}
										value={session.winEnabled ? session.winAmount : undefined}
										oninput={(event) =>
											(session.winAmount = Number.isFinite(event.currentTarget.valueAsNumber)
												? event.currentTarget.valueAsNumber
												: undefined)}
										onblur={() => (session.winTouched = true)}
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
			</section>
		</div>
	</dialog>
	<dialog
		class="info-dialog auto-dialog settings-dialog"
		use:draggablePanel={{ header: '.info-header', key: 'settings' }}
		bind:this={session.menu}
		inert={menuClosing}
		tabindex="-1"
		onclose={() => { session.menuOpen = session.menu.open; }}
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
									? stateSound.master
									: channel === 'music'
										? stateSound.music
										: stateSound.effects}
								oninput={(event) => volumeInput(event, channel as 'master' | 'music' | 'effects')}
							/></label
						>
					{/each}
					<button class="mute-btn" onclick={mute} aria-pressed={stateSound.master === 0}
						>{stateSound.master === 0 ? 'Unmute' : 'Mute'}</button
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
							transition:slide={{ duration: motionReduced ? 0 : 160, easing: cubicInOut }}
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
								{shakeHelp}
							</p>
						</div>{/if}
				</section>

				<section class="settings-details">
					<button class="settings-disclosure" onclick={openInformation}>
						<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7h.01" /></svg>
						<span>Information</span>
					</button>
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
		--ui-hover: var(--control-hover, #414b54);
		--ui-selected: var(--control-selected, #9ba5ae);
		--ui-edge: var(--control-edge, #87949e);
		--ui-focus: #bddcff;
		--ui-switch-on: #89afd0;
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
		cursor: grab;
		touch-action: none;
		user-select: none;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
		border-bottom: 1px solid rgba(255, 255, 255, 0.08);
		z-index: 2;
	}
	.info-header:active { cursor: grabbing; }
	.info-header button { cursor: pointer; }

	.info-header h2 {
		color: var(--control-heading, #e1e5e7);
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

	.info-close:hover:not(:disabled) {
		background: var(--ui-hover);
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

	.mute-btn:hover:not(:disabled) {
		background: var(--ui-hover);
		border-color: var(--ui-edge);
	}
	.mute-btn[aria-pressed='true'] {
		background: var(--ui-selected);
		color: #23282d;
		border-color: var(--ui-edge);
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
		animation: autoplay-enter 160ms ease-out;
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
		width: calc(100% + 16px);
		margin-inline: -8px;
		border: 0;
		border-radius: 8px;
		background: none;
		color: inherit;
		font-family: inherit;
		text-align: start;
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 14px 8px;
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
		transition: transform 160ms cubic-bezier(0.65, 0, 0.35, 1);
	}
	.reduced-motion .settings-disclosure::after {
		transition: none;
	}
	.settings-disclosure[aria-expanded='true']::after {
		transform: rotate(135deg);
	}
	.settings-disclosure[aria-expanded='true'] {
		color: var(--control-heading, #e1e5e7);
		background: #ffffff12;
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
	.settings-disclosure:hover:not(:disabled) {
		color: #fff;
		background: var(--ui-hover);
	}
	.settings-disclosure:focus-visible {
		outline: 2px solid var(--ui-focus);
		outline-offset: 2px;
		border-radius: 4px;
	}
	.autoplay-details {
		margin-top: 18px;
		border-top: 1px solid #ffffff14;
		border-bottom: 1px solid #ffffff14;
	}
	.limit-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 12px;
		font-size: 13px;
		padding: 12px 0;
		cursor: pointer;
	}
	.limit-row input {
		appearance: none;
		width: 36px;
		height: 22px;
		margin: 0;
		border-radius: 12px;
		background: #55585e;
		cursor: pointer;
		flex: none;
		transition: background-color 160ms ease-in-out, box-shadow 160ms ease-in-out;
	}
	.limit-row:hover input:not(:disabled) {
		box-shadow: 0 0 0 2px #ffffff26;
	}
	.limit-row input:focus-visible {
		outline: 2px solid var(--ui-focus);
		outline-offset: 3px;
	}
	.limit-row input::before {
		content: '';
		display: block;
		width: 16px;
		height: 16px;
		margin: 3px;
		border-radius: 50%;
		background: #fff;
		transform: translateX(0);
		transition:
			transform 160ms cubic-bezier(0.4, 0, 0.2, 1),
			background-color 160ms ease-in-out;
	}
	.limit-row input:checked {
		background: var(--ui-switch-on);
	}
	.limit-row input:checked::before {
		transform: translateX(14px);
		background: #fff;
	}
	.limit-row input:checked:dir(rtl)::before {
		transform: translateX(-14px);
	}
	.reduced-motion .limit-row input,
	.reduced-motion .limit-row input::before {
		transition: none;
	}
	.limit-setting {
		padding-bottom: 10px;
	}
	.limit-setting + .limit-setting {
		margin-top: 10px;
	}
	.limit-amount {
		display: flex;
		align-items: center;
		gap: 8px;
		border-bottom: 1px solid #ffffff30;
		padding: 6px 0 8px;
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
		border-bottom-color: #cf8585;
	}
	.limit-setting .limit-error {
		color: #f0abab;
	}
	.limits-note {
		margin: 10px 0 16px;
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
		pointer-events: none;
	}
	.auto-dialog :is(button, input):focus-visible {
		outline: 2px solid var(--ui-focus);
		outline-offset: 3px;
	}

	.autoplay-counts {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 4px;
		padding: 4px;
		border: 1px solid #ffffff14;
		border-radius: 10px;
		background: #ffffff0a;
		margin-bottom: 10px;
	}

	.count-btn,
	.custom-count {
		font-family: var(--font-sans);
		height: 32px;
		border-radius: 7px;
		border: 1px solid transparent;
		background: transparent;
		color: #fff;
		font-weight: 600;
		font-size: 13px;
		cursor: pointer;
	}

	.count-btn:hover:not(:disabled):not([aria-pressed='true']) {
		background: var(--ui-hover);
		border-color: var(--ui-edge);
	}

	.count-btn[aria-pressed='true'] {
		background: var(--ui-selected);
		color: #23282d;
		font-weight: 700;
		border-color: var(--ui-edge);
		box-shadow: 0 1px 3px #0005;
	}
	.count-btn[aria-pressed='true']:hover:not(:disabled) {
		background: var(--ui-selected);
	}

	.info-dialog button {
		transition:
			background-color 140ms ease,
			border-color 140ms ease,
			color 140ms ease,
			box-shadow 140ms ease,
			scale 70ms ease-out;
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
