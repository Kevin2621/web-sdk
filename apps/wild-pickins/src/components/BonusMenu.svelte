<script lang="ts">
	import { onMount } from 'svelte';
	import { SlotControlBar } from 'components-ui-html';
	import { playerMotion } from '../game/playerMotion.svelte';
	import { stateBet } from 'state-shared';
	import money from '../game/playerMoney';
	import { playerLanguage } from '../game/playerLanguage.svelte';
	let {
		label = (key: string) => key,
		simulated = false,
		cost = 100,
		levels,
		disabled = false,
		onamount,
		onclose,
		onbuy,
	}: {
		label?: (key: string) => string;
		simulated?: boolean;
		cost?: number;
		levels: number[];
		disabled?: boolean;
		onamount: (n: number) => void;
		onclose: () => void;
		onbuy: () => void;
	} = $props();
	let dialog: HTMLDialogElement;
	let confirming = $state(false);
	const price = $derived(stateBet.betAmount * cost);
	const affordable = $derived(simulated || stateBet.balanceAmount >= price);
	const format = (n: number) => money.formatMoney(n, stateBet.currency, playerLanguage()).text;
	const planned = [
		{ name: 'Bonus Hunt', image: 'S', description: 'More chances to reach free spins.' },
		{ name: 'Golden Pick Boost', image: 'H1', description: 'More chances for a Golden Pick.' },
		{ name: 'Bumper Crop Buy', image: 'W', description: 'A stronger start to your bonus.' },
		{ name: 'Harvest or Bust', image: 'H3', description: 'Fill the board. Take the prize.' },
	];
	onMount(() => {
		const stopHotkey = (event: KeyboardEvent) => event.stopPropagation();
		dialog.addEventListener('keydown', stopHotkey);
		dialog.addEventListener('keyup', stopHotkey);
		dialog.showModal();
		return () => {
			dialog.removeEventListener('keydown', stopHotkey);
			dialog.removeEventListener('keyup', stopHotkey);
			dialog.close();
		};
	});
	function close() {
		dialog.close();
		onclose();
	}
	function purchase() {
		if (disabled || !affordable) return;
		if (!confirming) {
			confirming = true;
			return;
		}
		onbuy();
	}
</script>

<dialog
	bind:this={dialog}
	class="bonus-menu"
	aria-labelledby="bonus-menu-title"
	oncancel={(e) => {
		e.preventDefault();
		close();
	}}
