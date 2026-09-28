import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import test from 'node:test';
import { compile } from 'svelte/compiler';

const here = path.dirname(fileURLToPath(import.meta.url));
const shared = path.resolve(here, '../../../../packages/components-ui-html/src/components');
const read = (folder, name) => readFileSync(path.join(folder, name), 'utf8');
const cssHash = (source) => createHash('sha256').update(source.slice(source.indexOf('<style>'))).digest('hex');

for (const name of ['PlayerControlsSurface.svelte', 'BonusPurchaseDialog.svelte']) {
 test(`${name} compiles with no Svelte warnings and no game dependency`, () => {
  const source = read(shared, name);
  const output = compile(source, { filename: name, generate: 'client' });
  assert.deepEqual(output.warnings, []);
  assert.doesNotMatch(source, /from\s+['"][^'"]*(?:wild-pickins|state-shared|game\/|\.\.\/game)/);
  assert.doesNotMatch(source, /Wild Pickins|Golden Picks|scatter landing screen shakes/);
 });
}

test('control surface CSS matches the approved restored UI', () => {
 assert.equal(cssHash(read(shared, 'PlayerControlsSurface.svelte')), '510aae3386b74c9b299fd16839804485fe49b46400e68348649d541315ccd8b5');
});

test('Wild Harvest information requests use the glass catalog', () => {
 const game = read(here, 'Game.svelte');
 assert.match(game, /<Modals[^>]*showLegacyInformation=\{false\}/);
 assert.match(game, /<InformationCatalog[\s\S]*stateModal\.modal\?\.name === 'payTable'/);
 const catalog = read(here, 'InformationCatalog.svelte');
 assert.match(catalog, /\.catalog::backdrop[\s\S]*backdrop-filter:/);
});

test('Wild Pickins adapters contain no control or dialog styling', () => {
 for (const name of ['PlayerControls.svelte', 'BonusMenu.svelte']) {
  const source = read(here, name);
  assert.doesNotMatch(source, /<style>|class="(?:player-controls|info-dialog|bonus-menu)"/);
 }
});
