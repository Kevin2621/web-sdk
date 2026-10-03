import test from 'node:test';
import assert from 'node:assert/strict';
import { createPlayOnce } from './createPlayOnce.svelte.ts';
function setup(){
 const listeners={};const map={};let id=0;
 const howl={on:(event,fn)=>(listeners[event]??=[]).push(fn),play:()=>++id};
 const player=createPlayOnce({howl,getSoundMap:()=>map,newSound:soundName=>({soundName,soundState:'new'}),initSoundVolume:()=>{}});
 return {player,map,listeners,emit:(event,id)=>listeners[event].forEach(fn=>fn(id))};
}
test('thousands of impacts keep a constant listener count and release completed voices',()=>{
 const {player,map,listeners,emit}=setup();
 for(let i=1;i<=10000;i++){player.play({name:'impact'});emit('end',i);assert.equal(map.impact,undefined);}
 assert.equal(listeners.end.length,1);assert.equal(listeners.stop.length,1);
});
test('older payout tails do not delete the current overlapping voice; stop releases it',()=>{
 const {player,map,emit}=setup();
 player.play({name:'payout'});player.play({name:'payout',forcePlay:true});
 emit('end',1);assert.equal(map.payout.soundId,2);
 emit('stop',2);assert.equal(map.payout,undefined);
 player.play({name:'payout'});assert.equal(map.payout.soundId,3);
});
