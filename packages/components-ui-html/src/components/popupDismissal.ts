type Popup = {
	isOpen: () => boolean;
	contains: (target: Node) => boolean;
	close: () => void;
};

const popups = new Set<Popup>();
let blockClick: ((event: MouseEvent) => void) | undefined;
let clickTimeout: ReturnType<typeof setTimeout> | undefined;

function clearClickBlock() {
	if (blockClick) document.removeEventListener('click', blockClick, true);
	blockClick = undefined;
	clearTimeout(clickTimeout);
}

function dismissOnPointerDown(event: PointerEvent) {
	// A pointer sequence without a click must not consume a later interaction.
	clearClickBlock();
	if (!(event.target instanceof Node)) return;
	const open = [...popups].filter((popup) => popup.isOpen());
	if (!open.length || open.some((popup) => popup.contains(event.target as Node))) return;
	for (const popup of open) popup.close();
	event.preventDefault();
	event.stopImmediatePropagation();
	const suppressClick = (click: MouseEvent) => {
		click.preventDefault();
		click.stopImmediatePropagation();
		clearClickBlock();
	};
	blockClick = suppressClick;
	document.addEventListener('click', suppressClick, true);
	clickTimeout = setTimeout(clearClickBlock, 700);
}

export function registerDismissiblePopup(popup: Popup) {
	if (!popups.size) document.addEventListener('pointerdown', dismissOnPointerDown, true);
	popups.add(popup);
	return () => {
		popups.delete(popup);
		if (!popups.size) {
			document.removeEventListener('pointerdown', dismissOnPointerDown, true);
			clearClickBlock();
		}
	};
}
