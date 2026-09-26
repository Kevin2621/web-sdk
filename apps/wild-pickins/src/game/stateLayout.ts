import { createLayout } from 'utils-layout';
import { sceneMainSizes, refreshScene, sceneViewportLayout } from './sceneGeometry.mjs';

// Retain SDK breakpoints and use one viewport transform for all scene layers.
const layout = createLayout({
	backgroundRatio: {
		normal: refreshScene.width / refreshScene.height,
		portrait: refreshScene.width / refreshScene.height,
	},
	mainSizesMap: sceneMainSizes,
});

export const stateLayout = layout.stateLayout;
export const stateLayoutDerived = {
	...layout.stateLayoutDerived,
	mainLayout: () => sceneViewportLayout(
		layout.stateLayoutDerived.canvasSizes(),
		layout.stateLayoutDerived.mainLayout(),
	),
};
