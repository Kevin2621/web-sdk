import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import {
	symbolStyleDefaults as settings,
	symbolFonts,
	symbolLayout,
	symbolPalette,
} from '../src/game/symbolAppearance.ts';
import { createLetterStyles, getLetterDepthOffsets } from '../src/game/letterRendering.mjs';

const pixiRequire = createRequire(
	new URL('../../../packages/pixi-svelte/package.json', import.meta.url),
);
const { DOMAdapter, CanvasTextMetrics, CanvasTextSystem, TextStyle, FillGradient } =
	pixiRequire('pixi.js');
DOMAdapter.set({
	...DOMAdapter.get(),
	createCanvas: (width = 1, height = 1) => createCanvas(width, height),
	getCanvasRenderingContext2D: () => createCanvas(1, 1).getContext('2d').constructor,
});
const root = new URL('../', import.meta.url);
GlobalFonts.registerFromPath(
	fileURLToPath(new URL('static/assets/fonts/luckiest-guy/Luckiest-Guy.ttf', root)),
	'Luckiest Guy',
);
const output = new URL('static/assets/letters-baked/', root);
await mkdir(output, { recursive: true });
const system = new CanvasTextSystem({ resolution: 1 });
const manifest = {};
const previews = [];
if (settings.font !== 'luckiest') {
	throw new Error(
		'Exporter expects the Luckiest Guy font. Rotation is applied to the sprite at runtime.',
	);
}

for (const rank of ['A', 'K', 'Q', 'J', '10']) {
	const styles = createLetterStyles(
		{
			fontFamily: symbolFonts[settings.font].split(',').map((value) => value.trim()),
			fontWeight: '400',
			fontSize: symbolLayout.fontSize,
			edge: settings.edge,
			color: settings.multicolor ? symbolPalette[rank] : settings.color,
		},
		FillGradient,
	);
	const metrics = CanvasTextMetrics.measureText(rank, new TextStyle(styles.rim));
	const resolution = 768 / metrics.height;
	const padding = Math.max(8, Math.ceil(settings.shadowSoftness * 4 + 2));
	const dx = settings.depth * 0.3;
	const width = Math.ceil((metrics.width + dx + 5 + padding * 2) * resolution);
	const height = Math.ceil((metrics.height + settings.depth + 5 + padding * 2) * resolution);
	const canvas = createCanvas(width, height);
	const ctx = canvas.getContext('2d');
	function layer(styleInput, x = 0, y = 0, alpha = 1, softness = 0) {
		const style = new TextStyle(styleInput);
		const measured = CanvasTextMetrics.measureText(rank, style);
		const layerCanvas = createCanvas(
			Math.ceil(measured.width * resolution) + 2,
			Math.ceil(measured.height * resolution) + 2,
		);
		system.renderTextToCanvas(rank, style, resolution, {
			canvas: layerCanvas,
			context: layerCanvas.getContext('2d'),
		});
		ctx.globalAlpha = alpha;
		ctx.filter = softness > 0 ? `blur(${softness * resolution}px)` : 'none';
		ctx.drawImage(
			layerCanvas,
			(padding + (metrics.width - measured.width) / 2 + x) * resolution,
			(padding + (metrics.height - measured.height) / 2 + y) * resolution,
		);
	}
	layer(
		styles.shadow,
		dx + 5,
		settings.depth + 5,
		settings.shadowStrength / 100,
		settings.shadowSoftness,
	);
	for (const offset of getLetterDepthOffsets(settings.depth))
		layer(styles.depth, offset.x, offset.y);
	layer(styles.rim);
	layer(styles.face);
	ctx.globalAlpha = 1;
	const filename = rank.toLowerCase() + '.png';
	await writeFile(new URL(filename, output), canvas.toBuffer('image/png'));
	manifest[rank] = {
		key: 'wpBakedLetter' + rank,
		canvasWidth: width,
		canvasHeight: height,
		faceWidth: metrics.width * resolution,
		faceHeight: metrics.height * resolution,
		anchorX: ((padding + metrics.width / 2 + dx / 2) * resolution) / width,
		anchorY: ((padding + metrics.height / 2 + settings.depth / 2) * resolution) / height,
	};
	// Require transparent padding on every edge; catches clipped shadow or glyph corners.
	const pixels = ctx.getImageData(0, 0, width, height).data;
	for (let x = 0; x < width; x++) {
		if (pixels[x * 4 + 3] || pixels[((height - 1) * width + x) * 4 + 3])
			throw new Error(`${rank}: clipped vertical padding`);
	}
	for (let y = 0; y < height; y++) {
		if (pixels[y * width * 4 + 3] || pixels[(y * width + width - 1) * 4 + 3])
			throw new Error(`${rank}: clipped horizontal padding`);
	}
	previews.push(canvas);
	styles.destroy();
	console.log(`${rank}: ${width} × ${height}, face height 768px`);
}
await writeFile(
	new URL('src/game/bakedLetterBounds.json', root),
	JSON.stringify(manifest, null, 2) + '\n',
);
const contact = createCanvas(1500, 380);
const context = contact.getContext('2d');
context.fillStyle = '#34482a';
context.fillRect(0, 0, contact.width, contact.height);
previews.forEach((canvas, index) => {
	const factor = Math.min(270 / canvas.width, 320 / canvas.height);
	context.drawImage(
		canvas,
		index * 300 + (300 - canvas.width * factor) / 2,
		(380 - canvas.height * factor) / 2,
		canvas.width * factor,
		canvas.height * factor,
	);
});
await writeFile(new URL('preview.png', output), contact.toBuffer('image/png'));
