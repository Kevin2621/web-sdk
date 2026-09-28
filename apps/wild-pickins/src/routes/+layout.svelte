<script lang="ts">
	import { type Snippet } from 'svelte';
	import { base } from '$app/paths';
	import { GlobalStyle } from 'components-ui-html';
	import { Authenticate, LoadI18n } from 'components-shared';
	import Game from '../components/Game.svelte';
	import Replay from '../components/Replay.svelte';
	import { stateModal, stateUrlDerived } from 'state-shared';
	import { getContext, setContext } from '../game/context';

	import messagesMap from '../i18n/messagesMap';

	type Props = { children: Snippet };

	const props: Props = $props();

	setContext();
	const context = getContext();
	const replayLaunch = stateUrlDerived.replay();
</script>

<GlobalStyle>
	{#if replayLaunch}
		<LoadI18n {messagesMap}><Replay /></LoadI18n>
	{:else}
	<Authenticate>
		<LoadI18n {messagesMap}>
			<Game />
		</LoadI18n>
	</Authenticate>
	{/if}
</GlobalStyle>

{#if !replayLaunch && !context.stateApp.loaded}
	<div class="boot-screen" role="status" aria-live="polite">
		<div class="boot-brand">WILD <span>HARVEST</span></div>
		{#if stateModal.modal?.name === 'error'}
			<div class="boot-label" role="alert">THE FIELDS COULD NOT LOAD</div>
			<button class="boot-retry" onclick={() => location.reload()}>TRY AGAIN</button>
		{:else}
			<div class="boot-label">PREPARING THE FIELDS…</div>
			<div class="boot-track" aria-hidden="true"><span></span></div>
		{/if}
	</div>
{/if}

{@render props.children()}

<style>
	@font-face{font-family:PickinsBoot;src:url('/assets/fonts/luckiest-guy/Luckiest-Guy.ttf') format('truetype');font-display:swap}
	.boot-screen{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:22px;background:linear-gradient(#17362cab,#17362cd9),url('/assets/art-refresh/environment-v3.png') center/cover,#25483b;color:#fff0b4;text-align:center}
	.boot-brand{font:clamp(54px,9vw,108px)/.95 PickinsBoot,Georgia,serif;color:#dcf36c;-webkit-text-stroke:2px #543318;text-shadow:0 4px 0 #b77832,0 8px 0 #49301b,0 13px 20px #101c16}
	.boot-brand span{color:#ffd669}
	.boot-label{font:800 13px system-ui,sans-serif;letter-spacing:.22em;text-shadow:0 2px 4px #1a2e23}
	.boot-track{width:min(220px,60vw);height:5px;overflow:hidden;border-radius:10px;background:#10251d;box-shadow:0 0 0 1px #ffe6a37a}
	.boot-track span{display:block;width:34%;height:100%;background:linear-gradient(90deg,#d7ee79,#ffe598);animation:boot-sweep 1.4s ease-in-out infinite}
	.boot-retry{min-width:180px;min-height:52px;border:2px solid #fff2b7;border-radius:12px;background:linear-gradient(#ffe698,#d69338);color:#39230f;font:26px PickinsBoot,Georgia,serif;cursor:pointer}
	.boot-retry:focus-visible{outline:4px solid #fff;outline-offset:4px}
	@keyframes boot-sweep{from{transform:translateX(-110%)}to{transform:translateX(400%)}}
	@media(prefers-reduced-motion:reduce){.boot-track span{animation:none;width:100%;opacity:.55}}
</style>
