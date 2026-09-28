import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { parseReplay, normalizeReplay, fetchReplay } from './replay.mjs';
const link = 'replay=true&game=wild&version=1&mode=bonus&event=0&rgs_url=rgs.stake-engine.com';
const data = {
	payoutMultiplier: 25,
	costMultiplier: 75,
	state: [{ index: 0, type: 'finalWin', amount: 2500 }],
};
test('query parameters preserve identity and convert money units once', () => {
	const c = parseReplay(link + '&amount=2000000&currency=SC&social=true');
	assert.equal(c.url, 'https://rgs.stake-engine.com/bet/replay/wild/1/bonus/0');
	assert.equal(c.amount, 2);
	assert.equal(c.amount * data.costMultiplier, 150);
	assert.equal(c.amount * data.payoutMultiplier, 50);
	assert.equal(c.currency, 'SC');
	assert.equal(c.social, true);
	assert.equal(parseReplay(link).amount, 1);
});
test('malformed links fail before requesting replay', () => {
	for (const q of [
		link.replace('event=0', ''),
		link + '&amount=-1',
		link + '&amount=wat',
		link + '&amount=0',
		link + '&amount=1.5',
		link.replace('rgs.stake-engine.com', 'javascript:evil'),
	])
		assert.throws(() => parseReplay(q));
});
test('state arrays and book envelopes retain ordered events; zero and max payouts work', () => {
	for (const payout of [0, 25, 5000]) {
		const d = {
			...data,
			payoutMultiplier: payout,
			state: [{ index: 0, type: 'finalWin', amount: payout * 100 }],
		};
		assert.equal(normalizeReplay(d).payoutMultiplier, payout);
		assert.deepEqual(normalizeReplay({ ...d, state: { events: d.state } }).book.events, d.state);
	}
});
test('rejects unsupported events, broken totals, missing state, and invalid multipliers', () => {
	for (const d of [
		{ ...data, state: [] },
		{ ...data, costMultiplier: 0 },
		{ ...data, payoutMultiplier: -1 },
		{ ...data, payoutMultiplier: 26 },
		{ ...data, state: [{ index: 0, type: 'unknown' }] },
	])
		assert.throws(() => normalizeReplay(d));
});
test('fetch uses public GET without credentials or session payload and handles failures', async () => {
	const c = parseReplay(link);
	let calls = 0;
	await fetchReplay(c, undefined, async (url, options) => {
		calls++;
		assert.equal(url, c.url);
		assert.equal(options.method, 'GET');
		assert.equal(options.credentials, 'omit');
		assert.ok(options.signal instanceof AbortSignal);
		assert.equal(options.body, undefined);
		return { ok: true, json: async () => data };
	});
	assert.equal(calls, 1);
	await assert.rejects(
		fetchReplay(c, undefined, async () => ({ ok: false, status: 404 })),
		/404/,
	);
	await assert.rejects(
		fetchReplay(c, undefined, async () => {
			throw Error('offline');
		}),
		/offline/,
	);
});
test('replay branch bypasses authentication and game actor, hotkeys, resume and controls', () => {
	const layout = readFileSync(new URL('../routes/+layout.svelte', import.meta.url), 'utf8');
	assert.match(layout, /const replayLaunch = stateUrlDerived.replay\(\)/);
	assert.match(layout, /\{#if replayLaunch\}[\s\S]*<Replay \/>[\s\S]*\{:else\}\s*<Authenticate>/);
	const game = readFileSync(new URL('../components/Game.svelte', import.meta.url), 'utf8');
	assert.match(
		game,
		/!props.fixtureOnly && !props.replayOnly\}\s*<EnableHotkey \/>\s*<EnableGameActor/,
	);
	assert.match(game, /!props.replayOnly\}<ResumeBet/);
	assert.match(game, /!props.replayOnly && stateUi.config.mode !== 'replay'\}<PlayerControls/);
});

test('all shipped base fixture event books survive replay transport unchanged', () => {
	const directory = new URL('../stories/data/wild-pickins/', import.meta.url);
	for (const file of readdirSync(directory).filter((f) => f.endsWith('.json'))) {
		const book = JSON.parse(readFileSync(new URL(file, directory), 'utf8'));
		if (!book.events) continue;
		const replay = normalizeReplay({
			state: book,
			payoutMultiplier: book.events.at(-1).amount / 100,
			costMultiplier: 1,
		});
		assert.deepEqual(replay.book.events, book.events, file);
		assert.equal(replay.custom, true, file);
	}
});
