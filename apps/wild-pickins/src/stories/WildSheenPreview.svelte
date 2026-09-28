<script lang="ts">
	import { onMount } from 'svelte';
	type Treatment = 'soft' | 'mirror' | 'gold';
	let { treatment }: { treatment: Treatment } = $props();
	let canvas: HTMLCanvasElement;
	let audio: HTMLAudioElement;
	let startedAt = 0;
	let frame = 0;
	const size = 520;
	const travelMs = 1050;
	const cycleMs = 2650;
	const descriptions = {
		soft: 'Soft mirror light with a clear catch on the gold border and upper edge.',
		mirror: 'A brighter mirror reflection rolls across the sign and carved trim.',
		gold: 'A warm reflection makes the border and top arch glow as it passes.',
	};
	function replay() {
		startedAt = performance.now();
		audio.pause();
		audio.currentTime = 0;
		void audio.play().catch(() => {});
	}
	onMount(() => {
		const image = new Image();
		let alive = true;
		image.onload = () => {
			if (!alive) return;
			const surface = canvas.getContext('2d')!;
			const base = document.createElement('canvas');
			base.width = base.height = size;
			const baseContext = base.getContext('2d', { willReadFrequently: true })!;
			baseContext.drawImage(image, 0, 0, size, size);
			const pixels = baseContext.getImageData(0, 0, size, size).data;
			const border = document.createElement('canvas');
			border.width = border.height = size;
			const borderContext = border.getContext('2d')!;
			const borderPixels = borderContext.createImageData(size, size);
			// Pick out the gold outer frame and top arch, leaving the WILD letters alone.
			for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
				const i = (y * size + x) * 4;
				const red = pixels[i], green = pixels[i + 1], blue = pixels[i + 2], alpha = pixels[i + 3];
				if (alpha > 60 && red > 115 && red > green * 1.13 && green > blue * 1.25 &&
					(y < 192 || y > 355 || x < 88 || x > 432)) {
					borderPixels.data[i] = borderPixels.data[i + 1] = borderPixels.data[i + 2] = 255;
					borderPixels.data[i + 3] = alpha;
				}
			}
			borderContext.putImageData(borderPixels, 0, 0);
			const light = document.createElement('canvas');
			light.width = light.height = size;
			const lightContext = light.getContext('2d')!;
			const rim = document.createElement('canvas');
			rim.width = rim.height = size;
			const rimContext = rim.getContext('2d')!;
			startedAt = performance.now() - 350;
			const draw = (now: number) => {
				if (!alive) return;
				const phase = (now - startedAt) % cycleMs;
				surface.clearRect(0, 0, size, size);
				surface.drawImage(base, 0, 0);
				if (phase < travelMs) {
					const t = phase / travelMs;
					// Slow at either end, fast through the center, like a passing reflection.
					const eased = t * t * t * (t * (t * 6 - 15) + 10);
					const center = -100 + eased * 720;
					const width = treatment === 'soft' ? 82 : treatment === 'mirror' ? 95 : 106;
					const strength = treatment === 'soft' ? .64 : treatment === 'mirror' ? .9 : .75;
					const color = treatment === 'gold' ? '255,223,142' : '255,250,225';
					const band = lightContext.createLinearGradient(center - width, center - width, center + width, center + width);
					band.addColorStop(0, `rgba(${color},0)`);
					band.addColorStop(.28, `rgba(${color},${strength * .18})`);
					band.addColorStop(.49, `rgba(255,255,245,${strength})`);
					band.addColorStop(.57, `rgba(255,255,255,${strength * .7})`);
					band.addColorStop(.78, `rgba(${color},${strength * .15})`);
					band.addColorStop(1, `rgba(${color},0)`);
					lightContext.clearRect(0, 0, size, size);
					lightContext.fillStyle = band;
					lightContext.fillRect(0, 0, size, size);
					lightContext.globalCompositeOperation = 'destination-in';
					lightContext.drawImage(base, 0, 0);
					lightContext.globalCompositeOperation = 'source-over';
					surface.drawImage(light, 0, 0);
					const edge = rimContext.createLinearGradient(center - 55, center - 55, center + 55, center + 55);
					edge.addColorStop(0, 'rgba(255,243,165,0)');
					edge.addColorStop(.5, treatment === 'gold' ? 'rgba(255,241,166,.98)' : 'rgba(255,255,240,.98)');
					edge.addColorStop(1, 'rgba(255,243,165,0)');
					rimContext.clearRect(0, 0, size, size);
					rimContext.fillStyle = edge;
					rimContext.fillRect(0, 0, size, size);
					rimContext.globalCompositeOperation = 'destination-in';
					rimContext.drawImage(border, 0, 0);
					rimContext.globalCompositeOperation = 'source-over';
					surface.drawImage(rim, 0, 0);
				}
				frame = requestAnimationFrame(draw);
			};
			frame = requestAnimationFrame(draw);
		};
		image.src = '/assets/art-refresh/W.png';
		return () => { alive = false; cancelAnimationFrame(frame); audio?.pause(); };
	});
</script>

<div class="preview">
	<div class="reel-cell"><canvas bind:this={canvas} width={size} height={size} aria-label="Animated Wild sign highlight"></canvas></div>
	<p>{descriptions[treatment]}</p>
	<button type="button" onclick={replay}>Replay landing with sound</button>
	<p class="hint">The highlight loops automatically. Sound plays when you press Replay.</p>
	<audio bind:this={audio} src="/assets/audio/effects/wildLandingCurrent.mp3" preload="auto"></audio>
</div>

<style>
	.preview { min-height: 100vh; box-sizing: border-box; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; padding: 28px; background: radial-gradient(circle, #456149 0%, #26392b 55%, #19251d 100%); color: #fff5d8; font: 16px Georgia, serif; }
	.reel-cell { width: min(72vw, 520px); aspect-ratio: 1; overflow: hidden; background: linear-gradient(#493a25, #2b251c); border: 7px solid #8f6b36; border-radius: 12px; box-shadow: inset 0 0 30px #0a0f0c, 0 12px 35px #1119; }
	canvas { display: block; width: 100%; height: 100%; }
	p { max-width: 520px; margin: 0; text-align: center; line-height: 1.4; }
	button { padding: 11px 18px; border: 1px solid #f4ce70; border-radius: 7px; background: #694521; color: #fff6db; font: 700 15px Georgia, serif; cursor: pointer; }
	button:hover { background: #86602c; }
	.hint { font: 12px Arial, sans-serif; opacity: .75; }
</style>
