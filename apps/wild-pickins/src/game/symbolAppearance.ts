export const symbolRanks: Record<string, string> = { L1: 'A', L2: 'K', L3: 'Q', L4: 'J', L5: '10' };
export const symbolFonts = {
	luckiest: 'Luckiest Guy, Arial Black, sans-serif',
	patua: 'Patua One, Georgia, serif',
	rounded: 'Arial Rounded MT Bold, Trebuchet MS, sans-serif',
	heavy: 'Impact, Arial Black, sans-serif',
	serif: 'Georgia, serif',
	slab: 'Rockwell, Georgia, serif',
};
export const symbolStyleDefaults = {
	generated: false,
	multicolor: true,
	font: 'luckiest' as keyof typeof symbolFonts,
	color: '#749cba',
	edge: 8,
	depth: 8,
	tilt: 3,
	shadowStrength: 75,
	shadowSoftness: 2,
};
// One cell-relative sizing policy; effects never participate in symbol layout.
export const symbolLayout = {
	letterHeight: 1,
	letterMaxWidth: 1,
	fontSize: 145,
};
export const symbolArtwork: Record<string, { key: string; ratio: number }> = Object.fromEntries(
	['H1', 'H2', 'H3', 'L1', 'L2', 'L3', 'L4', 'L5', 'W', 'S'].map((name) => [
		name,
		{ key: `wpRefresh${name}`, ratio: 1 },
	]),
);
export const symbolPalette: Record<string, string> = {
	'10': '#83a66a',
	J: '#649ac6',
	Q: '#aa83b6',
	K: '#d7a34c',
	A: '#c86656',
};
