export const symbolRanks: Record<string, string> = { H4: 'A', L1: 'K', L2: 'Q', L3: 'J', L4: '10' };
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
	artworkFill: 0.88,
	highSymbolScale: 0.82,
	letterHeight: 0.78,
	letterMaxWidth: 0.86,
	fontSize: 145,
};
export const symbolArtwork: Record<string, { key: string; ratio: number }> = {
	H1: { key: 'wpWheat', ratio: 1 },
	H2: { key: 'wpHuskedCorn', ratio: 1 },
	H3: { key: 'wpTomato', ratio: 1 },
	W: { key: 'wpWild', ratio: 1 },
	S: { key: 'wpScatter', ratio: 1199 / 1312 },
};
export const symbolPalette: Record<string, string> = {
	'10': '#83a66a',
	J: '#649ac6',
	Q: '#aa83b6',
	K: '#d7a34c',
	A: '#c86656',
};
