import { createLayout } from 'utils-layout';

const layout = createLayout({
	backgroundRatio: {
		normal: 2039 / 1000,
		portrait: 1242 / 2208,
	},
	mainSizesMap: {
		desktop: { width: 1120, height: 700 },
		tablet: { width: 1000, height: 1000 },
		landscape: { width: 1600, height: 900 },
		portrait: { width: 800, height: 1422 },
	},
});

export const stateLayout = layout.stateLayout;
export const stateLayoutDerived = layout.stateLayoutDerived;
