<script lang="ts">
	import { Graphics } from 'pixi-svelte';

	let {
		points,
		drawn,
		color,
		width,
		alpha,
	}: {
		points: { x: number; y: number }[];
		drawn: number;
		color: number;
		width: number;
		alpha: number;
	} = $props();
</script>

<Graphics
	draw={(g) => {
		if (points.length < 2 || drawn <= 0 || alpha <= 0) return;
		const end = drawn * (points.length - 1);
		g.moveTo(points[0].x, points[0].y);
		for (let i = 1; i <= Math.floor(end); i++) g.lineTo(points[i].x, points[i].y);
		if (end < points.length - 1 && end % 1 > 0) {
			const index = Math.floor(end),
				fraction = end - index;
			const from = points[index],
				to = points[index + 1];
			g.lineTo(from.x + (to.x - from.x) * fraction, from.y + (to.y - from.y) * fraction);
		}
		g.stroke({ color, width, alpha, cap: 'round', join: 'round' });
	}}
/>
