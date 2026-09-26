<script lang="ts">
	import { onMount, type Snippet } from 'svelte';

	import { EnablePixiExtension } from 'components-pixi';
	import { EnableHotkey } from 'components-shared';
	import { MainContainer } from 'components-layout';
	import { App, Container } from 'pixi-svelte';
	import { stateModal, stateUi } from 'state-shared';

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
	import ScatterThud from './ScatterThud.svelte';
	import LoadingScreen from './LoadingScreen.svelte';
	import SeedCelebration from './SeedCelebration.svelte';
	import PlayerControls from './PlayerControls.svelte';
	import SymbolStylePanel from './SymbolStylePanel.svelte';
	import BonusSign from './BonusSign.svelte';
	import FreeSpinIntro from './FreeSpinIntro.svelte';
	import FreeSpinCounter from './FreeSpinCounter.svelte';
	import FreeSpinOutro from './FreeSpinOutro.svelte';
	import Transition from './Transition.svelte';

	const props = $props<{ fixtureOnly?: boolean; presentation?: Snippet }>();
	const context = getContext();

	onMount(() => (context.stateLayout.showLoadingScreen = true));

	context.eventEmitter.subscribeOnMount({
		buyBonusConfirm: () => {
			stateModal.modal = { name: 'buyBonusConfirm' };
		},
	});
</script>

<div class="game-viewport">
	<App>
		<EnableSound />
		{#if !props.fixtureOnly}
			<EnableHotkey />
			<EnableGameActor />
		{/if}
		<EnablePixiExtension />

		<ScatterThud>
			<Background />

			{#if context.stateLayout.showLoadingScreen}
				<LoadingScreen onloaded={() => (context.stateLayout.showLoadingScreen = false)} />
			{:else}
				<Sound />
				{#if !props.fixtureOnly}<ResumeBet />{/if}

				<MainContainer>
					<BaseScene />
				</MainContainer>

				{#if !props.fixtureOnly && stateUi.config.mode === 'replay'}<UI
						>{#snippet gameName()}<UiGameName
								name="Wild Pickins"
							/>{/snippet}{#snippet logo()}{/snippet}</UI
					>{/if}
				<FreeSpinIntro />

				<FreeSpinOutro />
				<Transition />
			{/if}
		</ScatterThud>
		{#if !context.stateLayout.showLoadingScreen}{@render props.presentation?.()}{/if}
		{#if !context.stateLayout.showLoadingScreen && (props.fixtureOnly || stateUi.config.mode !== 'replay')}
			<Container x={12} y={10}><UiGameName name="Wild Pickins" /></Container>
		{/if}
	</App>
	{#if import.meta.env.DEV}<SymbolStylePanel />{/if}
	{#if import.meta.env.DEV && AUDIO_WORKBENCH_ENABLED}<AudioWorkbench fixtureOnly={props.fixtureOnly} />{/if}
	<SeedCelebration />
	{#if !props.fixtureOnly && stateUi.config.mode !== 'replay'}<PlayerControls />{/if}
	<BonusSign />
	<FreeSpinCounter />

	{#if stateModal.modal?.name !== 'buyBonus'}
	<Modals bonusModes={Object.keys(config.betModes)}>
		{#snippet version()}
			<GameVersion version="0.0.0" />
		{/snippet}
	</Modals>
	{/if}
</div>

<style>
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
</style>
