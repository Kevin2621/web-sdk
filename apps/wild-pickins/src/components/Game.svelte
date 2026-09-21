<script lang="ts">
	import { onMount, type Snippet } from 'svelte';

	import { EnablePixiExtension } from 'components-pixi';
	import { EnableHotkey } from 'components-shared';
	import { MainContainer } from 'components-layout';
	import { App, Container, Text, REM } from 'pixi-svelte';
	import { stateModal, stateUi } from 'state-shared';

	import { UI, UiGameName } from 'components-ui-pixi';
	import { GameVersion, Modals } from 'components-ui-html';

	import { getContext } from '../game/context';
	import config from '../game/config';
	import EnableSound from './EnableSound.svelte';
	import EnableGameActor from './EnableGameActor.svelte';
	import ResumeBet from './ResumeBet.svelte';
	import Sound from './Sound.svelte';
	import Background from './Background.svelte';
	import ScatterThud from './ScatterThud.svelte';
	import LoadingScreen from './LoadingScreen.svelte';
	import BoardFrame from './BoardFrame.svelte';
	import BoardBackdrop from './BoardBackdrop.svelte';
	import Board from './Board.svelte';
	import Anticipations from './Anticipations.svelte';
	import WinSign from './WinSign.svelte';
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
	const fieldBackdrop = new URL('../../assets/art-v1/field-a.png', import.meta.url).href;

	onMount(() => (context.stateLayout.showLoadingScreen = true));

	context.eventEmitter.subscribeOnMount({
		buyBonusConfirm: () => {
			stateModal.modal = { name: 'buyBonusConfirm' };
		},
	});
</script>

<div class="game-viewport" style:background-image={`url("${fieldBackdrop}")`}>
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
		{#if !props.fixtureOnly}<ResumeBet />{/if}
		<!--
			The reason why <Sound /> is rendered after clicking the loading screen:
			"Autoplay with sound is allowed if: The user has interacted with the domain (click, tap, etc.)."
			Ref: https://developer.chrome.com/blog/autoplay
		-->
		<Sound />

		<MainContainer>
			<BoardBackdrop />
		</MainContainer>

		<MainContainer>
			<Board />
			<BoardFrame />
			<Anticipations />
		</MainContainer>



		{#if !props.fixtureOnly && stateUi.config.mode==='replay'}<UI>{#snippet gameName()}<UiGameName name="Wild Pickins"/>{/snippet}{#snippet logo()}{/snippet}</UI>{/if}
  <FreeSpinIntro />

		<FreeSpinOutro />
		<Transition />

	{/if}
	</ScatterThud>
 {#if !context.stateLayout.showLoadingScreen}{@render props.presentation?.()}{/if}
 {#if !context.stateLayout.showLoadingScreen && (props.fixtureOnly || stateUi.config.mode!=='replay')}
  <Container x={12} y={10}><UiGameName name="Wild Pickins" /></Container>
 {/if}
</App>
<WinSign />
{#if import.meta.env.DEV}<SymbolStylePanel />{/if}
<SeedCelebration />
{#if !props.fixtureOnly && stateUi.config.mode!=='replay'}<PlayerControls />{/if}
<BonusSign />
<FreeSpinCounter />

<Modals bonusModes={Object.keys(config.betModes)}>
	{#snippet version()}
		<GameVersion version="0.0.0" />
	{/snippet}
</Modals>
</div>

<style>
	/* Contain the canvas in the iframe viewport, including small mobile previews.
	   The static cover also fills any transparent pixels during resize/thud frames. */
	.game-viewport { position: fixed; inset: 0; overflow: hidden; background-color: #283e26; background-position: center; background-size: cover; }
	.game-viewport :global(canvas) { display: block; }
</style>
