import { createCanvas, Image } from '@napi-rs/canvas';
import { readFile, writeFile } from 'node:fs/promises';

// Match the bitmap font used by Symbol.svelte while giving Spine three
// interchangeable, transparent attachments with identical 512px bounds.
const fontDirectory = new URL('../static/assets/fonts/goldFont/', import.meta.url);
const imageDirectory = new URL('../../../../wild-pickins/art/spines/W/images/', import.meta.url);
const xml = await readFile(new URL('mm_gold.xml', fontDirectory), 'utf8');
const atlasBytes = await readFile(new URL('mm_gold.png', fontDirectory));
const glyphs = new Map();
for (const match of xml.matchAll(/<char\s+([^>]+)\/>/g)) {
	const attributes = Object.fromEntries([...match[1].matchAll(/([\w]+)="([^"]*)"/g)].map((part) => [part[1], part[2]]));
	const id = Number(attributes.id);
	if (Number.isFinite(id)) glyphs.set(id, attributes);
}

const size = 512;
const scale = 3.2;
const letterGap = 2;
for (const digit of ['1', '2', '3']) {
	const characters = [digit, 'X'].map((character) => {
		const glyph = glyphs.get(character.charCodeAt(0));
		if (!glyph) throw new Error(`Missing gold-font glyph: ${character}`);
		return glyph;
	});
	const textWidth = characters.reduce((sum, glyph) => sum + Number(glyph.xadvance), letterGap) * scale;
	const canvas = createCanvas(size, size);
	const context = canvas.getContext('2d');
	context.imageSmoothingEnabled = true;
	context.imageSmoothingQuality = 'high';
	let x = (size - textWidth) / 2;
	for (const glyph of characters) {
		const atlas = new Image();
		atlas.src = atlasBytes;
		await atlas.decode();
		context.drawImage(
			atlas,
			Number(glyph.x), Number(glyph.y), Number(glyph.width), Number(glyph.height),
			x + Number(glyph.xoffset) * scale,
			(size - Number(glyph.height) * scale) / 2 + Number(glyph.yoffset) * scale,
			Number(glyph.width) * scale, Number(glyph.height) * scale,
		);
		x += (Number(glyph.xadvance) + letterGap) * scale;
	}
	await writeFile(new URL(`${digit}X.png`, imageDirectory), canvas.toBuffer('image/png'));
}
