import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { planBonusEnding } from './bonusEnding.mjs';
import { bonusCues } from './bonusCues.mjs';
import { presentationWait } from './presentationWait.ts';
import { getWinLineTiming } from './winLineTiming.ts';
import { isSelectedEvents } from './selectedBook.ts';
const folder = new URL('../stories/data/selected/', import.meta.url);
const manifest = JSON.parse(readFileSync(new URL('manifest.json', folder)));

test('resume snapshots retain the selected presentation even after the last spin result', () => {
	for (const name of Object.keys(manifest.books)) {
		const { events } = JSON.parse(readFileSync(new URL(`${name}.json`, folder)));
		assert.equal(isSelectedEvents(events), true);
		const result = events.findLastIndex((event) => event.type === 'wildPickinsSpinResult');
		const resumed = [
			{ type: 'createBonusSnapshot', index: 0, bookEvents: events.slice(0, result + 1) },
			...events.slice(result + 1),
		];
		assert.equal(isSelectedEvents(resumed), true);
		assert.equal(isSelectedEvents(events.slice(0, 1)), true);
	}
	assert.equal(isSelectedEvents([{ type: 'finalWin', index: 0, amount: 0 }]), false);
});

test('selected books start endings on the actual last reveal and caps never promise extra spins', () => {
	let endings = 0;
	for (const name of Object.keys(manifest.books)) {
		const { events } = JSON.parse(readFileSync(new URL(`${name}.json`, folder)));
		for (const [index, event] of events.entries()) {
			if (event.type === 'reveal') {
				const next = events
					.slice(index + 1)
					.find((e) => e.type === 'reveal' || e.type === 'freeSpinEnd');
				const plan = planBonusEnding(events, event);
				assert.equal(Boolean(plan), event.gameType === 'freegame' && next?.type === 'freeSpinEnd');
				if (plan) {
					endings++;
					assert.equal(plan.total, next.amount);
				}
			}
			if (event.type === 'wildPickinsSpinResult' && event.endReason === 'roundCap') {
				const cues = bonusCues(event, 30, 500000);
				assert.ok(cues.some((cue) => cue.text.includes('no extra spins granted')));
				assert.ok(cues.every((cue) => !cue.text.includes('TOTAL ·')));
			}
		}
	}
	assert.equal(endings, 5);
});

test('presentation delays cancel immediately and reject an already cancelled run', async () => {
	const controller = new AbortController();
	const pending = presentationWait(60000, controller.signal);
	controller.abort();
	await assert.rejects(pending, { name: 'AbortError' });
	await assert.rejects(presentationWait(60000, controller.signal), { name: 'AbortError' });
	await presentationWait(0);
});

test('line totals keep a finite lifetime and ultra releases the board before the total exits', () => {
	for (const speed of ['base', 'quick', 'ultra'])
		for (const count of [1, 5, 25]) {
			const timing = getWinLineTiming(count, speed, 'collect');
			assert.ok(Number.isFinite(timing.totalDuration) && timing.totalDuration > 0);
			assert.ok(timing.releaseAt <= timing.totalDuration);
			if (speed === 'ultra') assert.ok(timing.releaseAt < timing.totalDuration);
		}
});
