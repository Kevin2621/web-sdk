// Source-art coordinates. Reel spacing follows the frame opening aspect ratio.
export const refreshScene = {
	width: 1672,
	height: 941,
	// Source opening transformed by the Spine board-frame attachment.
	opening: { x: 244.64, y: 133.14, width: 1180.8, height: 598 },
	frameTop: 38,
	showClouds: false,
};
export const sceneBoardSize = { width: 360 * refreshScene.opening.width / refreshScene.opening.height, height: 360 };
// The SDK fits the complete Spine scene and its reels together.
export const sceneMainSizes = {
	desktop: { width: 900, height: 640 },
	tablet: { width: 880, height: 900 },
	landscape: { width: 1000, height: 650 },
	portrait: { width: 880, height: 1200 },
};
export function sceneRegistration(board) {
	const opening = refreshScene.opening;
	const scaleX = board.width / opening.width;
	const scaleY = board.height / opening.height;
	return {
		x: board.x - (opening.x + opening.width / 2) * scaleX,
		y: board.y - (opening.y + opening.height / 2) * scaleY,
		width: refreshScene.width * scaleX,
		height: refreshScene.height * scaleY,
		scaleX,
		scaleY,
	};
}

// Visible frame bounds in the exported Spine composition (including its flourishes).
export const frameBounds = {x:149.6, y:53.88, width:1372.8, height:766.36};
export function boardViewportArea(canvas) {
	const margin = Math.min(12, canvas.width * 0.025);
	const top = Math.min(50, canvas.height * 0.1);
	const bottom = Math.min(canvas.width <= 700 ? 180 : 110, canvas.height * 0.3);
	return {x:margin, y:top, width:canvas.width-2*margin, height:Math.max(1,canvas.height-top-bottom)};
}
// Fit only the board above the HTML controls. Background uses its own cover transform.
export function sceneViewportLayout(canvas, layout) {
	const scene = sceneRegistration({x:layout.width/2,y:layout.height/2,...sceneBoardSize});
	const area = boardViewportArea(canvas);
	const scale = Math.min(area.width/(frameBounds.width*scene.scaleX), area.height/(frameBounds.height*scene.scaleY));
	const cx = scene.x+(frameBounds.x+frameBounds.width/2)*scene.scaleX;
	const cy = scene.y+(frameBounds.y+frameBounds.height/2)*scene.scaleY;
	return {...layout, scale,
		x:area.x+area.width/2-(cx-layout.width/2)*scale,
		y:area.y+area.height/2-(cy-layout.height/2)*scale};
}
