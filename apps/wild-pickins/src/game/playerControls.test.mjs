import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
import vm from 'node:vm';
import {selectedModes} from './selectedConfig.ts';

const source=readFileSync(new URL('../components/PlayerControls.svelte',import.meta.url),'utf8');
// Run the actual action bodies with template-state/event ports, without a DOM or wallet simulator.
function action(name,next,ports={}) {
 const begin=source.indexOf(`async function ${name}()`);
 const end=source.indexOf(`function ${next}()`,begin+1);
 const code=source.slice(begin,end).replace(/async\s*$/,'');
 const events=[];
 const stateBet={betAmount:1,balanceAmount:1000,activeBetModeKey:'bonus',autoSpinsCounter:0,isSpaceHold:false};
 const sandbox={locked:false,canAfford:true,betLocked:false,bonusAvailable:true,preview:false,
  stateModal:{modal:null},informationOpen:false,menu:undefined,autoPanel:undefined,
  playerSpeed:{mode:0},running:false,simulatedBonusArmed:false,
  bonusMode:'bonus',bonusCost:50,resetBonusWin:()=>{},onspin:undefined,onbuy:undefined,
  validCount:true,validLimits:true,lossEnabled:false,winEnabled:false,lossAmount:undefined,winAmount:undefined,
  chosen:10,stopOnBonus:true,stopReason:'',autoplaySettings:{stopOnBonus:true},stateBet,
  stateConfig:{jurisdiction:{disabledBuyFeature:false,disabledAutoplay:false}},
  context:{eventEmitter:{broadcast:event=>events.push(event)}},...ports};
 const result=vm.runInNewContext(stripTypeScriptTypes(code)+`\n${name}();`,sandbox);
 return {result,sandbox,events};
}
test('manual play dispatches the base mode through the template bet event',async()=>{
 const s=action('spin','auto');await s.result;
 assert.equal(s.sandbox.stateBet.activeBetModeKey,'base');
 assert.deepEqual(s.events.map(e=>e.type),['soundPressSpin','bet']);
 for(const port of [{locked:true},{canAfford:false},{stateModal:{modal:{name:'buyBonus'}}}]){
  const blocked=action('spin','auto',port);await blocked.result;assert.equal(blocked.events.length,0);
 }
});
test('autoplay uses the template autoBet actor and never loops local books',async()=>{
 const s=action('auto','settings');await s.result;
 assert.equal(s.sandbox.stateBet.activeBetModeKey,'base');
 assert.equal(s.sandbox.stateBet.autoSpinsCounter,10);
 assert.deepEqual(s.events.map(e=>e.type),['autoBet']);
 const preview=action('auto','settings',{preview:true});await preview.result;
 assert.equal(preview.events.length,0);assert.equal(preview.sandbox.stateBet.autoSpinsCounter,0);
});
test('each selected purchase dispatches its exact Engine mode; disabled buys dispatch nothing',async()=>{
 const modes=['bonus','standard_bonus_buy_medium','standard_bonus_buy_high'];
 assert.deepEqual(modes.map(mode=>selectedModes[mode].cost),[50,200,500]);
 assert.deepEqual(modes.map(mode=>selectedModes[mode].initialSpins),[10,15,20]);
 for(const mode of modes){
  const s=action('buyBonus','spin',{bonusMode:mode,bonusCost:selectedModes[mode].cost});await s.result;
  assert.equal(s.sandbox.stateBet.activeBetModeKey,mode);
  assert.deepEqual(s.events.map(e=>e.type),['bet']);
 }
 const disabled=action('buyBonus','spin',{stateConfig:{jurisdiction:{disabledBuyFeature:true}}});await disabled.result;
 assert.equal(disabled.events.length,0);
});
test('visual previews use provided book callbacks without sending live bet events',async()=>{
 let spin=0,buy;
 const s=action('spin','auto',{preview:true,onspin:async()=>{spin++;}});await s.result;
 assert.equal(spin,1);assert.equal(s.events.some(e=>e.type==='bet'),false);
 const b=action('buyBonus','spin',{preview:true,onbuy:async mode=>{buy=mode;},bonusMode:'standard_bonus_buy_high'});await b.result;
 assert.equal(buy,'standard_bonus_buy_high');assert.equal(b.events.length,0);
});

test('sound preferences clamp each channel, persist settings, and restore the previous master on unmute',()=>{
 const code=source.slice(source.indexOf('function mute()'),source.indexOf('let stopQueued'))+
  source.slice(source.indexOf('function save()'),source.indexOf('function controlKey'));
 const saved=new Map();
 const sandbox={stateSound:{volumeValueMaster:46,volumeValueMusic:50,volumeValueSoundEffect:50},rememberedVolume:50,
  localStorage:{setItem:(key,value)=>saved.set(key,value)}};
 vm.runInNewContext(stripTypeScriptTypes(code)+'\nmute();',sandbox);
 assert.equal(sandbox.stateSound.volumeValueMaster,0);
 vm.runInNewContext('mute(); volumeInput({currentTarget:{value:120}},"music"); volumeInput({currentTarget:{value:-20}},"effects");',sandbox);
 assert.equal(sandbox.stateSound.volumeValueMaster,46);
 assert.equal(sandbox.stateSound.volumeValueMusic,100);
 assert.equal(sandbox.stateSound.volumeValueSoundEffect,0);
 assert.deepEqual(JSON.parse(saved.get('wp-volume')),{master:46,music:100,effects:0});
});
test('UI motion and screen shake persist as independent preferences',()=>{
 const code=source.slice(source.indexOf('function saveMotion()'),source.indexOf('onMount(() =>',source.indexOf('function saveMotion()')));
 const saved=new Map();const sandbox={playerMotion:{uiReduced:true,shakeDisabled:false},localStorage:{setItem:(key,value)=>saved.set(key,value)}};
 vm.runInNewContext(stripTypeScriptTypes(code)+'\nsaveMotion();',sandbox);
 assert.equal(saved.get('wp-ui-reduced-motion'),'true');assert.equal(saved.get('wp-screen-shake-disabled'),'false');
});
