import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import {configureShippedAudio, recordingRoutes} from './audioConfig.mjs';
import {scatterAnticipation} from './scatterAnticipation.ts';
const audio = JSON.parse(readFileSync(new URL('../../static/assets/audio/sounds.json', import.meta.url)));
test('shipped clips retain cue gain, trim/loop regions, and Engine asset base paths', () => {
 const original = structuredClone(audio);
 const configured = configureShippedAudio(audio, '/wild-pickins');
 assert.deepEqual(audio, original);
 assert.deepEqual(configured.audio.config, audio.config);
 assert.deepEqual(configured.audio.src, ['/wild-pickins/assets/audio/sounds.mp3']);
 for (const [name, route] of Object.entries(recordingRoutes)) {
  assert.ok(existsSync(new URL(`../../static/assets/audio/effects/${route.file}`, import.meta.url)));
  assert.deepEqual(configured.audio.sprite[name], [0, route.duration, route.loop]);
  assert.equal(configured.sources[name], `/wild-pickins/assets/audio/effects/${route.file}`);
 }
 assert.deepEqual(configured.audio.sprite.bgm_main, audio.sprite.bgm_main);
 assert.deepEqual(configured.audio.sprite.bgm_freespin, audio.sprite.bgm_freespin);
 assert.throws(() => configureShippedAudio({sprite:{}, config:{}}), /Missing shipped audio cue/);
});
test('music and production cues have finite positive lengths and gain', () => {
 for (const [name, region] of Object.entries(audio.sprite)) {
  assert.ok(Number.isFinite(region[0]) && region[0] >= 0, name);
  assert.ok(Number.isFinite(region[1]) && region[1] > 0, name);
  assert.ok(Number.isFinite(audio.config[name].volume) && audio.config[name].volume >= 0, name);
 }
});
test('scatter anticipation derives presentation from visible symbols without modifying books', () => {
 const board = Array.from({length:5}, () => Array.from({length:5}, () => ({name:'C01'})));
 board[0][0] = {name:'S'}; board[0][1] = {name:'S'}; board[1][2] = {name:'S'};
 const original = structuredClone(board);
 assert.deepEqual(scatterAnticipation(board), [0,0,1,1,1]);
 assert.deepEqual(scatterAnticipation(board,true), [0,0,0,0,0]);
 assert.deepEqual(board,original);
});
