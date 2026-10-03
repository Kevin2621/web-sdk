<script lang="ts" module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	const { Story } = defineMeta({ title: 'WILD_PICKINS/Selected books (template presentation)' });
</script>

<script lang="ts">
	import { onMount } from 'svelte';
	import { stateBet } from 'state-shared';
	import { StoryGameTemplate, StoryLocale } from 'components-storybook';
	import Game from '../components/Game.svelte';
	import { setContext } from '../game/context';
	import { playBet } from '../game/utils';
	import { previewBet } from '../game/selectedBook';
	import type { SelectedMode } from '../game/selectedConfig';
	import { statePresentation } from '../game/statePresentation.svelte';
	import { bonusWin } from '../game/bonusWin.svelte';
	import baseLoss from './data/selected/base-loss.json';
	import baseWin from './data/selected/base-win.json';
	import naturalBonus from './data/selected/natural-bonus-collision.json';
	import cap from './data/selected/round-cap.json';
	import low from './data/selected/buy-50.json';
	import medium from './data/selected/buy-200.json';
	import high from './data/selected/buy-500.json';
	setContext();
	let error = $state('');
	onMount(() => {
		const saved = { betAmount: stateBet.betAmount, wageredBetAmount: stateBet.wageredBetAmount };
		stateBet.betAmount = 1;
		stateBet.wageredBetAmount = 1;
		return () => Object.assign(stateBet, saved);
	});
	async function run(book: unknown, mode: SelectedMode) {
		error = '';
		try {
			await playBet(previewBet(book, mode));
		} catch (reason) {
			error = String(reason);
		}
	}
</script>

{#snippet template(args: { book: unknown; mode: SelectedMode })}
	<StoryGameTemplate skipLoadingScreen={true} action={() => run(args.book, args.mode)}>
		<StoryLocale lang="en"><Game preview /></StoryLocale>
	</StoryGameTemplate>
	<p class="notice" role={error ? 'alert' : 'status'}>
		{error ||
			statePresentation.message ||
			(bonusWin.visible ? `BONUS WIN · ${bonusWin.amount / 100}×` : '') ||
			'Selected Wild Pickins math · migrated board and symbols · no wagering. Click Action to play.'}
	</p>
{/snippet}
<Story name="Base loss" exportName="BaseLoss" args={{ book: baseLoss, mode: 'base' }} {template} />
<Story
	name="Base line win"
	exportName="BaseWin"
	args={{ book: baseWin, mode: 'base' }}
	{template}
/>
<Story
	name="Natural bonus with collision awards"
	exportName="NaturalBonusCollision"
	args={{ book: naturalBonus, mode: 'base' }}
	{template}
/>
<Story
	name="Round cap — 5000×"
	exportName="RoundCap"
	args={{ book: cap, mode: 'base' }}
	{template}
/>
<Story
	name="Standard buy — 50× — 10 spins"
	exportName="Buy50"
	args={{ book: low, mode: 'bonus' }}
	{template}
/>
<Story
	name="Standard buy — 200× — 15 spins"
	exportName="Buy200"
	args={{ book: medium, mode: 'standard_bonus_buy_medium' }}
	{template}
/>
<Story
	name="Standard buy — 500× — 20 spins"
	exportName="Buy500"
	args={{ book: high, mode: 'standard_bonus_buy_high' }}
	{template}
/>

<style>
	.notice {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		z-index: 1000;
		margin: 0;
		padding: 8px;
		background: #111e;
		color: white;
		font: 13px system-ui;
		pointer-events: none;
	}
</style>
