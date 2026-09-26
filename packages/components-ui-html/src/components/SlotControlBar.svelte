<script lang="ts">
	import { onDestroy } from 'svelte';
	import { fly } from 'svelte/transition';
	import { cubicOut, cubicIn } from 'svelte/easing';
	/** Presentation only: the host game owns wagers, round results and autoplay. */
	let {
		variant = 'game',
		amount = $bindable(1),
		amounts = [0.2, 0.5, 1, 2, 5, 10, 20, 50, 100],
		menuOpen = false,
		reducedMotion = false,
		persistWin = false,
		winLabel,
		showZeroWin = false,
		win = 0,
		balance,
		balanceNote = '',
		spinning = false,
		disabled = false,
		speed = $bindable(1),
		auto = $bindable(false),
		autoSetup = false,
		spinDisabled = false,
		bonusDisabled = false,
		speedDisabled = false,
		showAuto = true,
		stopQueued = false,
		autoCount = '',
		speedText = '',
		label = (key: string) => key,
		formatAmount = (value: number) =>
			new Intl.NumberFormat('en-US', { maximumFractionDigits: 6 }).format(value),
		onspin,
		onbonus,
		onmenu,
		onamountchange,
		onspeedchange,
		onautochange,
	}: {
		variant?: 'game' | 'bonus';
		menuOpen?: boolean;
		winLabel?: string;
		showZeroWin?: boolean;
		persistWin?: boolean;
		reducedMotion?: boolean;
		amount?: number;
		amounts?: number[];
		balance?: number;
		balanceNote?: string;
		win?: number;
		spinning?: boolean;
		disabled?: boolean;
		spinDisabled?: boolean;
		bonusDisabled?: boolean;
		speedDisabled?: boolean;
		showAuto?: boolean;
		stopQueued?: boolean;
		autoCount?: string;
		speedText?: string;
		label?: (key: string) => string;
		speed?: number;
		auto?: boolean;
		autoSetup?: boolean;
		formatAmount?: (value: number) => string;
		onspin?: () => void;
		onbonus?: () => void;
		onmenu?: () => void;
		onamountchange?: (value: number) => void;
		onspeedchange?: (value: number) => void;
		onautochange?: (value: boolean) => void;
	} = $props();
	let presetsOpen = $state(false);
	let autoCloseIcon = $state(false);
	$effect(() => {
		// Change the glyph after the popup enters; its controls remain immediately responsive.
		if (!autoSetup || reducedMotion) {
			autoCloseIcon = autoSetup;
			return;
		}
		const timer = setTimeout(() => (autoCloseIcon = true), 120);
		return () => clearTimeout(timer);
	});
	let stakeElement: HTMLDivElement;
	function dismissPresets(event: PointerEvent) {
		if (event.target instanceof Node && !stakeElement?.contains(event.target)) presetsOpen = false;
	}
	$effect(() => {
		if (locked || menuOpen || autoSetup) presetsOpen = false;
	});
	let levels = $derived(
		[...new Set(amounts.filter((n) => Number.isFinite(n) && n > 0))].sort((a, b) => a - b),
	);
	let locked = $derived(disabled || spinning || auto);
	let index = $derived(
		Math.max(
			0,
			levels.findIndex((n) => n >= amount),
		),
	);
	let sliderFill = $derived(levels.length > 1 ? (index / (levels.length - 1)) * 100 : 0);
	function select(value: number) {
		if (locked || !Number.isFinite(value)) return;
		if (onamountchange) onamountchange(value);
		else amount = value;
	}
	function step(direction: number) {
		if (locked) return false;
		const next =
			direction > 0
				? levels.find((n) => n > amount)
				: [...levels].reverse().find((n) => n < amount);
		if (next === undefined) return false;
		select(next);
		return true;
	}
	let holdTimer: ReturnType<typeof setTimeout> | undefined;
	function stopHold() {
		clearTimeout(holdTimer);
		holdTimer = undefined;
	}
	function startHold(event: PointerEvent, direction: number) {
		if (event.button !== 0 || !event.isPrimary) return;
		stopHold();
		if (!step(direction)) return;
		const repeat = () => {
			if (!step(direction)) {
				stopHold();
				return;
			}
			holdTimer = setTimeout(repeat, 200);
		};
		holdTimer = setTimeout(repeat, 450);
	}
	// Pointer presses step immediately; keyboard/assistive clicks still step once.
	function arrowClick(event: MouseEvent, direction: number) {
		if (event.detail === 0) step(direction);
	}
	$effect(() => {
		if (locked) stopHold();
	});
	onDestroy(stopHold);
