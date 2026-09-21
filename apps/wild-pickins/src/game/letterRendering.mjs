// Shared by the live workshop and offline PNG exporter.
export function createLetterStyles(
	{ fontFamily, fontWeight, fontSize, edge, color },
	FillGradient,
) {
	function shade(target, amount) {
		const value = parseInt(color.slice(1), 16);
		return (
			'#' +
			[16, 8, 0]
				.map((shift) => {
					const channel = (value >> shift) & 255;
					return Math.round(channel + (target - channel) * amount)
						.toString(16)
						.padStart(2, '0');
				})
				.join('')
		);
	}
	const gradients = [];
	function gradient(stops) {
		const result = new FillGradient({
			start: { x: 0, y: 0 },
			end: { x: 0.25, y: 1 },
			textureSpace: 'local',
			colorStops: stops.map(([offset, color]) => ({ offset, color })),
		});
		gradients.push(result);
		return result;
	}
	const paint = gradient([
		[0, shade(255, 0.38)],
		[0.2, shade(255, 0.15)],
		[0.46, color],
		[1, shade(0, 0.3)],
	]);
	const wood = gradient([
		[0, '#f0d19a'],
		[0.25, '#cd9b5f'],
		[0.65, '#af743d'],
		[1, '#84502a'],
	]);
	const woodEdge = gradient([
		[0, '#a36c39'],
		[0.5, '#704323'],
		[1, '#432919'],
	]);
	const woodDepth = gradient([
		[0, '#a77442'],
		[0.55, '#79502d'],
		[1, '#45291a'],
	]);
	const face = {
		fontFamily,
		fontWeight,
		fontSize,
		padding: 0,
		lineJoin: 'round',
		stroke: { fill: wood, width: edge },
		fill: paint,
	};
	return {
		face,
		depth: { ...face, fill: woodDepth, stroke: { fill: woodEdge, width: edge + 3 } },
		rim: { ...face, fill: woodEdge, stroke: { fill: woodEdge, width: edge + 3 } },
		shadow: { ...face, fill: '#211309', stroke: { color: '#211309', width: edge + 3 } },
		destroy() {
			gradients.forEach((gradient) => gradient.destroy());
		},
	};
}

export function getLetterDepthOffsets(depth) {
	const x = depth * 0.3;
	const steps = Math.ceil(Math.hypot(x, depth));
	return Array.from({ length: steps }, (_, index) => {
		const fraction = (steps - index) / steps;
		return { x: x * fraction, y: depth * fraction };
	});
}
