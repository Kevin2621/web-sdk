import test from 'node:test';
import assert from 'node:assert/strict';
import {routeHowls} from './routeHowls.mjs';

test('standalone voices route resume, fades, volumes, callbacks and global cleanup',()=>{
 const calls=[];
 function mock(name,id){return Object.fromEntries(['play','playing','stop','pause','volume','fade','rate','on','unload'].map(method=>[method,(...args)=>{calls.push([name,method,...args]);return method==='play'?id:true;}]));}
 const main=mock('main',1),extra=mock('extra',2);
 const howl=routeHowls(main,{bonus:extra});
 assert.equal(howl.play('base'),1);assert.equal(howl.play('bonus'),2);
 howl.pause(2);howl.play(2);howl.fade(0,1,800,2);howl.volume(.4,1);howl.rate(1.2,2);
 assert.deepEqual(calls.slice(2),[['extra','pause',2],['extra','play',2],['extra','fade',0,1,800,2],['main','volume',.4,1],['extra','rate',1.2,2]]);
 const callback=()=>{};howl.on('end',callback);
 assert.deepEqual(calls.slice(-2),[['main','on','end',callback],['extra','on','end',callback]]);
 howl.stop();howl.unload();
 assert.deepEqual(calls.slice(-4),[['main','stop'],['extra','stop'],['main','unload'],['extra','unload']]);
});
