<script lang="ts">
	import * as PIXI from 'pixi.js';
	import { onMount, type Snippet } from 'svelte';
	import { createContextParent, getContextApp } from '../context.svelte';

	let {
		width,
		height,
		label,
		children,
	}: {
		width: number;
		height: number;
		label: string;
		children: Snippet;
	} = $props();
	const context = getContextApp();
	const root = new PIXI.Container();
	createContextParent(root);
	let host: HTMLDivElement;
	let ready = $state(false);
 let renderer = $state<PIXI.Application['renderer']>();
 $effect(() => { renderer?.resize(width, height); });
	let error = $state(false);

	// Share the game's asset context, never reset its loader or application.
	// Only this small renderer and its display objects belong to the preview.
	onMount(() => {
		const app = new PIXI.Application();
		let disposed = false;
		let initialized = false;
		const destroy = () => app.destroy({ removeView: true }, { children: false });
		void app
			.init({
				width,
				height,
				backgroundAlpha: 0,
				antialias: true,
				autoDensity: true,
				resolution: Math.min(window.devicePixelRatio || 1, 2),
				preference: 'webgl',
			})
			.then(() => {
				initialized = true;
    if (!disposed) renderer = app.renderer;
				if (disposed) {
					destroy();
					return;
				}
				app.stage.addChild(root);
				Object.assign(app.canvas.style, { display: 'block', width: '100%', height: 'auto' });
				host.appendChild(app.canvas);
				ready = true;
			})
			.catch((reason) => {
				console.error('Unable to initialize symbol preview', reason);
				if (!disposed) error = true;
			});
		return () => {
			disposed = true;
			if (initialized) destroy();
			root.destroy({ children: false });
		};
	});
</script>

<div bind:this={host} role="img" aria-label={label} style:width="100%" style:aspect-ratio={`${width} / ${height}`}>
	{#if error}<span>Preview unavailable</span>
	{:else if ready && context.stateApp.loaded}{@render children()}
	{:else}<span>Loading symbols…</span>{/if}
</div>
