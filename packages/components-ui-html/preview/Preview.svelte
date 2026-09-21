<script>
	import { onDestroy } from 'svelte';
	import SlotControlBar from '../src/components/SlotControlBar.svelte';
	let amount = $state(1), speed = $state(1), auto = $state(false), spinning = $state(false), win = $state(12.5);
	let panel = $state(''), round = 0, timer;
	function spin() {
		if (spinning) return;
		spinning = true; win = 0;
		timer = setTimeout(() => {
			spinning = false;
			win = ++round % 3 === 0 ? 0 : amount * 12.5;
			if (auto) timer = setTimeout(spin, 800);
		}, 1500 / speed);
	}
	function toggleAuto(enabled) {
		auto = enabled;
		if (enabled) spin();
		else if (!spinning) clearTimeout(timer);
	}
	onDestroy(() => clearTimeout(timer));
</script>

<svelte:head><meta name="description" content="Reusable grayscale slot game controls"/></svelte:head>
<main>
	<header><span>CONTROL BAR</span><span>Interactive preview</span></header>
	<div class="stage">
		<SlotControlBar balance={49318.2} bind:amount bind:speed bind:auto {win} {spinning} onspin={() => auto ? toggleAuto(false) : spin()} onautochange={toggleAuto} onmenu={() => panel = 'Menu'} onbonus={() => panel = 'Bonus'} />
	</div>
	<footer>Sample rounds only · No real wagers</footer>
</main>
{#if panel}
	<div class="shade"><section role="dialog" aria-modal="true" aria-label={panel} tabindex="-1"><h2>{panel}</h2><p>{panel === 'Bonus' ? 'Your game’s bonus selection opens here.' : 'Your game’s settings and help open here.'}</p><button onclick={() => panel = ''}>Close</button></section></div>
{/if}

<style>
	:global(body){margin:0;background:#858585;color:#eee;font-family:Arial,Helvetica,sans-serif}
	:global(body)::before{content:'';position:fixed;inset:0;background:radial-gradient(ellipse at 50% 30%,#a0a0a0,transparent 70%);pointer-events:none}
	main{position:relative;min-height:100svh;display:flex;flex-direction:column;padding:32px 4vw;box-sizing:border-box}header{display:flex;justify-content:space-between;gap:16px;font-size:12px;letter-spacing:.16em;color:#ededed}header span:last-child{letter-spacing:0;color:#ddd}.stage{display:flex;align-items:center;flex:1;width:100%;max-width:1400px;margin:auto;padding:120px 0}footer{text-align:center;font-size:12px;color:#e3e3e3}.shade{position:fixed;inset:0;background:#0007;display:grid;place-items:center;padding:24px}section{background:#303030;padding:28px;border-radius:20px;max-width:320px}h2{margin:0}p{line-height:1.5;color:#ddd}section button{background:#ddd;border:0;border-radius:8px;padding:12px 24px;font:inherit;cursor:pointer}
	@media(max-width:700px){main{padding:24px 12px}.stage{padding:100px 0}}
</style>
