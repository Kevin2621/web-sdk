<script lang="ts">
	import { type Snippet } from 'svelte';
	import { onDestroy } from 'svelte';

	import { EnablePixiExtension } from 'components-pixi';
	import { EnableHotkey } from 'components-shared';
	import { MainContainer } from 'components-layout';
	import { App, Container } from 'pixi-svelte';
	import { stateBet, stateConfig, stateMeta, stateModal, stateUi } from 'state-shared';

	import { UI, UiGameName } from 'components-ui-pixi';
	import { GameVersion, Modals } from 'components-ui-html';

	import { getContext } from '../game/context';
	import config from '../game/config';
	import EnableSound from './EnableSound.svelte';
	import AudioWorkbench from './AudioWorkbench.svelte';
	import { AUDIO_WORKBENCH_ENABLED } from '../game/audioWorkbenchEnabled';
	import Sound from './Sound.svelte';
	import EnableGameActor from './EnableGameActor.svelte';
	import ResumeBet from './ResumeBet.svelte';
	import Background from './Background.svelte';
	import BaseScene from './BaseScene.svelte';
	import WinLines from './WinLines.svelte';
	import ScatterThud from './ScatterThud.svelte';
	import LoadingScreen from './LoadingScreen.svelte';
	import SeedCelebration from './SeedCelebration.svelte';
	import PlayerControls from './PlayerControls.svelte';
	import InformationCatalog from './InformationCatalog.svelte';
	import SymbolStylePanel from './SymbolStylePanel.svelte';
	import BonusSign from './BonusSign.svelte';
	import FreeSpinIntro from './FreeSpinIntro.svelte';
	import FreeSpinCounter from './FreeSpinCounter.svelte';
	import FreeSpinOutro from './FreeSpinOutro.svelte';
	import Transition from './Transition.svelte';
	import { SESSION_CONTROLS_DELAY_MS } from '../game/sessionIntro.mjs';
	import defaultMath from '../game/selectedPaytable.json';

	const props = $props<{ fixtureOnly?: boolean; replayOnly?: boolean; presentation?: Snippet }>();
	const context = getContext();
	context.stateLayout.showLoadingScreen = true;
	let controlsReady = $state(false);
	let controlsTimer: ReturnType<typeof setTimeout> | undefined;
	onDestroy(() => clearTimeout(controlsTimer));
	function finishIntro() {
		context.stateLayout.showLoadingScreen = false;
		if (props.replayOnly) controlsReady = true;
		else controlsTimer = setTimeout(() => (controlsReady = true), SESSION_CONTROLS_DELAY_MS);
	}

	context.eventEmitter.subscribeOnMount({
		buyBonusConfirm: () => {
			stateModal.modal = { name: 'buyBonusConfirm' };
		},
	});
</script>

<div class="game-viewport" class:game-arriving={!context.stateLayout.showLoadingScreen && !props.replayOnly}>
	<App>
		<EnableSound />
		{#if !props.fixtureOnly && !props.replayOnly}
			<EnableHotkey />
			<EnableGameActor />
		{/if}
		<EnablePixiExtension />

		<ScatterThud>
			<Background />

			{#if context.stateLayout.showLoadingScreen}
				<div class="session-entry">
					<LoadingScreen automatic={props.replayOnly} onloaded={finishIntro} />
				</div>
			{:else}
				<Sound />
				{#if !props.fixtureOnly && !props.replayOnly}<ResumeBet />{/if}

				<MainContainer>
					<BaseScene arriving={!props.replayOnly} />
				</MainContainer>

				<FreeSpinIntro />

				<FreeSpinOutro />
				<Transition />
				<MainContainer>
					<WinLines layer="total" />
				</MainContainer>
				{#if !props.fixtureOnly && !props.replayOnly && stateUi.config.mode === 'replay'}<UI
						>{#snippet gameName()}<UiGameName
								name="Wild Harvest"
							/>{/snippet}{#snippet logo()}{/snippet}</UI
					>{/if}
			{/if}
		</ScatterThud>
		{#if !context.stateLayout.showLoadingScreen}{@render props.presentation?.()}{/if}
		{#if !context.stateLayout.showLoadingScreen && (props.fixtureOnly || stateUi.config.mode !== 'replay')}
			<Container x={12} y={10}><UiGameName name="Wild Harvest" /></Container>
		{/if}
	</App>
	{#if !context.stateLayout.showLoadingScreen && import.meta.env.DEV && !props.replayOnly}<SymbolStylePanel />{/if}
	{#if !context.stateLayout.showLoadingScreen && import.meta.env.DEV && AUDIO_WORKBENCH_ENABLED && !props.replayOnly}<AudioWorkbench fixtureOnly={props.fixtureOnly} />{/if}
	{#if !context.stateLayout.showLoadingScreen}<SeedCelebration />{/if}
	{#if controlsReady && !props.fixtureOnly && !props.replayOnly && stateUi.config.mode !== 'replay'}<PlayerControls />{/if}
	{#if !props.replayOnly && stateUi.config.mode === 'replay'}
		<InformationCatalog
			open={stateModal.modal?.name === 'payTable' || stateModal.modal?.name === 'gameRules'}
			onclose={() => {
				if (stateModal.modal?.name === 'payTable' || stateModal.modal?.name === 'gameRules')
					stateModal.modal = null;
			}}
			bet={stateBet.betAmount}
			levels={stateConfig.betAmountOptions}
			simulated={false}
			bonusAvailable={stateMeta.betModeMeta?.BONUS?.type === 'buy' && !stateConfig.jurisdiction.disabledBuyFeature}
			bonusCost={stateMeta.betModeMeta?.BONUS?.costMultiplier ?? config.betModes.bonus.cost}
			autoplayDisabled={stateConfig.jurisdiction.disabledAutoplay}
			turboDisabled={stateConfig.jurisdiction.disabledTurbo}
			math={defaultMath}
			multiplierRules={false}
			goldenPicksEnabled={true}
		/>
	{/if}
	{#if !context.stateLayout.showLoadingScreen}<BonusSign /><FreeSpinCounter />{/if}

	{#if !props.replayOnly && stateModal.modal?.name !== 'buyBonus'}
	<Modals bonusModes={Object.keys(config.betModes)} showLegacyInformation={false}>
		{#snippet version()}
			<GameVersion version="0.0.0" />
		{/snippet}
	</Modals>
	{/if}
</div>

<style>
	.session-entry { position: fixed; inset: 0; z-index: 10000; }
	/* A neutral matte surrounds the fitted scene on narrow or ultrawide screens. */
	.game-viewport {
		position: fixed;
		inset: 0;
		overflow: hidden;
		background-color: #19251d;
	}
	.game-viewport :global(canvas) {
		display: block;
	}
	.game-arriving :global(.player-controls) {
		animation: controls-arrive .52s cubic-bezier(.2,.75,.2,1) both;
	}
	@keyframes controls-arrive {
		0% { opacity: 0; translate: 0 110px; }
		72% { opacity: 1; translate: 0 -14px; }
		100% { opacity: 1; translate: 0 0; }
	}
</style>
