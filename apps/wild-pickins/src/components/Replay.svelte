<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { page } from '$app/state';
	import { stateBet, stateUi, stateConfig, stateSound } from 'state-shared';
	import Game from './Game.svelte';
	import { getContext } from '../game/context';
	import { parseReplay, fetchReplay } from '../game/replay.mjs';
	import { playReplayRound, cancelFixturePlayback } from '../game/fixturePlayback.svelte';
	import { playBookEvents } from '../game/utils';
	import { resetBonusWin } from '../game/bonusWin.svelte';
	import { bonusEnding } from '../game/bonusEndingController';
	const context = getContext();
	// Latch this launch: changing URL parameters cannot enable wagering.
	const search = page.url.search;
	let config = $state<ReturnType<typeof parseReplay> | null>(null);
	let result = $state<Awaited<ReturnType<typeof fetchReplay>> | null>(null);
	let phase = $state<'loading' | 'ready' | 'playing' | 'complete' | 'error'>('loading');
	let error = $state('');
	let controller: AbortController;
	let disposed = false;
	const ready = $derived(context.stateApp.loaded && !context.stateLayout.showLoadingScreen);
	function money(value: number) {
		return `${new Intl.NumberFormat(undefined, { maximumFractionDigits: 6 }).format(value)} ${config?.currency ?? ''}`;
	}
	async function load() {
		controller?.abort();
		controller = new AbortController();
		phase = 'loading';
		error = '';
		try {
			config = parseReplay(search);
			stateUi.config.mode = 'replay';
			stateBet.betToResume = null;
			stateBet.betAmount = config.amount;
			stateBet.wageredBetAmount = config.amount;
			stateBet.currency = config.currency;
			stateBet.activeBetModeKey = config.mode;
			stateBet.autoSpinsCounter = 0;
			stateBet.isSpaceHold = false;
			stateBet.isTurbo = false;
			stateConfig.jurisdiction.socialCasino = config.social;
			const loaded = await fetchReplay(config, controller.signal);
			if (disposed) return;
			result = loaded;
			phase = 'ready';
		} catch (e) {
			if (!disposed) {
				error = e instanceof Error ? e.message : 'Unable to load replay.';
				phase = 'error';
			}
		}
	}
	async function play() {
		if (!result || !ready || !['ready', 'complete'].includes(phase)) return;
		phase = 'playing';
		stateBet.winBookEventAmount = 0;
		resetBonusWin();
		try {
			await tick();
			const saved = JSON.parse(JSON.stringify(result));
			if (saved.custom)
				await playReplayRound({
					state: saved.book,
					payoutMultiplier: saved.payoutMultiplier,
					costMultiplier: saved.costMultiplier,
				});
			else await playBookEvents(saved.book.events);
			if (disposed) return;
			stateBet.winBookEventAmount = result.payoutMultiplier * 100;
			phase = 'complete';
		} catch (e) {
			if (!disposed) {
				error = 'This round could not be replayed. Please retry.';
				phase = 'error';
			}
		}
	}
	onMount(() => {
		void load();
		return () => {
			disposed = true;
			controller?.abort();
			bonusEnding.cancel();
			cancelFixturePlayback();
		};
	});
</script>

{#if result}<Game replayOnly />{/if}
<section class:waiting={!result} aria-label="Round replay" class="replay-panel">
	<div class="heading">
		<strong>Wild Harvest · Replay</strong><button
			aria-label="Toggle sound"
			aria-pressed={stateSound.volumeValueMaster > 0}
			onclick={() => (stateSound.volumeValueMaster = stateSound.volumeValueMaster > 0 ? 0 : 75)}
			>{stateSound.volumeValueMaster > 0 ? 'Sound on' : 'Sound off'}</button
		>
	</div>
	{#if config}<small>{config.mode} · Event {config.event}</small>{/if}
	{#if result && config}
		<dl>
			<div>
				<dt>{config.social ? 'Play amount' : 'Base bet'}</dt>
				<dd>{money(config.amount)}</dd>
			</div>
			<div>
				<dt>{config.social ? 'Play cost' : 'Bet cost'}</dt>
				<dd>{money(config.amount * result.costMultiplier)}</dd>
			</div>
			<div>
				<dt>Payout</dt>
				<dd>{result.payoutMultiplier}×</dd>
			</div>
			<div>
				<dt>Win</dt>
				<dd>
					{money(
						phase === 'complete'
							? config.amount * result.payoutMultiplier
							: (stateBet.winBookEventAmount / 100) * config.amount,
					)}
				</dd>
			</div>
		</dl>
	{/if}
	<p role="status" aria-live="polite">
		{phase === 'loading'
			? 'Loading replay…'
			: phase === 'error'
				? error
				: phase === 'playing'
					? 'Replay in progress'
					: phase === 'complete'
						? 'Replay complete'
						: ready
							? 'Ready to replay'
							: 'Loading game…'}
	</p>
	{#if phase === 'error'}<button onclick={load}>Retry</button>
	{:else}<button
			class="play"
			disabled={!ready || !['ready', 'complete'].includes(phase)}
			onclick={play}>{phase === 'complete' ? 'Play Again' : 'Play'}</button
		>{/if}
</section>

<style>
	.replay-panel {
		position: fixed;
		bottom: max(12px, env(safe-area-inset-bottom));
		left: 50%;
		transform: translateX(-50%);
		z-index: 11000;
		width: min(580px, calc(100% - 24px));
		box-sizing: border-box;
		padding: 12px 18px;
		border: 1px solid #b7a36f;
		border-radius: 14px;
		background: #19251df2;
		color: #f5ebd4;
		font: 14px system-ui;
		box-shadow: 0 8px 30px #0008;
	}
	.waiting {
		bottom: auto;
		top: 50%;
		transform: translate(-50%, -50%);
	}
	.heading {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
	}
	small {
		overflow-wrap: anywhere;
		opacity: 0.8;
	}
	dl {
		display: flex;
		justify-content: space-between;
		gap: 10px;
		margin: 12px 0;
	}
	dt {
		font-size: 12px;
		opacity: 0.8;
	}
	dd {
		margin: 4px 0 0;
		font-weight: 700;
		overflow-wrap: anywhere;
	}
	p {
		margin: 8px 0;
	}
	button {
		border: 1px solid #b7a36f;
		border-radius: 7px;
		background: #ebd4a4;
		color: #19251d;
		padding: 8px 16px;
		font: inherit;
		cursor: pointer;
	}
	.play {
		width: 100%;
		font-weight: bold;
	}
	button:disabled {
		opacity: 0.5;
		cursor: default;
	}
	button:focus-visible {
		outline: 3px solid white;
		outline-offset: 3px;
	}
	@media (max-width: 420px) {
		.replay-panel {
			font-size: 12px;
			padding: 10px;
		}
		dl {
			flex-wrap: wrap;
		}
		dl > div {
			min-width: 40%;
		}
	}
</style>
