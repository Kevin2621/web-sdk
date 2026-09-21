import assert from 'node:assert/strict';
import test from 'node:test';
import { socialLanguage } from './socialLanguage.ts';

test('uses complete phrases before individual words', () => {
	assert.equal(socialLanguage('BUY BONUS · TOTAL BET · PAID OUT'), 'GET BONUS · TOTAL PLAY · WON');
	assert.equal(socialLanguage('Place your bet'), 'Come and play');
	assert.equal(socialLanguage('Bonus buy activated'), 'Bonus activated');
});

test('covers controls, metadata, and balance errors', () => {
	assert.equal(socialLanguage('Bet'), 'Play');
	assert.equal(socialLanguage('PAYTABLE · PAYLINES'), 'WIN TABLE · WIN LINES');
	assert.equal(
		socialLanguage('Activated for 100x the player bet amount.'),
		'Activated for 100x the play amount.',
	);
	assert.equal(
		socialLanguage(
			'INSUFFICIENT FUNDS TO PLACE THIS BET. PLEASE ADD FUNDS TO YOUR ACCOUNT OR LOWER THE BET LEVEL.',
		),
		'INSUFFICIENT BALANCE TO PLAY THIS ROUND. PLEASE GET COINS OR LOWER THE PLAY LEVEL.',
	);
});

test('preserves amounts, unrelated words, and allowed win terminology', () => {
	const text =
		'Last win · Bonus win · Stop on bonus · SC 1,000.00 · alphabet · display · creditable';
	assert.equal(socialLanguage(text), text);
	assert.equal(
		socialLanguage(socialLanguage('BUY BONUS · BET · PAYTABLE')),
		'GET BONUS · PLAY · WIN TABLE',
	);
});
