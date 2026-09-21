import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {validateBaseFixture,mapVisibleBoard,mapSymbol} from './fixtureAdapter.mjs';
const folder=new URL('../stories/data/wild-pickins/',import.meta.url);
const load=name=>JSON.parse(readFileSync(new URL(name,folder),'utf8'));
test('all exported base books pass preflight',()=>{for(const f of readdirSync(folder))validateBaseFixture(load(f));});
test('padding maps semantic middle row once',()=>{const b=load('golden-line-win.json').events.find(e=>e.type==='wildPickinsSpinResult').finalBoard;assert.equal(mapVisibleBoard(b)[1][2].name,'W');assert.deepEqual(mapSymbol('C01'),{name:'H1'});});
for(const [name,mutate] of [
 ['duplicate index',b=>b.events[1].index=0],
 ['invalid target',b=>b.events[0].goldenTarget.reel=5],
 ['missing transform',b=>b.events[1].type='wildPickinsSpinResult'],
 ['unknown event',b=>b.events[1].type='unknown'],
 ['wrong total',b=>b.events.find(e=>e.type==='setTotalWin').amount=100],
 ['wrong final board',b=>b.events.find(e=>e.type==='wildPickinsSpinResult').finalBoard[1][1]='C01'],
]) test(`reject ${name}`,()=>{const b=load('golden-line-win.json');mutate(b);assert.throws(()=>validateBaseFixture(b));});