>
	<header>
		<span class="eyebrow">WILD PICKINS</span>
		<h1 id="bonus-menu-title">Pick your bonus</h1>
		<p>A little shortcut to the good stuff.</p>
	</header>
	<button class="close" aria-label="Close bonus menu" onclick={close}>×</button>
	<main>
		<article class="feature available">
			<div class="art">
				<span class="tag">THE ORIGINAL</span><img src="/assets/art-refresh/S.png" alt="" /><span
					class="spin-badge">10 <small>FREE SPINS</small></span
				>
			</div>
			<div class="details">
				<h2>Standard Bonus Buy</h2>
				<p>Jump straight into free spins.<br />Collect sticky multiplier Wilds.</p>
				<strong class="price">{format(price)}</strong><span class="cost">{cost}× your bet</span>
				<button class="buy" disabled={disabled || !affordable} onclick={purchase}
					>{!affordable
						? 'Insufficient balance'
						: confirming
							? `Confirm ${format(price)}`
							: 'Buy bonus'}</button
				>
				{#if confirming}<button class="back" onclick={() => (confirming = false)}
						>Cancel purchase</button
					>{/if}
			</div>
		</article>
		{#each planned as feature}<article class="feature planned">
				<div class="art">
					<span class="tag">COMING LATER</span><img
						src={`/assets/art-refresh/${feature.image}.png`}
						alt=""
					/>
				</div>
				<div class="details">
					<h2>{feature.name}</h2>
					<p>{feature.description}</p>
					<button disabled>Coming soon</button>
				</div>
			</article>{/each}
	</main>
	<p class="rules">
		10 free spins · Sticky multiplier Wilds · Up to 30 total spins.<br />Full boards keep paying.
		Play ends when spins expire or wins reach 5,000× your bet.
	</p>
	<footer>
		<SlotControlBar
			variant="bonus"
			balance={simulated ? undefined : stateBet.balanceAmount}
			balanceNote={simulated ? 'Simulated play' : ''}
			amount={stateBet.betAmount}
			amounts={levels}
			disabled={disabled || confirming}
			{label}
			formatAmount={format}
			onamountchange={onamount}
			reducedMotion={playerMotion.uiReduced}
		/>
	</footer>
	{#if simulated}<small class="practice">Practice play · no money is charged</small>{/if}
</dialog>

<style>
	.bonus-menu {
		position: fixed;
		inset: 0;
		box-sizing: border-box;
		width: 100vw;
		height: 100dvh;
		max-width: none;
		max-height: none;
		margin: 0;
		border: 0;
		padding: 24px 30px 16px;
		color: #fff7da;
		background:
			radial-gradient(ellipse at 50% 10%, #34482af2, #101e18fa 75%),
			url('/assets/art-refresh/environment-v3.png') center/cover;
		font-family: Arial, sans-serif;
		overflow: hidden;
		text-align: center;
	}
	.bonus-menu::backdrop {
		background: #101e18;
	}
	.bonus-menu[open] {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 14px;
	}
	header .eyebrow {
		font-size: 11px;
		letter-spacing: 4px;
		color: #e9bf64;
		font-weight: 800;
	}
	h1 {
		font-family: 'Luckiest Guy', Georgia, serif;
		font-size: clamp(25px, 3.3vw, 42px);
		margin: 5px 0;
		color: #fff1b4;
		text-shadow: 0 3px #142118;
	}
	header p {
		margin: 0;
		font-size: 13px;
		color: #c1cbb6;
	}
	.close {
		position: fixed;
		right: 22px;
		top: 18px;
		width: 48px;
		height: 48px;
		border: 1px solid #a2a481;
		border-radius: 12px;
		background: #16271d;
		color: #fff;
		font-size: 38px;
		cursor: pointer;
		z-index: 2;
	}
	main {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 16px;
		width: min(100%, 1000px);
		margin: auto 0;
	}
	.feature {
		width: calc((100% - 48px) / 3);
		max-width: 285px;
		border: 1px solid #6e8062;
		border-radius: 16px;
		overflow: hidden;
		background: linear-gradient(#344c2e, #17291e);
		box-shadow: 0 7px 18px #0007;
		display: flex;
		flex-direction: column;
	}
	.available {
		border: 2px solid #e8c377;
		box-shadow:
			0 0 26px #f2c04a19,
			0 7px 18px #0008;
	}
	.art {
		height: clamp(90px, 16vh, 165px);
		position: relative;
		display: flex;
		justify-content: center;
		align-items: center;
		background: radial-gradient(ellipse at bottom, #8caa44, #294831 75%);
		overflow: hidden;
	}
	.art img {
		height: 94%;
		width: 70%;
		object-fit: contain;
		filter: drop-shadow(0 5px 5px #0006);
	}
	.tag {
		position: absolute;
		left: 10px;
		top: 10px;
		font-size: 9px;
		font-weight: 800;
		letter-spacing: 1px;
		z-index: 1;
		background: #172c20dd;
		padding: 5px 7px;
		border-radius: 4px;
		color: #e5d39e;
	}
	.spin-badge {
		position: absolute;
		right: 12px;
		bottom: 10px;
		background: #f7d579;
		color: #293a21;
		font-size: 28px;
		font-weight: 900;
		border-radius: 50%;
		width: 65px;
		height: 65px;
		display: flex;
		flex-direction: column;
		justify-content: center;
		box-shadow: 0 3px 8px #0006;
	}
	.spin-badge small {
		font-size: 9px;
	}
	.details {
		padding: 12px 14px;
		display: flex;
		align-items: center;
		flex-direction: column;
		flex: 1;
	}
	h2 {
		font-family: Georgia, serif;
		font-size: clamp(16px, 1.6vw, 21px);
		margin: 0 0 7px;
		color: #fff1c5;
	}
	.details p {
		font-size: 12px;
		line-height: 1.45;
		margin: 0 0 10px;
		color: #d0d9c3;
	}
	.price {
		font-size: 27px;
		line-height: 1.2;
	}
	.cost {
		font-size: 10px;
		color: #bac5ae;
		margin: 3px 0 9px;
	}
	.details button {
		width: 100%;
		padding: 10px;
		border: 1px solid #81916b;
		background: #344331;
		color: #b4c0a6;
		border-radius: 8px;
		font-weight: 800;
		font-size: 14px;
		margin-top: auto;
	}
	.details .buy {
		background: linear-gradient(#f9de88, #d7a345);
		border-color: #fff0ae;
		color: #263319;
		box-shadow: 0 3px #8b682b;
		cursor: pointer;
		text-transform: uppercase;
	}
	.details .buy:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	.details .back {
		background: none;
		border: 0;
		color: #e5d6b2;
		font-size: 11px;
		margin: 7px 0 -7px;
		padding: 5px;
	}
	.planned .art {
		filter: saturate(0.6);
		height: clamp(85px, 14vh, 135px);
	}
	.planned .art img {
		opacity: 0.75;
	}
	.planned {
		max-width: 270px;
	}
	.rules {
		font-size: 11px;
		line-height: 1.5;
		color: #bac6b0;
		margin: 0;
		max-width: 850px;
	}
	footer {
		width: min(960px, 100%);
		min-width: 0;
	}
	.practice {
		font-size: 10px;
		color: #a4b699;
		margin-top: -7px;
	}
	button:focus-visible {
		outline: 3px solid #fff3b7;
		outline-offset: 3px;
	}
	/* Viewport rows reserve room for controls; only the artwork flexes to fit. */
	.bonus-menu {
		padding: clamp(8px, 2vh, 22px) clamp(12px, 2vw, 30px);
		overflow: hidden;
		overscroll-behavior: none;
	}
	.bonus-menu[open] {
		display: grid;
		grid-template-rows: auto minmax(0, 1fr) auto auto auto;
		justify-items: center;
		gap: clamp(6px, 1.3vh, 14px);
	}
	header {
		min-height: 0;
	}
	main {
		align-self: stretch;
		min-height: 0;
		width: min(100%, 1000px);
		margin: 0;
		display: grid;
		grid-template-columns: repeat(6, minmax(0, 1fr));
		grid-template-rows: repeat(2, minmax(0, 1fr));
		gap: clamp(8px, 1.5vh, 16px);
	}
	.feature,
	.planned {
		width: auto;
		max-width: none;
		min-height: 0;
		grid-column: span 2;
		display: grid;
		grid-template-rows: minmax(0, 1fr) auto;
	}
	.feature:nth-child(4) {
		grid-column: 2 / span 2;
	}
	.art,
	.planned .art {
		min-height: 0;
		height: auto;
	}
	.details {
		min-height: 0;
		padding: clamp(6px, 1vh, 12px) 12px;
	}
	h2 {
		margin-bottom: 4px;
	}
	.details p {
		margin-bottom: 5px;
	}
	.details button {
		padding: 8px;
	}
	.details .back {
		margin: 4px 0 0;
		padding: 2px;
	}
	.price {
		font-size: clamp(20px, 3vh, 27px);
	}
	.cost {
		margin: 2px 0 5px;
	}
	.rules {
		font-size: clamp(9px, 1.3vh, 11px);
	}
	.practice {
		margin: 0;
	}
	@media (max-height: 760px) {
		header p,
		header .eyebrow {
			display: none;
		}
		h1 {
			font-size: 26px;
			margin: 0;
		}
		.details p {
			display: none;
		}
		.spin-badge {
			width: 46px;
			height: 46px;
			font-size: 22px;
			right: 6px;
			bottom: 6px;
		}
		.spin-badge small {
			font-size: 7px;
		}
		.tag {
			top: 5px;
			left: 5px;
			padding: 3px 5px;
			font-size: 8px;
		}
	}
	@media (max-width: 620px) {
		.close {
			width: 34px;
			height: 34px;
			right: 10px;
			top: 8px;
			font-size: 28px;
		}
		header {
			padding: 0 34px;
		}
		h1 {
			font-size: 24px;
		}
		header p,
		header .eyebrow {
			display: none;
		}
		main {
			grid-template-columns: repeat(2, minmax(0, 1fr));
			grid-template-rows: 1.25fr 1fr 1fr;
			gap: 8px;
		}
		.feature,
		.feature:nth-child(4) {
			grid-column: auto;
		}
		.available {
			grid-column: 1 / -1;
			grid-template-columns: 40% 60%;
			grid-template-rows: minmax(0, 1fr);
		}
		.available .details {
			justify-content: center;
		}
		.details button {
			margin-top: 4px;
		}
		.details {
			padding: 6px 8px;
		}
		h2 {
			font-size: 15px;
		}
		.details p {
			display: none;
		}
		.rules br {
			display: none;
		}
	}
	@media (max-width: 620px) and (max-height: 600px) {
		main { grid-template-rows: 1.6fr 1fr 1fr; }
	}
	@media (max-height: 500px) and (min-width: 621px) {
		main {
			width: 100%;
			grid-template-columns: repeat(5, minmax(0, 1fr));
			grid-template-rows: minmax(0, 1fr);
		}
		.feature,
		.feature:nth-child(4) {
			grid-column: auto;
		}
		h2 {
			font-size: 14px;
		}
		.details {
			padding: 6px;
		}
		.details button {
			font-size: 12px;
			padding: 7px 3px;
		}
		.rules br {
			display: none;
		}
		.rules {
			max-width: none;
		}
	}
</style>
