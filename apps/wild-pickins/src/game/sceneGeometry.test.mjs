import test from 'node:test';
import assert from 'node:assert/strict';
import {
	refreshScene,
	frameBounds, boardViewportArea,
	sceneViewportLayout,
	sceneBoardSize,
	sceneMainSizes,
	sceneRegistration,
} from './sceneGeometry.mjs';
const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-8, `${a} != ${b}`);
for (const [mode, size] of Object.entries(sceneMainSizes)) {
	test(`${mode}: registered opening aligns with the SDK-centered board`, () => {
		const board = { x: size.width / 2, y: size.height / 2, ...sceneBoardSize };
		const scene = sceneRegistration(board),
			opening = refreshScene.opening;
		close(scene.x + opening.x * scene.scaleX, board.x - board.width / 2);
		close(scene.y + opening.y * scene.scaleY, board.y - board.height / 2);
		close(opening.width * scene.scaleX, board.width);
		close(opening.height * scene.scaleY, board.height);
		close(scene.scaleX, scene.scaleY);
	});
}
test('layer registration follows a moved board without changing layer sizes', () => {
	const original = sceneRegistration({ x: 450, y: 400, ...sceneBoardSize });
	const moved = sceneRegistration({ x: 470, y: 390, ...sceneBoardSize });
	close(moved.x - original.x, 20);
	close(moved.y - original.y, -10);
	close(moved.width, original.width);
	close(moved.height, original.height);
});

// Catch future art re-exports that invalidate the scene registration or reel slot.
test('Spine export matches the registered frame and reel insertion layer', async () => {
	const { readFile } = await import('node:fs/promises');
	const data = JSON.parse(await readFile(new URL('../../static/assets/spines/base-scene/skeleton.json', import.meta.url), 'utf8'));
	assert.ok(data.skeleton.spine.startsWith('4.2'));
	assert.deepEqual(data.slots.map(slot => slot.name), ['environment-v2', 'board-back', 'board-frame']);
	const frame = data.skins[0].attachments['board-frame']['board-frame'];
	close(refreshScene.opening.x, 836 + (220 - 836) * frame.scaleX);
	close(refreshScene.opening.y, 470.5 - frame.y + (125 - 470.5) * frame.scaleY);
	close(refreshScene.opening.width, 1230 * frame.scaleX);
	close(refreshScene.opening.height, 650 * frame.scaleY);
	// Only the board's ancestor chain controls reel registration; extra attachment bones may move.
	for (const bone of data.bones.filter(bone => ['root', 'bone2', 'bone'].includes(bone.name))) {
		assert.equal(bone.x ?? 0, 0);
		assert.equal(bone.y ?? 0, 0);
		assert.equal(bone.rotation ?? 0, 0);
	}
});

for (const canvas of [{width:390,height:844},{width:414,height:736},{width:412,height:732},{width:720,height:1280},{width:1200,height:675},{width:844,height:390},{width:2560,height:1080}]) {
	test(`board fits independently of background at ${canvas.width}x${canvas.height}`, () => {
		const size = sceneMainSizes.desktop;
		const layout = sceneViewportLayout(canvas,{...size,anchor:0.5});
		const scene = sceneRegistration({x:size.width/2,y:size.height/2,...sceneBoardSize});
		const area = boardViewportArea(canvas);
		const x = layout.x+(scene.x+frameBounds.x*scene.scaleX-size.width/2)*layout.scale;
		const y = layout.y+(scene.y+frameBounds.y*scene.scaleY-size.height/2)*layout.scale;
		const w = frameBounds.width*scene.scaleX*layout.scale;
		const h = frameBounds.height*scene.scaleY*layout.scale;
		assert.ok(x>=area.x-1e-8 && y>=area.y-1e-8);
		assert.ok(x+w<=area.x+area.width+1e-8 && y+h<=area.y+area.height+1e-8);
		close(scene.scaleX,scene.scaleY);
		close(x+w/2,area.x+area.width/2);
		close(y+h/2,area.y+area.height/2);
		const cover = Math.max(canvas.width/refreshScene.width,canvas.height/refreshScene.height);
		assert.ok(refreshScene.width*cover>=canvas.width-1e-8);
		assert.ok(refreshScene.height*cover>=canvas.height-1e-8);
	});
}
