import test from 'node:test';
import assert from 'node:assert/strict';
import {createAudioBank} from './createAudioBank.mjs';
function setup() {
 const instances=[],listeners=new Map();let time=100;
 class FakeHowl {
  constructor(options){this.options=options;this.active=new Set();this.levels=new Map();this.next=1;instances.push(this);}
  play(id){if(typeof id!=='number')id=this.next++;this.active.add(id);return id;}
  playing(id){return this.active.has(id);}
  stop(id){this.active.delete(id);}
  volume(value,id){this.levels.set(id,value);}
  loop(){} on(){} off(){}
  unload(){this.active.clear();this.unloaded=true;}
 }
 const target={hidden:false,addEventListener:(e,fn)=>listeners.set(e,fn),removeEventListener:e=>listeners.delete(e)};
 const howler={ctx:{state:'running'},volume(){},mute(value){this.muted=value;}};
 const defs={click:{file:'effects.wav',channel:'effects',volume:.5,clip:[0,100]},
  hit:{file:'effects.wav',channel:'effects',volume:1,clip:[200,100]},
  music:{file:'music.mp3',channel:'music',volume:.5,loop:true}};
 const bank=createAudioBank(defs,{HowlClass:FakeHowl,howler,target,now:()=>time});
 bank.setVolumes(.8,.6);
 assert.equal(instances.length,0); // Nothing loads until first use.
 bank.onPlay('click',()=>{});bank.onPlay('music',()=>{});
 return {bank,instances,target,howler,listeners,tick:()=>time+=100};
}
test('share files, apply category/cue gain, coalesce simultaneous effects and restart without overlap',()=>{
 const {bank,instances,tick}=setup();assert.equal(instances.length,2);
 bank.play('click');bank.play('click');assert.equal(instances[0].active.size,1);
 assert.equal(instances[0].levels.get(1),.3);
 tick();bank.play('click');assert.deepEqual([...instances[0].active],[2]);
 bank.setGain('click',.5);assert.equal(instances[0].levels.get(2),.15);
 bank.setVolumes(0,0);assert.equal(instances[0].levels.get(2),0);bank.dispose();
});
test('retry blocked music without layering or restarting a playing loop',()=>{
 const {bank,instances}=setup();bank.play('music');bank.play('music');assert.equal(instances[1].next,2);
 instances[1].active.clear();bank.play('music');assert.deepEqual([...instances[1].active],[1]);bank.dispose();
});
test('hidden tabs stop effects and keep music inaudible; disposal releases files and listeners',()=>{
 const {bank,target,listeners,instances,howler}=setup();bank.play('click');
 target.hidden=true;listeners.get('visibilitychange')();assert.equal(howler.muted,true);
 assert.equal(instances[0].active.size,0);bank.play('hit');assert.equal(instances[0].active.size,0);
 bank.play('music');assert.equal(instances[1].active.size,1);
 target.hidden=false;listeners.get('pointerdown')();assert.equal(howler.muted,false);
 bank.dispose();assert.equal(listeners.size,0);assert.ok(instances.every(i=>i.unloaded));
 bank.play('click');assert.equal(instances[0].active.size,0);
});
