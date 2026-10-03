import test from 'node:test';
import assert from 'node:assert/strict';
import {createPlayMusic} from './createPlayMusic.svelte.ts';

test('retry a browser-blocked music request, but do not restart audible music',()=>{
 const map={};let active=false;const plays=[];
 const howl={play:input=>{plays.push(input);return 12;},pause:()=>{},playing:()=>active};
 const player=createPlayMusic({howl,getSoundMap:()=>map,
  newSound:soundName=>({soundName,soundId:0,soundState:'new'}),initSoundVolume:()=>{}});
 player.play({name:'menu'});
 assert.deepEqual(plays,['menu']);
 player.play({name:'menu'});
 assert.deepEqual(plays,['menu',12]);
 active=true;player.play({name:'menu'});
 assert.equal(plays.length,2);
});
