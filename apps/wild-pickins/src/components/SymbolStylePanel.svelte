<script lang="ts">
	import { onMount } from 'svelte';
	import { PreviewCanvas, Container } from 'pixi-svelte';
	import Symbol from './Symbol.svelte';
	import type { SymbolState } from '../game/types';
	const highPreviews = ['H1', 'H2', 'H3'] as const;
	let previewState = $state<SymbolState>('static');
	let animationId = $state(0);
	import { symbolStyle, symbolFonts, symbolStyleDefaults } from '../game/symbolStyle.svelte';
	let open = $state(false);
	let ready = $state(false);
	onMount(() => {
		try {
			const wooden = localStorage.getItem('wp-symbol-style-luckiest-v3');
			const upright = wooden || localStorage.getItem('wp-symbol-style-luckiest-v2');
			const current = upright || localStorage.getItem('wp-symbol-style-luckiest-v1');
			const previous = localStorage.getItem('wp-symbol-style-patua-v3');
			const saved = JSON.parse(
				current || previous || localStorage.getItem('wp-symbol-style-patua-v2') || 'null',
			);
			// Apply the new dimensional treatment once, preserving other workshop choices.
			if (saved && !current && !previous) {
				saved.depth = symbolStyleDefaults.depth;
				saved.tilt = symbolStyleDefaults.tilt;
				saved.shadowStrength = symbolStyleDefaults.shadowStrength;
				saved.shadowSoftness = symbolStyleDefaults.shadowSoftness;
			}
			if (saved && !current) {
				saved.font = 'luckiest';
				saved.generated = false;
			}
			if (saved && !upright) saved.tilt = symbolStyleDefaults.tilt;
			if (saved && !wooden) saved.edge = symbolStyleDefaults.edge;
			if (saved) {
				if (typeof saved.generated === 'boolean') symbolStyle.generated = saved.generated;
				if (typeof saved.multicolor === 'boolean') symbolStyle.multicolor = saved.multicolor;
				if (Object.hasOwn(symbolFonts, saved.font)) symbolStyle.font = saved.font;
				if (/^#[0-9a-f]{6}$/i.test(saved.color)) symbolStyle.color = saved.color;
				if (Number.isFinite(saved.edge)) symbolStyle.edge = Math.max(2, Math.min(14, saved.edge));
				if (Number.isFinite(saved.depth))
					symbolStyle.depth = Math.max(0, Math.min(12, saved.depth));
				if (Number.isFinite(saved.tilt)) symbolStyle.tilt = Math.max(-12, Math.min(12, saved.tilt));
				if (Number.isFinite(saved.shadowStrength))
					symbolStyle.shadowStrength = Math.max(0, Math.min(100, saved.shadowStrength));
				if (Number.isFinite(saved.shadowSoftness))
					symbolStyle.shadowSoftness = Math.max(0, Math.min(16, saved.shadowSoftness));
			}
		} catch {}
		ready = true;
	});
	$effect(() => {
		const settings = JSON.stringify(symbolStyle);
		if (ready)
			try {
				localStorage.setItem('wp-symbol-style-luckiest-v3', settings);
			} catch {}
	});
</script>

<div class="workshop">
	<button onclick={() => (open = !open)} aria-expanded={open}
		>Symbol style {open ? '−' : '+'}</button
	>
	{#if open}
		<div class="panel">
			<h3>High symbols</h3>
			<div class="high-previews">
				<PreviewCanvas width={280} height={280} label="High symbols: wheat, corn and tomatoes">
					{#key animationId}
						{#each highPreviews as name, index}
							<Container x={70 + (index % 2) * 140} y={70 + Math.floor(index / 2) * 140}>
								<Symbol rawSymbol={{ name }} state={previewState} />
							</Container>
						{/each}
					{/key}
				</PreviewCanvas>
			</div>
			<label
				>Preview animation
				<select bind:value={previewState}>
					<option value="static">Still</option>
					<option value="spin">Spinning</option>
					<option value="win">Win</option>
				</select>
			</label>
			{#if previewState === 'win'}<button onclick={() => animationId++}>Replay win</button>{/if}
			<label
				><input type="checkbox" bind:checked={symbolStyle.livePreview} /> Edit live letter artwork</label
			>
			{#if !symbolStyle.livePreview}
				<p>Showing baked letter images. Enable live editing to audition style changes.</p>
			{:else}
				<label
					><input type="checkbox" bind:checked={symbolStyle.generated} /> Generated artwork</label
				>
				{#if !symbolStyle.generated}
					<label
						>Font<select bind:value={symbolStyle.font}
							><option value="luckiest">Luckiest Guy</option><option value="patua">Patua One</option
							><option value="rounded">Rounded</option><option value="heavy">Heavy</option><option
								value="serif">Classic</option
							><option value="slab">Slab</option></select
						></label
					>
					<label
						><input type="checkbox" bind:checked={symbolStyle.multicolor} /> Original multicolor palette</label
					>
					{#if !symbolStyle.multicolor}<label
							>Paint<input type="color" bind:value={symbolStyle.color} /></label
						>{/if}
					<label
						>Wood rim · {symbolStyle.edge}<input
							type="range"
							min="2"
							max="14"
							bind:value={symbolStyle.edge}
						/></label
					>
					<label
						>Depth · {symbolStyle.depth}<input
							type="range"
							min="0"
							max="12"
							bind:value={symbolStyle.depth}
						/></label
					>
				{:else}
					<p>Original multicolor paint and carved depth are part of the artwork.</p>
				{/if}
				<label
					>Tilt · {symbolStyle.tilt}°<input
						type="range"
						min="-12"
						max="12"
						step="1"
						bind:value={symbolStyle.tilt}
					/></label
				>
				<label
					>Shadow strength · {symbolStyle.shadowStrength}%<input
						type="range"
						min="0"
						max="100"
						step="1"
						bind:value={symbolStyle.shadowStrength}
					/></label
				>
				<label
					>Shadow softness · {symbolStyle.shadowSoftness}<input
						type="range"
						min="0"
						max="16"
						step="1"
						bind:value={symbolStyle.shadowSoftness}
					/></label
				>
				<p>
					Positive tilt leans right. Set softness to 0 for a hard shadow, or strength to 0 for none.
				</p>
				<button onclick={() => Object.assign(symbolStyle, symbolStyleDefaults)}>Reset</button>
			{/if}
		</div>
	{/if}
</div>

<style>
	.high-previews {
		margin-bottom: 20px;
	}
	.workshop {
		position: fixed;
		right: 12px;
		top: 12px;
		z-index: 1000;
		font: 13px system-ui;
		color: #fff;
		max-height: calc(100dvh - 24px);
		overflow: auto;
	}
	button,
	select {
		font: inherit;
		color: inherit;
		background: #253829;
		border: 1px solid #8b986c;
		border-radius: 8px;
		padding: 9px;
		cursor: pointer;
	}
	.workshop > button {
		display: block;
		margin-left: auto;
	}
	.panel {
		width: 220px;
		margin-top: 6px;
		padding: 16px;
		background: #18271ff5;
		border: 1px solid #788665;
		border-radius: 12px;
		box-shadow: 0 4px 20px #0006;
	}
	p {
		font-size: 12px;
		line-height: 1.5;
		color: #cad5c6;
	}
	label {
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;
		gap: 8px;
		margin-bottom: 14px;
	}
	input[type='range'] {
		width: 100%;
		accent-color: #b8d0e4;
	}
	input[type='color'] {
		width: 50px;
		height: 32px;
		border: 0;
		background: none;
	}
	select {
		max-width: 140px;
	}
	:is(button, select, input):focus-visible {
		outline: 2px solid #f7d16b;
		outline-offset: 2px;
	}
</style>
