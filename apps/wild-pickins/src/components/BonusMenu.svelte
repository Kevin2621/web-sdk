<script lang="ts">
	import { BonusPurchaseDialog } from 'components-ui-html';
	import { bonusPurchaseContent } from './bonusPurchaseContent';
	import { playerMotion } from '../game/playerMotion.svelte';
	import { stateBet } from 'state-shared';
	import money from '../game/playerMoney';
	import { playerLanguage } from '../game/playerLanguage.svelte';
	let {
		label = (key: string) => key,
		simulated = false,
		cost = 100,
		rtp,
		maxWinX = 5000,
		initialSpins = 10,
		purchaseTitle = 'Standard Bonus Buy',
		armsNextSpin = false,
		levels,
		disabled = false,
		onamount,
		onclose,
		onbuy,
	}: {
		label?: (key: string) => string;
		simulated?: boolean;
		cost?: number;
		rtp?: number;
		maxWinX?: number;
		initialSpins?: number;
		purchaseTitle?: string;
		armsNextSpin?: boolean;
		levels: number[];
		disabled?: boolean;
		onamount: (n: number) => void;
		onclose: () => void;
		onbuy: () => void;
	} = $props();
	const format = (n: number) => money.formatMoney(n, stateBet.currency, playerLanguage()).text;
	const content = $derived({
		...bonusPurchaseContent,
		featuredBadge: String(initialSpins),
		featuredTitle: purchaseTitle,
		purchaseLabel: armsNextSpin ? 'Arm next spin' : bonusPurchaseContent.purchaseLabel,
		featuredDescription: armsNextSpin
			? ['Your next spin lands the bonus trigger.', `Then play ${initialSpins} free spins with sticky multiplier Wilds.`]
			: bonusPurchaseContent.featuredDescription,
		rules: [
			`${initialSpins} free spins · Sticky multiplier Wilds · Up to 30 total spins.`,
			...bonusPurchaseContent.rules.slice(1),
			...(armsNextSpin ? [`After confirmation, press Spin to play the purchased trigger round. The ${cost}× cost is counted on that spin.`] : []),
			`Maximum available: ${maxWinX.toLocaleString('en-US', { maximumFractionDigits: 2 })}× underlying bet (${(maxWinX / cost).toFixed(2)}× purchase cost).`,
			...(rtp === undefined ? [] : [`Theoretical purchase RTP: ${(rtp * 100).toFixed(1)}%.`]),
		],
	});
</script>

<BonusPurchaseDialog
	{content}
	{label}
	{simulated}
	{cost}
	{levels}
	{disabled}
	amount={stateBet.betAmount}
	balance={stateBet.balanceAmount}
	reducedMotion={playerMotion.uiReduced}
	{format}
	{onamount}
	{onclose}
	{onbuy}
/>
