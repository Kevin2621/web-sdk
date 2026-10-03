<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { cancelPlayBet } from '../game/utils';
	import SeedCelebration from './SeedCelebration.svelte';
	import WinLines from './WinLines.svelte';
	import ScatterThud from './ScatterThud.svelte';

	import { EnablePixiExtension } from 'components-pixi';
	import { EnableHotkey } from 'components-shared';
	import { MainContainer } from 'components-layout';
	import { App } from 'pixi-svelte';
	import { stateModal, stateUi } from 'state-shared';

	import { UI, UiGameName } from 'components-ui-pixi';
	import { GameVersion, Modals, ModalError, ModalAutoSpinMessage } from 'components-ui-html';

	import { getContext } from '../game/context';
	import EnableSound from './EnableSound.svelte';
	import EnableGameActor from './EnableGameActor.svelte';
	import ResumeBet from './ResumeBet.svelte';
	import Sound from './Sound.svelte';
	import Background from './Background.svelte';
	import LoadingScreen from './LoadingScreen.svelte';
	import BaseScene from './BaseScene.svelte';
	import Win from './Win.svelte';
	import FreeSpinIntro from './FreeSpinIntro.svelte';
	import FreeSpinCounter from './FreeSpinCounter.svelte';
	import FreeSpinOutro from './FreeSpinOutro.svelte';
	import Transition from './Transition.svelte';
	import PlayerControls from './PlayerControls.svelte';

	const { preview = false } = $props<{ preview?: boolean }>();
	const context = getContext();

	onMount(() => (context.stateLayout.showLoadingScreen = true));
	onDestroy(cancelPlayBet);

	context.eventEmitter.subscribeOnMount({
		buyBonusConfirm: () => {
			stateModal.modal = { name: 'buyBonusConfirm' };
		},
	});
</script>

<App preloadTemplateFont={false}>
	<EnableSound />
	{#if !preview}<EnableHotkey /><EnableGameActor />{/if}
	<EnablePixiExtension />

	<ScatterThud><Background /></ScatterThud>

	{#if context.stateLayout.showLoadingScreen}
		<LoadingScreen onloaded={() => (context.stateLayout.showLoadingScreen = false)} />
	{:else}
		{#if !preview}<ResumeBet />{/if}
		<!--
			The reason why <Sound /> is rendered after clicking the loading screen:
			"Autoplay with sound is allowed if: The user has interacted with the domain (click, tap, etc.)."
			Ref: https://developer.chrome.com/blog/autoplay
		-->
		<Sound />

		<ScatterThud><MainContainer><BaseScene /></MainContainer></ScatterThud>
		<MainContainer><WinLines layer="total" /></MainContainer>

		{#if !preview && stateUi.config.mode === 'replay'}<UI>
				{#snippet gameName()}<UiGameName name="WILD PICKINS" />{/snippet}
				{#snippet logo()}{/snippet}
			</UI>{/if}
		<Win />
		<FreeSpinIntro />
		<FreeSpinOutro />
		<Transition />
	{/if}
</App>

{#if !context.stateLayout.showLoadingScreen}<SeedCelebration /><FreeSpinCounter />{/if}

{#if !preview && !context.stateLayout.showLoadingScreen}
	{#if stateUi.config.mode === 'replay'}<Modals>
			{#snippet version()}<GameVersion version="0.0.0" />{/snippet}
		</Modals>{:else}<PlayerControls /><ModalError /><ModalAutoSpinMessage />{/if}
{/if}
