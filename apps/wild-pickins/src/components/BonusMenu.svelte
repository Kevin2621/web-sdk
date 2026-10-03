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
		cost = 50,
		tier,
		ontierchange,
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
		tier?: 'low' | 'medium' | 'high';
		ontierchange?: (tier: 'low' | 'medium' | 'high') => void;
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
			? [
					'Your next spin lands the bonus trigger.',
					`Then play ${initialSpins} free spins with sticky multiplier Wilds.`,
				]
			: bonusPurchaseContent.featuredDescription,
		rules: [
			`${initialSpins} free spins · Sticky multiplier Wilds · Up to 30 total spins.`,
			...bonusPurchaseContent.rules.slice(1),
			...(armsNextSpin
				? [
						`After confirmation, press Spin to play the purchased trigger round. The ${cost}× cost is counted on that spin.`,
					]
				: []),
			`Maximum available: ${maxWinX.toLocaleString('en-US', { maximumFractionDigits: 2 })}× underlying bet (${(maxWinX / cost).toFixed(2)}× purchase cost).`,
			...(rtp === undefined ? [] : [`Theoretical purchase RTP: ${(rtp * 100).toFixed(1)}%.`]),
		],
	});
</script>

<BonusPurchaseDialog
	{content}
	{label}
	{simulated}
	simulatedBalanceNote="Event preview"
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
>
	{#snippet purchaseOptions(locked: boolean)}
		{#if tier && ontierchange}
			<label class="tier-picker"
				>Bonus buy
				<select
					value={tier}
					disabled={locked}
					onchange={(event) =>
						ontierchange?.(event.currentTarget.value as 'low' | 'medium' | 'high')}
				>
					<option value="low">Low · 50× · 10 free spins</option>
					<option value="medium">Medium · 200× · 15 free spins</option>
					<option value="high">High · 500× · 20 free spins</option>
				</select>
			</label>
		{/if}
	{/snippet}
</BonusPurchaseDialog>

<style>
	.tier-picker {
		display: flex;
		flex-direction: column;
		gap: 6px;
		margin-bottom: 12px;
		font-size: 14px;
		font-weight: 700;
	}
	select {
		max-width: 100%;
		padding: 8px;
		border: 1px solid #e9bf64;
		border-radius: 8px;
		background: #142118;
		color: #fff7da;
		font: inherit;
	}
	select:focus-visible {
		outline: 2px solid #fff1b4;
		outline-offset: 2px;
	}
	select:disabled {
		opacity: 0.6;
	}
</style>
