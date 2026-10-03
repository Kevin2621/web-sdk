<script lang="ts">
	import { stateBet, stateUrlDerived } from 'state-shared';
	import { normalizeEngineReplay } from '../game/engineReplay';
	import { type Snippet } from 'svelte';
	import { base } from '$app/paths';
	import { API_AMOUNT_MULTIPLIER } from 'constants-shared/bet';
	import { GlobalStyle } from 'components-ui-html';
	import { Authenticate, LoaderStakeEngine, LoadI18n } from 'components-shared';
	import Game from '../components/Game.svelte';
	import { setContext } from '../game/context';

	import messagesMap from '../i18n/messagesMap';

	type Props = { children: Snippet };

	const props: Props = $props();

	function prepareReplayRound(data: unknown) {
		const round = normalizeEngineReplay(data, stateUrlDerived.mode());
		const params = new URLSearchParams(window.location.search);
		const amount = params.get('amount');
		if (
			amount !== null &&
			(!/^\d+$/.test(amount) || !Number.isSafeInteger(Number(amount)) || Number(amount) <= 0)
		)
			throw new Error('Invalid replay amount');
		stateBet.betAmount = amount === null ? 1 : Number(amount) / API_AMOUNT_MULTIPLIER;
		stateBet.wageredBetAmount = stateBet.betAmount;
		stateBet.currency = params.get('currency') || 'USD';
		return round;
	}

	const loaderUrlStakeEngine = `${base}/stake-engine-loader.gif`;

	setContext();
</script>

<GlobalStyle>
	<Authenticate normalizeReplayRound={prepareReplayRound}>
		<LoadI18n {messagesMap}>
			<Game />
		</LoadI18n>
	</Authenticate>
</GlobalStyle>

<LoaderStakeEngine src={loaderUrlStakeEngine} />

{@render props.children()}
