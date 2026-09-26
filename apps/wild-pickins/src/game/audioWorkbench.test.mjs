import test from 'node:test';
import assert from 'node:assert/strict';
import {defaultAudioSettings,validateAudioSettings,configuredAudio} from './audioWorkbench.mjs';
const audio={src:['sounds.mp3'],sprite:{bgm_main:[100,5000,true],sfx_youwon_panel:[6000,8230],sfx_money_drop:[15000,2200]},config:{bgm_main:{volume:.5},sfx_youwon_panel:{volume:.7},sfx_money_drop:{volume:.6}}};
test('remapping trims the original source without modifying it or changing event loop behavior',()=>{
 const original=structuredClone(audio),settings=defaultAudioSettings(audio);
 settings.cues.bgm_main={source:'sfx_money_drop',start:100,end:2000,volume:.3};
 const result=configuredAudio(audio,validateAudioSettings(settings,audio));
 assert.deepEqual(result.sprite.bgm_main,[15100,1900,true]);
 assert.deepEqual(result.config.bgm_main,{volume:.3});assert.deepEqual(audio,original);
});
test('summary duration follows the selected clip and overlap cannot exceed it',()=>{
 const settings=defaultAudioSettings(audio);settings.cues.sfx_youwon_panel={source:'sfx_money_drop',start:200,end:2000,volume:.4};
 assert.equal(validateAudioSettings(settings,audio).ending.summary,1800);
 settings.ending.returnOverlap=1900;assert.throws(()=>validateAudioSettings(settings,audio),/overlap/i);
});
test('rejects unknown sources, invalid trims, nonfinite values and incompatible JSON',()=>{
 for(const change of [s=>s.cues.bgm_main.source='missing',s=>s.cues.bgm_main.volume=NaN,s=>s.cues.bgm_main.end=6000,s=>s.cues.bgm_main.start=5000,s=>s.ending.returnFade=1200,s=>s.version=2]){
  const settings=defaultAudioSettings(audio);change(settings);assert.throws(()=>validateAudioSettings(settings,audio));
 }
});
test('saved settings survive a JSON round trip and defaults preserve gains and boundaries',()=>{
 const defaults=defaultAudioSettings(audio),saved=validateAudioSettings(JSON.parse(JSON.stringify(defaults)),audio);
 assert.deepEqual(saved,defaults);const rebuilt=configuredAudio(audio,saved);
 assert.deepEqual(rebuilt.sprite.bgm_main,audio.sprite.bgm_main);assert.equal(rebuilt.config.sfx_money_drop.volume,.6);
});

test('library assignments preserve trims, event looping, gain and JSON round trips',async()=>{
 const {recordingSources}=await import('./audioWorkbench.mjs');
 const library={'library:test':{duration:12000,src:'/__audio_library/test.mp3'}};
 const settings=defaultAudioSettings(audio);
 settings.cues.bgm_main={source:'library:test',start:100,end:11000,volume:.4};
 const saved=validateAudioSettings(JSON.parse(JSON.stringify(settings)),audio,library);
 const configured=configuredAudio(audio,saved,library);
 assert.deepEqual(configured.sprite.bgm_main,[100,10900,true]);
 assert.deepEqual(recordingSources(saved,library),{bgm_main:'/__audio_library/test.mp3'});
 assert.equal(configured.config.bgm_main.volume,.4);
 assert.deepEqual(configured.sprite.sfx_money_drop,[15000,2200,false]);
 settings.cues.bgm_main.end=13000;
 assert.throws(()=>validateAudioSettings(settings,audio,library));
});
test('old saved mixes adopt the new scatter sequence without replacing other choices',()=>{
 const updated=structuredClone(audio);
 for(let n=1;n<=5;n++){updated.sprite[`sfx_scatter_stop_${n}`]=[20000+n*3000,2100+n*10,false];updated.config[`sfx_scatter_stop_${n}`]={volume:.65};}
 const saved=defaultAudioSettings(updated);delete saved.scatterSequence;
 saved.cues.sfx_scatter_stop_1={source:'sfx_money_drop',volume:.1,start:0,end:100};
 saved.cues.bgm_main.volume=.23;
 const migrated=validateAudioSettings(saved,updated);
 assert.deepEqual(migrated.cues.sfx_scatter_stop_1,defaultAudioSettings(updated).cues.sfx_scatter_stop_1);
 assert.equal(migrated.cues.bgm_main.volume,.23);assert.equal(migrated.scatterSequence,1);
 migrated.cues.sfx_scatter_stop_1.volume=.4;
 assert.equal(validateAudioSettings(migrated,updated).cues.sfx_scatter_stop_1.volume,.4);
});
