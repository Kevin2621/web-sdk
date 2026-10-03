<script lang="ts" module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	const { Story } = defineMeta({ title: 'WILD_PICKINS/Recovery and replay' });
</script>

<script lang="ts">
	import { onMount } from 'svelte';
	import { stateBet } from 'state-shared';
	import { StoryGameTemplate, StoryLocale } from 'components-storybook';
	import Game from '../components/Game.svelte';
	import { setContext } from '../game/context';
	import { playBet } from '../game/utils';
	import { convertTorResumableBet } from '../game/resumeBook';
	import { normalizeEngineReplay } from '../game/engineReplay';
	import { previewBet } from '../game/selectedBook';
	import type { SelectedMode } from '../game/selectedConfig';
	import natural from './data/selected/natural-bonus-collision.json';
	import medium from './data/selected/buy-200.json';
	import high from './data/selected/buy-500.json';
	setContext();
	let error = $state('');
	onMount(() => {
		const saved = { betAmount: stateBet.betAmount, wageredBetAmount: stateBet.wageredBetAmount };
		stateBet.betAmount = stateBet.wageredBetAmount = 1;
		return () => Object.assign(stateBet, saved);
	});
	const collision =
		natural.events.findIndex(
			(event) => event.type === 'wildPickinsSpinResult' && event.grantedExtraSpins > 0,
		) + 1;
	const ending = medium.events.findIndex((event) => event.type === 'freeSpinEnd');
	async function run(book: unknown, mode: SelectedMode, checkpoint?: number) {
		error = '';
		try {
			const bet = previewBet(book, mode);
			if (checkpoint !== undefined)
				await playBet(convertTorResumableBet({ ...bet, event: String(checkpoint) }));
			else {
				const round = normalizeEngineReplay(
					{
						state: book,
						payoutMultiplier: bet.payoutMultiplier,
						costMultiplier: mode === 'standard_bonus_buy_high' ? 500 : 1,
					},
					mode,
				);
				await playBet({ ...bet, state: round.state });
			}
		} catch (reason) {
			error = String(reason);
		}
	}
</script>

{#snippet template(args: { book: unknown; mode: SelectedMode; checkpoint?: number })}
	<StoryGameTemplate
		skipLoadingScreen={true}
		action={() => run(args.book, args.mode, args.checkpoint)}
	>
		<StoryLocale lang="en"><Game preview /></StoryLocale>
	</StoryGameTemplate>
	<p class="notice" role={error ? 'alert' : 'status'}>
		{error ||
			'Restored locks start settled. Only events after the checkpoint play. Replay uses the same template event player.'}
	</p>
{/snippet}
<Story
	name="Resume after a Wild collision"
	exportName="ResumeCollision"
	args={{ book: natural, mode: 'base', checkpoint: collision }}
	{template}
/>
<Story
	name="Resume before the bonus ending"
	exportName="ResumeEnding"
	args={{ book: medium, mode: 'standard_bonus_buy_medium', checkpoint: ending }}
	{template}
/>
<Story
	name="Replay an Engine book envelope"
	exportName="ReplayEnvelope"
	args={{ book: high, mode: 'standard_bonus_buy_high' }}
	{template}
/>

<style>
	.notice {
		position: fixed;
		top: 8px;
		left: 8px;
		font: 12px system-ui;
		color: white;
		background: #101e18d9;
		padding: 8px;
		z-index: 11000;
		pointer-events: none;
	}
</style>
