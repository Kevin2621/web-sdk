<script lang="ts" module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	const { Story } = defineMeta({ title: 'WILD_PICKINS/Controls and preferences' });
</script>

<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { stateBet, stateConfig, stateModal } from 'state-shared';
	import { StoryGameTemplate, StoryLocale } from 'components-storybook';
	import Game from '../components/Game.svelte';
	import PlayerControls from '../components/PlayerControls.svelte';
	import { setContext } from '../game/context';
	import { playBet, cancelPlayBet } from '../game/utils';
	import { previewBet } from '../game/selectedBook';
	import type { SelectedMode } from '../game/selectedConfig';
	import base from './data/selected/base-win.json';
	import low from './data/selected/buy-50.json';
	import medium from './data/selected/buy-200.json';
	import high from './data/selected/buy-500.json';
	setContext();
	let busy = $state(false),
		error = $state('');
	const books = {
		base,
		bonus: low,
		standard_bonus_buy_medium: medium,
		standard_bonus_buy_high: high,
	};
	onMount(() => {
		const saved = {
			betAmount: stateBet.betAmount,
			wageredBetAmount: stateBet.wageredBetAmount,
			activeBetModeKey: stateBet.activeBetModeKey,
		};
		const amounts = stateConfig.betAmountOptions;
		stateBet.betAmount = 1;
		stateBet.wageredBetAmount = 1;
		stateConfig.betAmountOptions = [0.1, 0.2, 0.5, 1, 2, 5, 10];
		return () => {
			Object.assign(stateBet, saved);
			stateConfig.betAmountOptions = amounts;
			stateModal.modal = null;
		};
	});
	onDestroy(cancelPlayBet);
	async function play(mode: SelectedMode) {
		if (busy) return;
		busy = true;
		error = '';
		stateBet.activeBetModeKey = mode;
		stateBet.wageredBetAmount = stateBet.betAmount;
		try {
			await playBet(previewBet(books[mode], mode));
		} catch (reason) {
			error = String(reason);
		} finally {
			busy = false;
		}
	}
</script>

{#snippet template(args: { locked?: boolean })}
	<StoryGameTemplate skipLoadingScreen={true} action={() => play('base')}>
		<StoryLocale lang="en"
			><Game preview />
			<PlayerControls
				preview
				busy={busy || !!args.locked}
				onspin={() => play('base')}
				onbuy={play}
			/>
		</StoryLocale>
	</StoryGameTemplate>
	<p class="notice" role={error ? 'alert' : 'status'}>
		{error ||
			'Event previews: Spin plays the selected base win; Bonus previews the selected 50×, 200×, or 500× book. Settings and autoplay setup are inspectable; no wallet or automatic local play.'}
	</p>
{/snippet}
<Story
	name="Controls, settings and bonus selection"
	exportName="Controls"
	args={{ locked: false }}
	{template}
/>
<Story
	name="Controls while a round is playing"
	exportName="BusyControls"
	args={{ locked: true }}
	{template}
/>

<style>
	.notice {
		position: fixed;
		top: 8px;
		left: 8px;
		max-width: 600px;
		font: 12px system-ui;
		color: white;
		background: #101e18d9;
		padding: 8px;
		border-radius: 6px;
		z-index: 11000;
		pointer-events: none;
	}
</style>