</script>

<svelte:document
	onpointerdown={dismissPresets}
	onkeydown={(event) => {
		if (event.key === 'Escape') presetsOpen = false;
	}}
	onvisibilitychange={() => {
		if (document.hidden) stopHold();
	}}
/>
<svelte:window onpointerup={stopHold} onpointercancel={stopHold} onblur={stopHold} />

<div
	class="control-container"
	class:reduced-motion={reducedMotion}
	class:motion-enabled={!reducedMotion}
>
	<div
		class="slot-controls"
		class:bonus-only={variant === 'bonus'}
		aria-label={variant === 'bonus' ? 'Bonus bet controls' : 'Game controls'}
	>
		{#if variant === 'game'}<button
				class="bonus"
				onclick={onbonus}
				disabled={locked || bonusDisabled}
				aria-label={label('Bonus')}
			>
				<svg class="bonus-rim" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"
					><path d="M15 5H85L95 15V85L85 95H15L5 85V15Z" /></svg
				>
				<svg class="bonus-mark" viewBox="0 0 32 32" aria-hidden="true"
					><path d="m15 5 3 8 8 3-8 3-3 8-3-8-8-3 8-3Z" /><path d="M26 3v6M23 6h6" /></svg
				>
				<span>{label('Bonus')}</span>
			</button>
		{/if}
		<div class="bar">
			{#if variant === 'game'}<button
					class="menu"
					onclick={onmenu}
					aria-expanded={menuOpen}
					aria-label={label(menuOpen ? 'Close' : 'Menu')}
				>
					<svg viewBox="0 0 24 24" aria-hidden="true"
						><path d={menuOpen ? 'M6 6 18 18M18 6 6 18' : 'M4 7h16M4 12h16M4 17h16'} /></svg
					>
				</button>
			{/if}
			<div class="readouts">
				{#if balance !== undefined || balanceNote}
					<div class="readout-card balance">
						<span class="label">{label('Balance')}</span>
						<strong class="value"
							><bdi>{balance !== undefined ? formatAmount(balance) : balanceNote}</bdi></strong
						>
					</div>
				{/if}
				{#if variant === 'game'}<div
						class="readout-card win"
						role="status"
						aria-live="polite"
						aria-atomic="true"
					>
						{#if (win > 0 || showZeroWin) && (persistWin || !spinning)}
							<span class="label">{label(winLabel ?? (persistWin ? 'Last win' : 'Win'))}</span>
							<strong class="value"><bdi>{formatAmount(win)}</bdi></strong>
						{/if}
					</div>
				{/if}
			</div>
			<div class="play-group">
				<div class="stake" bind:this={stakeElement}>
					<button
						class="amount"
						disabled={locked || !levels.length}
						aria-expanded={presetsOpen && !locked}
						aria-label={`${label('Play')} ${formatAmount(amount)}`}
						onclick={() => (presetsOpen = !presetsOpen)}
					>
						<span class="label">{label('Play')}</span>
						<strong class="value"><bdi>{formatAmount(amount)}</bdi></strong>
					</button>
					<div class="slider-wrapper">
						{#if variant === 'bonus' && levels.length}
							<div class="slider-limits" aria-hidden="true">
								<span>{formatAmount(levels[0])}</span>
								<span>{formatAmount(levels[levels.length - 1])}</span>
							</div>
						{/if}
						<input
							type="range"
							style:--slider-fill={`${sliderFill}%`}
							aria-label={label('Play')}
							min="0"
							max={Math.max(0, levels.length - 1)}
							value={index}
							step="1"
							aria-valuetext={formatAmount(amount)}
							disabled={locked || levels.length < 2}
							oninput={(event) => select(levels[Number(event.currentTarget.value)])}
						/>
					</div>
					{#if presetsOpen && !locked}
						<div
							class="presets"
							role="group"
							aria-label="Common play amounts"
							inert={!presetsOpen || locked}
							in:fly={{ y: 6, duration: reducedMotion ? 0 : 120, easing: cubicOut }}
							out:fly={{ y: 6, duration: reducedMotion ? 0 : 120, easing: cubicIn }}
						>
							<div class="preset-heading">
								<span>{label('Play')}</span>
								<button
									class="preset-close"
									aria-label={label('Close')}
									onclick={() => (presetsOpen = false)}>×</button
								>
							</div>
							<div class="preset-scroll">
								<div class="preset-grid">
									{#each levels as value}
										<button
											class="preset-btn"
											aria-pressed={amount === value}
											onclick={() => {
												select(value);
												presetsOpen = false;
											}}
										>
											{formatAmount(value)}
										</button>
									{/each}
								</div>
							</div>
						</div>
					{/if}
				</div>
				{#if variant === 'game'}<div class="steps">
						<button
							class="step-btn"
							aria-label={`${label('Play')} +`}
							disabled={locked || !levels.some((n) => n > amount)}
							onpointerdown={(event) => startHold(event, 1)}
							onpointerleave={stopHold}
							onclick={(event) => arrowClick(event, 1)}
						>
							<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m18 15-6-6-6 6" /></svg>
						</button>
						<button
							class="step-btn"
							aria-label={`${label('Play')} −`}
							disabled={locked || !levels.some((n) => n < amount)}
							onpointerdown={(event) => startHold(event, -1)}
							onpointerleave={stopHold}
							onclick={(event) => arrowClick(event, -1)}
						>
							<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
						</button>
					</div>
					<div class="actions" class:no-auto={!showAuto}>
						<button
							class="speed"
							disabled={disabled || speedDisabled}
							aria-label={`${label('Speed')} ${speedText || speed}`}
							title={`${label('Speed')} ${speedText || speed}`}
							onclick={() => {
								const next = speed === 1 ? 2 : speed === 2 ? 3 : 1;
								if (onspeedchange) onspeedchange(next);
								else speed = next;
							}}
						>
							<svg viewBox="0 0 24 24" aria-hidden="true"
								><path class="bolt" d="m13 2-8 11h6l-1 9 10-12h-6z" /></svg
							>
							<small>{speed}×</small>
						</button>
						<button
							class="spin"
							disabled={stopQueued || (!auto && (disabled || spinning || spinDisabled))}
							onclick={onspin}
							aria-label={auto
								? label('Stop')
								: autoSetup
									? `${label('Start')} ${autoCount}`
									: label('Spin')}
						>
							<svg viewBox="0 0 64 64" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
								{#if auto}
									<rect
										x="12"
										y="12"
										width="40"
										height="40"
										rx="4"
										fill="currentColor"
										stroke="none"
									/>
									<text
										class="remaining-spins"
										x="32"
										y="32"
										text-anchor="middle"
										dominant-baseline="central">{autoCount}</text
									>
								{:else if autoSetup}
									<g transform="scale(2)" stroke-width="1.75">
										<path d="M6.474 10.5A11 11 0 0 1 27 16M25.526 21.5A11 11 0 0 1 5 16" />
										<path class="auto-arrow" d="M23.5 14 27 19.5 30.5 14ZM8.5 18 5 12.5 1.5 18Z" />
										<path class="auto-play" d="M13 11.5 20 16 13 20.5Z" />
									</g>
								{:else}
									<!-- Circular arc centered at (32,32), radius 22. -->
									<path class="spin-ring" d="M48.853 46.141A22 22 0 1 1 54 32" />
									<path class="spin-arrow" d="M47 28 54 40 61 28Z" />
								{/if}
							</svg>
						</button>
						{#if showAuto}
							<button
								class="auto"
								aria-label={autoSetup ? label('Close') : auto ? label('Stop') : label('Auto')}
								title={autoSetup ? label('Close') : label('Auto')}
								aria-expanded={autoSetup}
								disabled={!autoSetup &&
									(stopQueued || ((disabled || spinning || spinDisabled) && !auto))}
								aria-pressed={auto}
								onclick={() => {
									if (onautochange) onautochange(!auto);
									else auto = !auto;
								}}
							>
								<svg viewBox="0 0 32 32" aria-hidden="true">
									{#if autoCloseIcon}<path d="M9 9 23 23M23 9 9 23" />{:else}
										<!-- Both arcs share center (16,16) and radius 11. -->
										<path d="M6.474 10.5A11 11 0 0 1 27 16M25.526 21.5A11 11 0 0 1 5 16" />
										<path class="auto-arrow" d="M23.5 14 27 19.5 30.5 14ZM8.5 18 5 12.5 1.5 18Z" />
										<path class="auto-play" d="M13 11.5 20 16 13 20.5Z" />
									{/if}
								</svg>
								{#if auto}<span class="auto-status" aria-hidden="true"
										>{stopQueued ? '…' : label('On')}</span
									>{/if}
							</button>
						{/if}
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>

<style>
	/* One shared scale, surface, divider and hover state. */
	.control-container {
		container: slotbar / inline-size;
		width: 100%;
	}
	.slot-controls {
		--height: clamp(48px, 7.2cqw, 90px);
		--spin: clamp(78px, 11.6cqw, 145px);
		--space: clamp(10px, 1.4cqw, 18px);
		--line: #41444a;
		--surface: #282c32;
		--hover: #ffffff12;
		display: flex;
		align-items: center;
		gap: var(--space);
		color: #f5f5f5;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
	}
	* {
		box-sizing: border-box;
	}
	button {
		margin: 0;
		padding: 0;
		border: 0;
		background: transparent;
		color: inherit;
		font: inherit;
		cursor: pointer;
		-webkit-tap-highlight-color: transparent;
	}
	button:hover:not(:disabled) {
		background-image: linear-gradient(var(--hover), var(--hover));
	}
	button:focus-visible,
	input:focus-visible {
		outline: 2px solid white;
		outline-offset: 3px;
	}
	button:disabled,
	input:disabled {
		cursor: default;
	}
	button:disabled svg,
	.amount:disabled .value {
		opacity: 0.4;
	}
	svg {
		display: block;
		width: 26px;
		height: 26px;
		fill: none;
		stroke: currentColor;
		stroke-width: 2.5;
		stroke-linecap: round;
		stroke-linejoin: round;
	}
	.bolt,
	.spin-arrow,
	.auto-arrow,
	.auto-play {
		fill: currentColor;
		stroke: none;
	}
	.bonus {
		position: relative;
		flex: none;
		width: calc(var(--spin) * 0.74);
		aspect-ratio: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 3px;
		clip-path: polygon(12% 0, 88% 0, 100% 12%, 100% 88%, 88% 100%, 12% 100%, 0 88%, 0 12%);
		background-color: #f6ca43;
		color: #302609;
		font-size: clamp(10px, 1.15cqw, 15px);
		font-weight: 750;
		letter-spacing: 0.055em;
		text-transform: uppercase;
	}
	.bonus .bonus-rim {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		stroke: #806017;
		stroke-width: 1;
		opacity: 0.45;
		pointer-events: none;
	}
	.bonus .bonus-mark {
		width: 32%;
		height: 32%;
		stroke-width: 1.8;
	}
	.bonus:focus-visible {
		outline: none;
		background-color: #ffe493;
	}
	.bonus:focus-visible .bonus-rim {
		stroke-width: 3;
		opacity: 1;
	}

	/* Keep bar glass on a sibling layer so popup blur can sample the game backdrop. */
	.bar {
		position: relative;
		isolation: isolate;
		outline: 2px solid #000;
		flex: 1;
		min-width: 0;
		height: var(--height);
		display: flex;
		align-items: stretch;
		border-radius: 8px;
		box-shadow: 0 4px 16px #0003;
	}
	.bar::before {
		content: '';
		position: absolute;
		inset: 0;
		z-index: -1;
		border-radius: inherit;
		background: #16181dcc;
		backdrop-filter: blur(16px);
		-webkit-backdrop-filter: blur(16px);
		pointer-events: none;
	}
	.menu {
		flex: 0 0 clamp(42px, 7cqw, 88px);
		display: grid;
		place-items: center;
		border-radius: 8px 0 0 8px;
	}
	.readouts {
		flex: 1;
		min-width: 0;
		display: flex;
		align-items: center;
		gap: var(--space);
		padding-inline: var(--space);
	}
	.readouts,
	.play-group,
	.steps,
	.actions {
		border-inline-start: 1px solid var(--line);
	}
	.readout-card {
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 3px;
	}
	.win {
		flex: 1;
		text-align: end;
	}
	.label {
		color: #bfc1c5;
		font-size: clamp(11px, 1.35cqw, 17px);
		line-height: 1.1;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}
	.value {
		min-width: 0;
		max-width: 100%;
		font-size: clamp(14px, 1.85cqw, 24px);
		font-weight: 600;
		line-height: 1.2;
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
		overflow: auto;
		scrollbar-width: none;
	}
	.value::-webkit-scrollbar {
		display: none;
	}
	.play-group {
		display: flex;
		flex: none;
		background: var(--surface);
		border-radius: 0 8px 8px 0;
	}
	.stake {
		position: relative;
		width: clamp(100px, 14.2cqw, 178px);
		display: grid;
		grid-template-rows: minmax(0, 1fr) 4px;
	}
	/* Offset the 4px slider plus its 1px divider to center text with the other readouts. */
	.amount {
		min-height: 0;
		min-width: 0;
		display: flex;
		flex-direction: column;
		justify-content: center;
		gap: 3px;
		padding-inline: var(--space);
		padding-block: 5px 0;
		text-align: start;
		border-bottom: 1px solid var(--line);
	}
	.slider-wrapper {
		position: relative;
	}
	input[type='range'] {
		--direction: to right;
		appearance: none;
		-webkit-appearance: none;
		display: block;
		width: 100%;
		height: 4px;
		margin: 0;
		border: 0;
		border-radius: 0;
		background: linear-gradient(var(--direction), #eee var(--slider-fill), #555 var(--slider-fill));
		cursor: pointer;
	}
	input[type='range']:dir(rtl) {
		--direction: to left;
	}
	input[type='range']::-webkit-slider-thumb {
		appearance: none;
		width: 8px;
		height: 12px;
		background: #eee;
		border: 0;
		border-radius: 2px;
		transition: transform 50ms ease-out;
	}
	input[type='range']::-moz-range-thumb {
		width: 8px;
		height: 12px;
		background: #eee;
		border: 0;
		border-radius: 2px;
		transition: transform 50ms ease-out;
	}
	input[type='range']:active:not(:disabled)::-webkit-slider-thumb {
		transform: scale(var(--thumb-press-scale, 1.15));
	}
	input[type='range']:active:not(:disabled)::-moz-range-thumb {
		transform: scale(var(--thumb-press-scale, 1.15));
	}
	.reduced-motion input[type='range'] {
		--thumb-press-scale: 1;
	}
	.reduced-motion input[type='range']::-webkit-slider-thumb {
		transition: none;
	}
	.reduced-motion input[type='range']::-moz-range-thumb {
		transition: none;
	}
	.steps {
		background: var(--surface);
		display: grid;
		grid-template-rows: 1fr 1fr;
		width: clamp(34px, 4.4cqw, 55px);
	}
	.step-btn {
		display: grid;
		place-items: center;
		touch-action: none;
		user-select: none;
	}
	.step-btn svg {
		width: 22px;
		height: 22px;
	}

	/* Overlapping grid cells connect both hover areas to the spin circle without negative margins. */
	.actions {
		background: var(--surface);
		border-radius: 0 8px 8px 0;
		display: grid;
		grid-template-rows: minmax(0, 1fr);
		grid-template-columns: clamp(28px, 2.6cqw, 33px) repeat(2, calc(var(--spin) / 2)) clamp(
				44px,
				6.2cqw,
				78px
			);
		align-items: stretch;
	}
	.actions.no-auto {
		grid-template-columns: clamp(28px, 2.6cqw, 33px) repeat(2, calc(var(--spin) / 2)) 0;
	}
	.speed,
	.spin,
	.auto {
		grid-row: 1;
	}
	.speed {
		grid-column: 1 / 3;
		padding-inline-end: calc(var(--spin) / 2);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 3px;
	}
	.speed svg {
		width: 18px;
		height: 20px;
	}
	.speed small {
		font-size: 11px;
	}
	/* Scale around the visible controls, excluding the overlap beneath Spin. */
	.speed {
		transform-origin: calc(50% - var(--spin) / 4) 50%;
	}
	.speed:dir(rtl) {
		transform-origin: calc(50% + var(--spin) / 4) 50%;
	}
	.auto {
		transform-origin: calc(50% + var(--spin) / 4) 50%;
	}
	.auto:dir(rtl) {
		transform-origin: calc(50% - var(--spin) / 4) 50%;
	}
	.spin {
		grid-column: 2 / 4;
		align-self: center;
		position: relative;
		z-index: 1;
		width: var(--spin);
		height: var(--spin);
		display: grid;
		place-items: center;
		border: 1px solid #60646b;
		border-radius: 50%;
		background: linear-gradient(#363b43, #22262c);
		box-shadow: 0 3px 8px #0004;
	}
	.spin:hover:not(:disabled) {
		background: #3b4048;
	}
	.spin svg {
		width: 72%;
		height: 72%;
		aspect-ratio: 1;
	}
	.remaining-spins {
		fill: #282c32;
		stroke: none;
		font-size: 12px;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
	}
	.spin-ring {
		stroke-width: 3.5;
	}
	.spin:disabled {
		background: #292c30;
		border-color: #41444a;
		box-shadow: none;
	}
	.auto {
		position: relative;
		grid-column: 3 / 5;
		padding-inline-start: calc(var(--spin) / 2);
		display: grid;
		place-items: center;
		border-radius: 0 8px 8px 0;
	}
	.auto svg {
		width: 28px;
		height: 28px;
		aspect-ratio: 1;
		stroke-width: 2.25;
	}
	.auto[aria-pressed='true'] {
		background: #e4e7eb;
		color: #24282e;
	}
	.auto[aria-pressed='true']:hover:not(:disabled) {
		background: #fff;
	}
	.auto[aria-pressed='true'] svg {
		transform: translateY(-4px);
	}
	.auto-status {
		position: absolute;
		inset-inline-start: calc(var(--spin) / 2);
		inset-inline-end: 0;
		bottom: 4px;
		text-align: center;
		font-size: 9px;
		line-height: 1;
		font-weight: 750;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	.presets {
		position: absolute;
		bottom: calc(100% + 16px);
		inset-inline-end: 0;
		z-index: 3;
		width: min(300px, 85cqw);
		overflow: hidden;
		background: #16181dcc;
		backdrop-filter: blur(16px);
		-webkit-backdrop-filter: blur(16px);
		border: 1px solid #ffffff1f;
		border-radius: 12px;
		box-shadow: 0 4px 16px #0003;
	}
	.preset-heading {
		position: absolute;
		inset: 0 0 auto;
		z-index: 1;
		height: 49px;
		padding: 8px 20px;
		display: flex;
		justify-content: space-between;
		align-items: center;
		background: #16181db3;
		backdrop-filter: blur(20px);
		-webkit-backdrop-filter: blur(20px);
		border-bottom: 1px solid #ffffff14;
		font-size: 14px;
		font-weight: 700;
		letter-spacing: 0.04em;
		text-transform: uppercase;
	}
	.preset-close {
		width: 32px;
		height: 32px;
		display: grid;
		place-items: center;
		border-radius: 50%;
		background: #ffffff0f;
		color: #ffffffb3;
		font-size: 20px;
		font-weight: 400;
	}
	.preset-scroll {
		max-height: calc(100dvh - 180px - env(safe-area-inset-top) - env(safe-area-inset-bottom));
		overflow-y: auto;
		overscroll-behavior-y: contain;
		scrollbar-width: thin;
		scrollbar-gutter: stable;
		scrollbar-color: #ffffff40 transparent;
		padding: 61px 20px 16px;
		scroll-padding-top: 61px;
	}
	.preset-grid {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 6px;
	}
	.preset-btn {
		min-height: 32px;
		min-width: 0;
		padding: 6px 4px;
		background: #ffffff0d;
		border: 1px solid #ffffff14;
		border-radius: 8px;
		font-size: 13px;
		font-weight: 600;
		overflow-wrap: anywhere;
	}
	.preset-btn[aria-pressed='true'] {
		background: #fff;
		color: #0d0e11;
		border-color: #fff;
		font-weight: 700;
	}

	@container slotbar (max-width: 620px) {
		.slot-controls {
			--height: 64px;
			--spin: 80px;
			position: relative;
		}
		.bonus {
			position: absolute;
			top: 4px;
			inset-inline-start: 8px;
			z-index: 2;
			width: 48px;
		}
		.bar {
			flex-wrap: wrap;
			height: auto;
		}
		.menu {
			height: 56px;
			margin-inline-start: 64px;
		}
		.readouts {
			height: 56px;
		}
		.play-group {
			height: var(--height);
			width: 100%;
			border-inline-start: 0;
			border-top: 1px solid var(--line);
			border-radius: 0 0 8px 8px;
		}
		.stake {
			width: auto;
			min-width: 0;
			flex: 1;
		}
		.presets {
			inset-inline-start: 0;
			inset-inline-end: auto;
		}
	}
	/* Three sections like the feature selector: balance, play amount, then range. */
	.bonus-only .bar {
		flex-wrap: nowrap;
		height: clamp(64px, 8cqw, 82px);
		border-radius: 12px;
		outline: 1px solid #ffffff35;
		box-shadow: inset 0 1px #ffffff18, 0 8px 24px #0005;
	}
	.bonus-only .readouts {
		flex: 1;
		height: auto;
		border-inline-start: 0;
		justify-content: center;
		text-align: center;
	}
	.bonus-only .play-group {
		flex: 2.8;
		min-width: 0;
		width: auto;
		height: auto;
		border: 0;
		background: transparent;
		border-radius: 0 12px 12px 0;
	}
	.bonus-only .stake {
		width: auto;
		min-width: 0;
		flex: 1;
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 2fr);
		grid-template-rows: minmax(0, 1fr);
	}
	.bonus-only .amount {
		align-items: center;
		text-align: center;
		padding: 0 8px;
		border-bottom: 0;
		border-inline: 1px solid #ffffff12;
	}
	.bonus-only .slider-wrapper {
		min-width: 0;
		align-self: center;
		display: grid;
		gap: 12px;
		padding: 0 clamp(12px, 2cqw, 24px);
	}
	.slider-limits {
		display: flex;
		justify-content: space-between;
		gap: 8px;
		color: #bfc1c5;
		font-size: clamp(10px, 1.5cqw, 15px);
		font-weight: 600;
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}
	.bonus-only .presets {
		inset-inline-start: 0;
		inset-inline-end: auto;
		max-width: min(320px, 85vw);
	}
	.bonus-only .value {
		overflow: hidden;
		text-overflow: ellipsis;
		font-size: clamp(12px, 2.5cqw, 26px);
		font-weight: 700;
	}
	.bonus-only .label { font-size: clamp(10px, 1.65cqw, 17px); }
	@container slotbar (max-width: 480px) {
		.bonus-only .readouts { padding-inline: 6px; }
		.bonus-only .play-group { flex: 2.4; }
		.bonus-only .stake { grid-template-columns: minmax(0, 1fr) minmax(0, 1.7fr); }
		.bonus-only .slider-wrapper { padding-inline: 10px; }
	}
	.motion-enabled button {
		transition: scale 50ms ease-out;
	}
	.menu,
	.step-btn,
	.speed,
	.auto,
	.preset-btn,
	.preset-close {
		--press-scale: 0.95;
	}
	.motion-enabled button:active:not(:disabled) {
		scale: var(--press-scale, 0.98);
	}
</style>
