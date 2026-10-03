import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { compile } from 'svelte/compiler';

test('Wild animation state compiles as a rune, not a subscription to its state prop', () => {
 const source = readFileSync(new URL('./WildSpine.svelte', import.meta.url), 'utf8');
 const { js } = compile(source, { filename: 'WildSpine.svelte', generate: 'client', dev: true });
 // A prop named `state` shadows the $state rune and produces a runtime
 // store_invalid_shape crash when the first Wild is mounted.
 assert.doesNotMatch(js.code, /store_get\([^\n]*['"]\$state['"]/);
});
