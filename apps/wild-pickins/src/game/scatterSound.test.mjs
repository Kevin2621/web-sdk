import test from 'node:test';
import assert from 'node:assert/strict';
import {createScatterSound,visibleScatterCount,shouldPlayReelStop} from './scatterSound.mjs';

function make(){
 const events=[];
 const cue=createScatterSound({
  play:name=>events.push(['play',name]),
  startRiser:()=>events.push(['riser','start']),
  stopRiser:()=>events.push(['riser','stop']),
  startTick:()=>events.push(['tick','start']),
  stopTick:()=>events.push(['tick','stop']),
  onSecondScatter:()=>events.push(['music','fade-to-final']),
  onFinalScatter:name=>events.push(['final-scatter',name]),
  onFinalImpact:()=>events.push(['music','silent']),
  onMiss:()=>events.push(['music','restore']),
 });
 return {cue,events};
}

test('only visible, unsuppressed scatters count',()=>{
 const board=Array.from({length:5},()=>Array.from({length:5},()=>({name:'C01'})));
 board[0][0]={name:'S'};board[4][4]={name:'S'};
 board[1][3]={name:'S'};board[3][1]={name:'S'};board[4][2]={name:'S',suppressFixtureLanding:true};
 assert.equal(visibleScatterCount(board),2);
});

test('reel stops remain on ordinary and non-scatter anticipated reels',()=>{
 assert.equal(shouldPlayReelStop({ultra:false,baseGame:true,anticipated:false,scatter:true}),true);
 assert.equal(shouldPlayReelStop({ultra:false,baseGame:true,anticipated:true,scatter:false}),true);
 assert.equal(shouldPlayReelStop({ultra:false,baseGame:true,anticipated:true,scatter:true}),false);
 assert.equal(shouldPlayReelStop({ultra:false,baseGame:false,anticipated:true,scatter:true}),true);
 assert.equal(shouldPlayReelStop({ultra:true,baseGame:true,anticipated:false,scatter:false}),false);
});

test('second scatter starts the windup after its hit; later scatters retain their hits',()=>{
 const {cue,events}=make();cue.start(5,true,true);events.length=0;
 for(let i=0;i<5;i++)cue.land();
 assert.deepEqual(events.slice(0,4),[
  ['play','sfx_scatter_stop_1'],['play','sfx_scatter_stop_2'],
  ['riser','start'],['tick','start']]);
 assert.deepEqual(events[4],['music','fade-to-final']);
 assert.deepEqual(events.filter(e=>e[0]==='play').map(e=>e[1]),Array.from({length:5},(_,i)=>`sfx_scatter_stop_${i+1}`));
 assert.deepEqual(events.at(-1),['final-scatter','sfx_scatter_stop_5']);
 cue.finalImpact();assert.deepEqual(events.slice(-2),[['tick','stop'],['music','silent']]);
 const length=events.length;cue.land();assert.equal(events.length,length);
});

test('two-scatter anticipation misses and restores the base music at final impact',()=>{
 const {cue,events}=make();cue.start(2,true,true);events.length=0;
 cue.land();cue.land();cue.finalImpact();
 assert.deepEqual(events,[
  ['play','sfx_scatter_stop_1'],['play','sfx_scatter_stop_2'],
  ['riser','start'],['tick','start'],['music','fade-to-final'],['tick','stop'],['music','silent'],
  ['music','restore']]);
});

test('one scatter has a landing hit; turbo and bonus spins do not start the windup',()=>{
 for(const [count,base,anticipation] of [[1,true,true],[2,true,false],[5,false,true]]){
  const {cue,events}=make();cue.start(count,base,anticipation);events.length=0;
  for(let i=0;i<count;i++)cue.land();cue.finalImpact();
  assert.equal(events.some(e=>e[0]==='riser'&&e[1]==='start'),false);
  assert.equal(events.some(e=>e[0]==='tick'&&e[1]==='start'),false);
  assert.deepEqual(events.filter(e=>e[0]==='play').map(e=>e[1]),Array.from({length:count},(_,i)=>`sfx_scatter_stop_${i+1}`));
 }
});

test('cancellation disarms late impacts and stops the riser',()=>{
 const {cue,events}=make();cue.start(3,true,true);cue.land();cue.land();
 cue.reset();assert.deepEqual(events.slice(-2),[['riser','stop'],['tick','stop']]);
 const length=events.length;cue.land();cue.finalImpact();assert.equal(events.length,length);
});
