<script lang="ts">
	import * as PIXI from 'pixi.js';
	import { onMount, onDestroy, type Snippet } from 'svelte';
	import { devicePixelRatio } from 'svelte/reactivity/window';

	import { getContextApp } from '../context.svelte';
	import { preloadFont } from '../utils.svelte';

	type Props = { children: Snippet; preloadTemplateFont?: boolean };

	const props: Props = $props();
	const context = getContextApp();

	let wrap: HTMLDivElement;
	let initialised = $state(false);
	let destroyed = false;
	let application: PIXI.Application<PIXI.Renderer<HTMLCanvasElement>> | undefined;

	const initialiseApplication = async () => {
		PIXI.Assets.reset();

		if (props.preloadTemplateFont !== false) await preloadFont();
		if (destroyed) return;
		const current = new PIXI.Application<PIXI.Renderer<HTMLCanvasElement>>();
		application = current;
		await current.init({
			autoDensity: true,
			backgroundAlpha: 0,
			hello: true,
			multiView: false,
			antialias: true,
			clearBeforeRender: true,
			preference: 'webgpu',
			powerPreference: 'high-performance',
			resolution: devicePixelRatio.current,
			resizeTo: window,
		});

		if (destroyed) {
			current.destroy();
			application = undefined;
			return;
		}
		context.stateApp.pixiApplication = current;
		wrap.appendChild(current.canvas);

		// to prevent that you can't scroll the page with touch on the canvas. https://github.com/pixijs/pixijs/issues/4824
		current.renderer.events.autoPreventDefault = false;
		current.renderer.canvas.style.touchAction = 'auto';
	};

	onMount(async () => {
		try {
			if (!initialised) await initialiseApplication();
			if (!destroyed) initialised = true;
		} catch (error) {
			console.error(error);
		}
	});

	onDestroy(() => {
		destroyed = true;
		if (initialised && application) {
			application.destroy();
			if (context.stateApp.pixiApplication === application)
				context.stateApp.pixiApplication = undefined;
			application = undefined;
		}
	});
</script>

<div bind:this={wrap}>
	{#if initialised}
		{@render props.children()}
	{/if}
</div>
