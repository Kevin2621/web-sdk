import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {validateBonusFixture} from './bonusFixtureAdapter.mjs';
const dir=new URL('../stories/data/wild-pickins-bonus/',import.meta.url);
const load=n=>JSON.parse(readFileSync(new URL(n,dir),'utf8'));
test('all 15 C02-validated bonus books are accepted',async()=>{
 const files=readdirSync(dir);assert.equal(files.length,15);
 for(const f of files) await validateBonusFixture(load(f));
});
for(const [name,mutate] of [
 ['extra award',b=>b.events.find(e=>e.type==='wildPickinsSpinResult').grantedExtraSpins=99],
 ['hidden scatter counted',b=>b.events.find(e=>e.type==='wildPickinsSpinResult').nominalRetriggerAward=5],
 ['lost sticky',b=>b.events.find(e=>e.type==='reveal').stickyBefore=[{reel:0,row:0}]],
 ['wrong total',b=>b.events.at(-1).amount=999999],
])test(`reject modified ${name}`,async()=>{const b=load('hidden-scatter.json');mutate(b);await assert.rejects(validateBonusFixture(b));});
