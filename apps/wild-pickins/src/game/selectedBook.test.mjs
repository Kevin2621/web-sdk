import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import {
	validateSelectedBook,
	previewBet,
	createRoundState,
	applyRoundEvent,
	restoreRoundState,
} from './selectedBook.ts';
import { selectedRules, selectedModes } from './selectedConfig.ts';
const folder = new URL('../stories/data/selected/', import.meta.url);
const manifest = JSON.parse(readFileSync(new URL('manifest.json', folder)));
const books = Object.fromEntries(
	Object.keys(manifest.books).map((name) => [
		name,
		JSON.parse(readFileSync(new URL(`${name}.json`, folder))),
	]),
);
const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');

test('checked-in books and selected configuration match the source provenance', () => {
	assert.equal(
		digest(readFileSync(new URL('./selectedMath.json', import.meta.url))),
		manifest.configSha256,
	);
	for (const [name, book] of Object.entries(books)) {
		const source = manifest.books[name];
		assert.equal(digest(readFileSync(new URL(`${name}.json`, folder))), source.bookSha256);
		assert.equal(book.id, source.sourceBookId);
		assert.equal(book.payoutMultiplier, source.payoutBookUnits);
		assert.ok(source.lookupWeight > 0);
		assert.equal(selectedModes[source.mode].cost, source.cost);
		assert.equal(selectedModes[source.mode].lookupSha256, source.lookupSha256);
		assert.ok(book.payoutMultiplier <= selectedModes[source.mode].maxWinBookUnits);
		validateSelectedBook(book);
	}
	assert.equal(Object.keys(selectedRules.paylines).length, 25);
	assert.equal(selectedRules.goldenPicksEnabled, false);
});

test('preview conversion keeps book events intact and scales payouts exactly once', () => {
	const source = books['round-cap'];
	const before = JSON.stringify(source);
	const bet = previewBet(source, 'base');
	assert.equal(bet.payoutMultiplier, 5000);
	assert.equal(bet.state.at(-1).amount, 500000);
	assert.deepEqual(bet.state, source.events);
	bet.state[0].board[0][0].name = 'S';
	assert.equal(JSON.stringify(source), before);
	// Storybook supplies reactive proxies, which structuredClone cannot copy.
	assert.equal(previewBet(new Proxy(books['base-win'], {}), 'base').payoutMultiplier, 1);
	for (const name of ['buy-50', 'buy-200', 'buy-500']) {
		const mode = manifest.books[name].mode;
		const bet = previewBet(books[name], mode);
		assert.equal(
			bet.state.find((e) => e.type === 'freeSpinTrigger').totalFs,
			selectedModes[mode].initialSpins,
		);
	}
	assert.throws(
		() => previewBet(books['buy-50'], 'standard_bonus_buy_high'),
		/purchase tier mismatch/,
	);
});

test('authoritative state can be reconstructed at every event boundary without changing outcomes', () => {
	for (const book of Object.values(books)) {
		const source = JSON.stringify(book);
		const expected = restoreRoundState(book.events);
		assert.equal(expected.roundTotal, book.payoutMultiplier);
		assert.equal(expected.inBonus, false);
		assert.deepEqual(expected.sticky, []);
		for (let index = 0; index <= book.events.length; index++) {
			const resumed = restoreRoundState(book.events.slice(0, index));
			for (const event of book.events.slice(index)) applyRoundEvent(resumed, event);
			assert.deepEqual(resumed, expected);
		}
		assert.equal(JSON.stringify(book), source);
	}
});

test('collision counters and persistent multipliers come from the event, not inferred math', () => {
	const state = createRoundState();
	let found = false;
	for (const event of books['natural-bonus-collision'].events) {
		applyRoundEvent(state, event);
		if (event.type === 'wildPickinsSpinResult' && event.grantedExtraSpins > 0) {
			found = true;
			assert.equal(state.remaining, event.remaining);
			assert.equal(state.granted, event.totalGranted);
			assert.deepEqual(state.sticky, event.stickyAfter);
			for (const cell of event.wildMultipliers) {
				assert.equal(state.board[cell.reel][cell.row + 1].name, 'W');
				assert.equal(state.board[cell.reel][cell.row + 1].multiplier, cell.multiplier);
			}
		}
	}
	assert.equal(found, true);
});

test('fresh locks animate once while recovered locks start in their settled state', () => {
	const events = books['natural-bonus-collision'].events;
	const state = createRoundState();
	const firstLockIndex = events.findIndex((event, index) => {
		applyRoundEvent(state, event);
		return event.type === 'wildPickinsSpinResult' && state.newlyLocked.length > 0;
	});
	assert.ok(firstLockIndex >= 0);
	assert.deepEqual(state.newlyLocked, state.sticky);
	const recovered = restoreRoundState(events.slice(0, firstLockIndex + 1));
	assert.deepEqual(recovered.sticky, state.sticky);
	assert.deepEqual(recovered.newlyLocked, []);
	for (const event of events.slice(firstLockIndex + 1)) applyRoundEvent(state, event);
	assert.deepEqual(state.sticky, []);
	assert.deepEqual(state.newlyLocked, []);
});

test('rejects broken transport contracts before playback', () => {
	for (const change of [
		(book) => {
			book.events[0].type = 'unknown';
		},
		(book) => {
			book.events[0].board[0][0].name = 'UNKNOWN';
		},
		(book) => {
			book.events[1].index = 10;
		},
		(book) => {
			book.events.pop();
		},
		(book) => {
			book.events = [{ index: 0, type: 'finalWin', amount: book.payoutMultiplier }];
		},
		(book) => {
			book.payoutMultiplier += 1;
		},
		(book) => {
			book.events.find((e) => e.type === 'wildPickinsSpinResult').roundTotal += 1;
		},
	]) {
		const book = structuredClone(books['base-win']);
		change(book);
		assert.throws(() => validateSelectedBook(book), /Wild Pickins book:/);
	}
	const bonus = structuredClone(books['natural-bonus-collision']);
	const result = bonus.events.find(
		(e) => e.type === 'wildPickinsSpinResult' && e.wildMultipliers.length,
	);
	result.wildMultipliers = [];
	assert.throws(() => validateSelectedBook(bonus), /missing Wild multiplier/);
});
