import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { convertTorResumableBet } from './resumeBook.ts';
import { normalizeEngineReplay } from './engineReplay.ts';
import { previewBet, restoreRoundState, applyRoundEvent } from './selectedBook.ts';
import { selectedModes } from './selectedConfig.ts';
const dir = new URL('../stories/data/selected/', import.meta.url);
const manifest = JSON.parse(readFileSync(new URL('manifest.json', dir)));
const books = Object.entries(manifest.books).map(([label, metadata]) => ({
	label,
	mode: metadata.mode,
	book: JSON.parse(readFileSync(new URL(`${label}.json`, dir))),
}));
test('every selected book resumes at every event boundary with identical final state and suffix', () => {
	for (const { label, mode, book } of books) {
		const bet = previewBet(book, mode),
			original = JSON.stringify(bet);
		for (let index = 0; index <= bet.state.length; index++) {
			const resumed = convertTorResumableBet({ ...bet, event: String(index) });
			assert.deepEqual(resumed.state.slice(1), bet.state.slice(index), `${label}:${index}`);
			const state = restoreRoundState(resumed.state[0].bookEvents);
			assert.deepEqual(state.newlyLocked, []);
			for (const event of resumed.state.slice(1)) applyRoundEvent(state, event);
			// Arrival-animation flags are intentionally cleared by recovery.
			state.newlyLocked = [];
			assert.deepEqual(state, restoreRoundState(bet.state), `${label}:${index}`);
		}
		assert.equal(JSON.stringify(bet), original);
	}
});
test('resume accepts a missing checkpoint as the beginning and rejects malformed/out-of-range indices', () => {
	const bet = previewBet(books[0].book, books[0].mode);
	for (const event of [undefined, null, '0', 0])
		assert.deepEqual(convertTorResumableBet({ ...bet, event }).state.slice(1), bet.state);
	for (const event of [-1, 1.5, '', 'wat', ' 1 ', true, {}, String(bet.state.length + 1)])
		assert.throws(() => convertTorResumableBet({ ...bet, event }), /Invalid resume/);
});
test('Engine replay arrays and book envelopes preserve outcomes and convert multiplier units once', () => {
	for (const { mode, book } of books) {
		for (const state of [book.events, book]) {
			const response = {
				state,
				payoutMultiplier: book.payoutMultiplier / 100,
				costMultiplier: selectedModes[mode].cost,
			};
			const original = JSON.stringify(response),
				replay = normalizeEngineReplay(response, mode);
			assert.deepEqual(replay.state, book.events);
			assert.equal(replay.payoutMultiplier, book.payoutMultiplier / 100);
			assert.equal(replay.costMultiplier, selectedModes[mode].cost);
			replay.state[0].board[0][0].name = 'S';
			assert.equal(JSON.stringify(response), original);
		}
	}
});
test('replay rejects unknown modes, unsupported events and inconsistent cost/payout contracts', () => {
	const { book, mode } = books.find((b) => b.mode === 'standard_bonus_buy_medium');
	const response = {
		state: book.events,
		payoutMultiplier: book.payoutMultiplier / 100,
		costMultiplier: 200,
	};
	assert.throws(() => normalizeEngineReplay(response, 'BONUS'));
	assert.throws(
		() => normalizeEngineReplay({ ...response, costMultiplier: 50 }, 'bonus'),
		/purchase tier mismatch/,
	);
	for (const changed of [
		{ ...response, costMultiplier: 50 },
		{ ...response, payoutMultiplier: 0 },
		{ state: [] },
		{ state: { ...book, payoutMultiplier: 1 } },
	])
		assert.throws(() => normalizeEngineReplay(changed, mode));
	const broken = structuredClone(response);
	broken.state[0].type = 'sqlitePlayback';
	assert.throws(() => normalizeEngineReplay(broken, mode));
});
