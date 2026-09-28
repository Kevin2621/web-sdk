/** Move a popup by its header while keeping it inside the viewport. */
const positions = new Map<string, { x: number; y: number; width: number; height: number }>();

export function draggablePanel(node: HTMLElement, options: { header: string; key: string }) {
	const header = node.querySelector<HTMLElement>(options.header);
	if (!header) return;
	const saved = positions.get(options.key);
	const initial = saved?.width === innerWidth && saved.height === innerHeight ? saved : { x: 0, y: 0 };
	let { x, y } = initial;
	node.style.translate = `${x}px ${y}px`;
	let pointer = -1;
	let startX = 0;
	let startY = 0;
	let originX = 0;
	let originY = 0;
	let frame = 0;
	const place = (nextX: number, nextY: number) => {
		if (!node.getClientRects().length) return;
		const rect = node.getBoundingClientRect();
		const horizontalMin = x + 8 - rect.left;
		const horizontalMax = x + innerWidth - 8 - rect.right;
		const verticalMin = y + 8 - rect.top;
		const verticalMax = y + innerHeight - 8 - rect.bottom;
		x = Math.round(Math.max(horizontalMin, Math.min(nextX, horizontalMax)));
		y = Math.round(Math.max(verticalMin, Math.min(nextY, verticalMax)));
		node.style.translate = `${x}px ${y}px`;
		positions.set(options.key, { x, y, width: innerWidth, height: innerHeight });
	};
	const down = (event: PointerEvent) => {
		if (!event.isPrimary || event.button !== 0 || (event.target instanceof Element && event.target.closest('button, input'))) return;
		pointer = event.pointerId;
		startX = event.clientX;
		startY = event.clientY;
		originX = x;
		originY = y;
		header.setPointerCapture(pointer);
		event.preventDefault();
	};
	const move = (event: PointerEvent) => {
		if (event.pointerId === pointer) place(originX + event.clientX - startX, originY + event.clientY - startY);
	};
	const up = (event: PointerEvent) => {
		if (event.pointerId === pointer) pointer = -1;
	};
	// A new viewport can switch the game's responsive layout. Return to its anchor
	// instead of carrying a drag offset into a different aspect ratio.
	const viewportResize = () => {
		if (pointer !== -1 && header.hasPointerCapture(pointer)) header.releasePointerCapture(pointer);
		pointer = -1;
		x = y = 0;
		positions.delete(options.key);
		node.style.translate = '0px 0px';
		cancelAnimationFrame(frame);
		frame = requestAnimationFrame(() => place(0, 0));
	};
	const observer = new ResizeObserver(() => place(x, y));
	observer.observe(node);
	frame = requestAnimationFrame(() => place(x, y));
	header.addEventListener('pointerdown', down);
	header.addEventListener('pointermove', move);
	header.addEventListener('pointerup', up);
	header.addEventListener('pointercancel', up);
	window.addEventListener('resize', viewportResize);
	return { destroy() {
		cancelAnimationFrame(frame);
		observer.disconnect();
		header.removeEventListener('pointerdown', down);
		header.removeEventListener('pointermove', move);
		header.removeEventListener('pointerup', up);
		header.removeEventListener('pointercancel', up);
		window.removeEventListener('resize', viewportResize);
	} };
}
