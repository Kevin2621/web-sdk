// RGS money uses millionths; book event wins use hundredths of the base bet.
export function parseReplay(search) {
	const params = new URLSearchParams(search);
	const required = ['game', 'version', 'mode', 'event', 'rgs_url'];
	for (const key of required)
		if (!params.get(key)?.trim()) throw Error(`Replay link is missing ${key}.`);
	const raw = params.get('rgs_url');
	const server = new URL(raw.includes('://') ? raw : `https://${raw}`);
	if (!['https:', 'http:'].includes(server.protocol) || server.username || server.password)
		throw Error('Invalid replay server.');
	const amount = params.has('amount') ? Number(params.get('amount')) : 1000000;
	if (!Number.isSafeInteger(amount) || amount <= 0)
		throw Error('Replay amount must be positive integer units.');
	const currency = params.get('currency') || 'USD';
	if (!/^[a-zA-Z0-9]{2,12}$/.test(currency)) throw Error('Invalid replay currency.');
	const path = ['game', 'version', 'mode', 'event']
		.map((key) => encodeURIComponent(params.get(key)))
		.join('/');
	server.pathname = `${server.pathname.replace(/\/$/, '')}/bet/replay/${path}`;
	server.search = '';
	server.hash = '';
	return {
		url: server.href,
		amount: amount / 1000000,
		currency,
		mode: params.get('mode'),
		event: params.get('event'),
		social: params.get('social') === 'true',
	};
}
export function normalizeReplay(data) {
	if (
		!data ||
		data.error ||
		!Number.isFinite(data.payoutMultiplier) ||
		data.payoutMultiplier < 0 ||
		!Number.isFinite(data.costMultiplier) ||
		data.costMultiplier <= 0
	)
		throw Error('Invalid replay result.');
	const book = Array.isArray(data.state) ? { events: data.state } : data.state;
	if (!book || !Array.isArray(book.events) || !book.events.length)
		throw Error('Replay has no events.');
	const allowed = new Set([
		'reveal',
		'goldenCropPick',
		'wildPickinsSpinResult',
		'winInfo',
		'setWin',
		'setTotalWin',
		'freeSpinTrigger',
		'updateFreeSpin',
		'freeSpinEnd',
		'finalWin',
	]);
	for (const [i, event] of book.events.entries()) {
		if (!event || event.index !== i || !allowed.has(event.type))
			throw Error('Unsupported replay event.');
	}
	const final = book.events.at(-1);
	if (final.type !== 'finalWin' || Math.abs(final.amount / 100 - data.payoutMultiplier) > 0.000001)
		throw Error('Replay payout does not match its final result.');
	return {
		book: { roundCap: 500000, spinBudget: 30, ...book },
		payoutMultiplier: data.payoutMultiplier,
		costMultiplier: data.costMultiplier,
		custom: book.events.some((e) => e.type === 'wildPickinsSpinResult'),
	};
}
export async function fetchReplay(config, signal, fetcher = fetch) {
	const timeout = AbortSignal.timeout(30000);
	const requestSignal = signal ? AbortSignal.any([signal, timeout]) : timeout;
	const response = await fetcher(config.url, {
		method: 'GET',
		credentials: 'omit',
		signal: requestSignal,
	});
	if (!response.ok) throw Error(`Replay could not be loaded (${response.status}).`);
	return normalizeReplay(await response.json());
}
