import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
import vm from 'node:vm';
import {createScatterSound} from './scatterSound.mjs';
import {audioMix, configureShippedAudio} from './audioConfig.mjs';
import {bonusEndingTiming} from './bonusEnding.mjs';

// Exercise the real component's event handlers with deterministic audio/timer ports.
function setup() {
 const source=readFileSync(new URL('../components/Sound.svelte',import.meta.url),'utf8');
 const script=source.match(/<script lang="ts">([\s\S]*?)<\/script>/)[1].replace(/^\s*import .*?;\s*$/gm,'');
 const calls=[], cleanups=[], timers=new Map();let timerId=0, handlers;
 const player=kind=>Object.fromEntries(['play','stop','fade','rate'].map(method=>[method,options=>calls.push({kind,method,...options})]));
 const sound={players:{music:player('music'),once:player('once'),loop:player('loop')},stop:options=>calls.push({kind:'all',method:'stop',...options}),fade:options=>calls.push({kind:'all',method:'fade',...options})};
 const raw=JSON.parse(readFileSync(new URL('../../static/assets/audio/sounds.json',import.meta.url)));
 const audio=configureShippedAudio(raw).audio;
 const context={stateApp:{loadedAssets:{sound:audio}},stateGame:{gameType:'basegame',board:[],scatterCounter:0},stateXstateDerived:{isIdle:()=>true},eventEmitter:{subscribeOnMount:value=>{handlers=value;}}};
 vm.runInNewContext(stripTypeScriptTypes(script),{
  sound, audioState:{audio}, audioMix, context, getContext:()=>context,
  createScatterSound, bonusEndingTiming, bonusEnding:{cancel:()=>{}},
  stateBet:{activeBetModeKey:'base'}, SECOND:1000,
  onMount:fn=>fn(),onDestroy:fn=>cleanups.push(fn),untrack:fn=>fn(),$effect:fn=>fn(),
  performance:{now:()=>1000},waitForTimeout:async()=>{},
  setTimeout:fn=>{timers.set(++timerId,fn);return timerId;},clearTimeout:id=>timers.delete(id),
 });
 calls.length=0;
 return {calls,handlers,context,timers,destroy:()=>cleanups.forEach(fn=>fn())};
}
test('Continue starts both shipped accents and bonus music in one event',()=>{
 const s=setup();s.handlers.soundBonusContinue();
 assert.deepEqual(s.calls.filter(c=>c.method==='play').map(c=>c.name),['sfx_bonus_continue_wood_zap','sfx_bonus_continue_spell','bgm_freespin']);
 s.destroy();assert.equal(s.timers.size,0);
});
test('bonus ending selects each tier and resumes the base loop under its fade',()=>{
 for(const [tier,summary] of [['quiet',undefined],['modest','sfx_bonus_summary_modest'],['strong','sfx_bonus_summary_strong'],['grand','sfx_youwon_panel']]) {
  const s=setup();s.handlers.soundBonusEnding({phase:'begin',tier});
  assert.equal(s.calls.some(c=>c.method==='play'&&c.name==='sfx_bonus_ending_riser'),tier==='grand');
  s.calls.length=0;s.handlers.soundBonusEnding({phase:'summary',tier});
  assert.deepEqual(s.calls.filter(c=>c.method==='play').map(c=>c.name),summary?[summary]:[]);
  s.calls.length=0;s.handlers.soundBonusEnding({phase:'return',tier});
  assert.ok(s.calls.some(c=>c.method==='play'&&c.name==='bgm_main'));
  assert.ok(s.calls.some(c=>c.method==='fade'&&c.name==='bgm_main'&&c.to===1&&c.duration===bonusEndingTiming.returnFade));
  s.destroy();assert.equal(s.timers.size,0);
 }
});
test('cancellation clears anticipation timers and prevents a late riser',()=>{
 const s=setup();s.handlers.soundScatterSequenceStart({total:3,baseGame:true,anticipation:true});
 s.handlers.soundScatterLand();s.handlers.soundScatterLand();
 assert.ok(s.timers.size>0);
 s.handlers.soundInteractionsStop();assert.equal(s.timers.size,0);
 const length=s.calls.length;s.handlers.soundScatterLand();
 assert.equal(s.calls.length,length);s.destroy();
});
