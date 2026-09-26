import test from 'node:test';
import assert from 'node:assert/strict';
import {createScatterSound,visibleScatterCount} from './scatterSound.mjs';
const make=()=>{const events=[];return {events,cue:createScatterSound({play:name=>events.push(['play',name]),setBaseGain:(gain,ms)=>events.push(['gain',gain,ms])})};};
test('only visible, unsuppressed scatters count, on any reel or row',()=>{
 const board=Array.from({length:5},()=>Array.from({length:5},()=>({name:'C01'})));
 board[0][0]={name:'S'};board[4][4]={name:'S'};
 board[1][3]={name:'S'};board[3][1]={name:'S'};board[4][2]={name:'S',suppressFixtureLanding:true};
 assert.equal(visibleScatterCount(board),2);
});
test('five actual impacts play levels 1 through 5, with silence before the fifth cue',()=>{
 const {cue,events}=make();cue.start(5,true);
 assert.deepEqual(events[0],['gain',.9,250]);
 for(let i=0;i<5;i++)cue.land();
 assert.deepEqual(events.filter(e=>e[0]==='play').map(e=>e[1]),Array.from({length:5},(_,i)=>`sfx_scatter_stop_${i+1}`));
 assert.deepEqual(events.slice(-2),[['gain',0,0],['play','sfx_scatter_stop_5']]);
 const gains=events.filter(e=>e[0]==='gain').map(e=>e[1]);
 assert.ok(gains.every((g,i)=>i===0||g<=gains[i-1]));
 const length=events.length;cue.land();assert.equal(events.length,length);
});
test('three/four scatter triggers also reach silence on their last hit',()=>{
 for(const count of [3,4]){const {cue,events}=make();cue.start(count,true);for(let i=0;i<count;i++)cue.land();assert.deepEqual(events.at(-2),['gain',0,0]);}
});
test('bonus scatters ascend without ducking base music; new spins restart level one',()=>{
 for(const [count,base] of [[5,false]]){const {cue,events}=make();cue.start(count,base);for(let i=0;i<count;i++)cue.land();assert.deepEqual(events.filter(e=>e[0]==='gain'),[['gain',1,250]]);cue.start(1,base);cue.land();assert.equal(events.at(-1)[1],'sfx_scatter_stop_1');}
});
test('cancellation restores music and disarms late impacts, even during turbo',()=>{
 const {cue,events}=make();cue.start(5,true);cue.land();cue.reset();assert.deepEqual(events.at(-1),['gain',1,250]);const length=events.length;cue.land();assert.equal(events.length,length);cue.start(0,true);cue.land();assert.equal(events.at(-1)[0],'gain');
});

test('non-triggering base scatters have no guitar, riser, or music ducking',()=>{
 for(const count of [0,1,2]){
  const {cue,events}=make();cue.start(5,true);cue.land();events.length=0;
  cue.start(count,true);cue.planRiser(1000);for(let i=0;i<count;i++)cue.land();
  assert.deepEqual(events,[['gain',1,250]]);
 }
});
