import test from 'node:test';
import assert from 'node:assert/strict';
import {curtainGeometry,curtainSeeds} from './seedCurtain.mjs';
test('curtain covers portrait and landscape viewports at the scene handoff',()=>{
 assert.equal(curtainSeeds.length,35);
 for(const [w,h] of [[390,844],[1920,1080],[844,390],[2560,1080]]){
  for(const p of [.45,.5,.55]){
   const g=curtainGeometry(p,w,h);
   assert.ok(g.top+g.tile*.35<=0);
   assert.ok(g.top+g.sheetHeight-g.tile*.35>=h);
  }
  const g=curtainGeometry(1,w,h);assert.ok(g.top>h);
 }
});
test('Continue waits for coverage, ignores repeat input, and abort clears work',async()=>{
 const names=['$state','requestAnimationFrame','cancelAnimationFrame'];
 const originals=Object.fromEntries(names.map(k=>[k,globalThis[k]]));
 const frames=new Map();let id=0;
 globalThis.$state=v=>v;
 globalThis.requestAnimationFrame=fn=>{frames.set(++id,fn);return id;};
 globalThis.cancelAnimationFrame=id=>frames.delete(id);
 const tick=offset=>{const work=[...frames.values()];frames.clear();work.forEach(fn=>fn(performance.now()+offset));};
 try{
  const m=await import('./seedCelebration.svelte.ts');let covers=0;
  const sounds=[];
  const run=m.celebrateSeeds(10,undefined,()=>covers++,e=>sounds.push(e));
  for(let i=0;i<10;i++)tick(4560+i*160);tick(6300);
  assert.equal(m.seedCelebration.displayAward,10);
  assert.equal(sounds.filter(e=>e.type==='soundOnce'&&e.name==='sfx_fs_respins').length,10);
  assert.equal(sounds.filter(e=>e.type==='soundOnce'&&e.name==='sfx_bonus_close').length,1);
  assert.equal(m.seedCelebration.waiting,true);assert.equal(covers,0);
  m.continueSeedCelebration();m.continueSeedCelebration();assert.equal(frames.size,1);
  m.seedBagBurst('reward');tick(100);assert.equal(covers,0);
  m.completeSeedContinue();m.completeSeedContinue();assert.equal(frames.size,1);
  tick(900);assert.equal(covers,1);assert.ok(m.seedCelebration.exitProgress>=.35&&m.seedCelebration.exitProgress<=.55);
  tick(2000);await run;assert.equal(m.seedCelebration.active,false);assert.equal(covers,1);
  const abort=new AbortController();const canceled=m.celebrateSeeds(15,abort.signal);
  for(let i=0;i<20;i++)tick(4560+i*160);tick(9000);m.continueSeedCelebration();abort.abort();await canceled;
  assert.equal(frames.size,0);m.completeSeedContinue();assert.equal(frames.size,0);
  const fallback=m.celebrateSeeds(20);for(let i=0;i<20;i++)tick(4560+i*160);tick(9000);m.continueSeedCelebration();
  tick(4000);assert.equal(m.seedCelebration.exitProgress,.35);assert.equal(m.seedCelebration.active,true);
  tick(5000);await fallback;assert.equal(frames.size,0);
 }finally{for(const [k,v]of Object.entries(originals)){if(v===undefined)delete globalThis[k];else globalThis[k]=v;}}
});

test('choreography is deterministic with finite transforms and bounded burst opacity',async()=>{
 const {clusterPose,loosePose,looseSeeds,burstPose}=await import('./seedCurtain.mjs');
 for(const [w,h]of [[390,844],[1920,1080],[844,390]]){
  for(let step=0;step<=100;step++){
   const p=step/100;
   const poses=[...curtainSeeds.map(s=>clusterPose(s,p,w,h)),...looseSeeds.map(s=>loosePose(s,p,w,h))];
   for(const pose of poses){assert.ok(Object.values(pose).every(Number.isFinite));assert.ok(pose.width>0&&pose.height>0);}
   for(let i=0;i<12;i++){const b=burstPose(i,p,w,h);assert.ok(b.alpha>=0&&b.alpha<=1);}
  }
  const a=clusterPose(curtainSeeds[0],.3,w,h);
  assert.deepEqual(a,clusterPose(curtainSeeds[0],.3,w,h));
  assert.notEqual(a.rotation,clusterPose(curtainSeeds[0],.6,w,h).rotation);
 }
});

test('bag volleys launch at the mouth, clear the top, and fall back down',async()=>{
 const {makeBagVolley,bagVolleyPose,ENTRY_CURTAIN_START,ENTRY_CURTAIN_END}=await import('./seedCurtain.mjs');
 const seeds=makeBagVolley(18,1234);
 assert.deepEqual(seeds,makeBagVolley(18,1234));
 assert.notDeepEqual(seeds,makeBagVolley(18,1235));
 assert.ok(new Set(seeds.map(s=>s.ascent)).size>10);
 for(const [w,h] of [[390,844],[1920,1080],[844,390]]){
  for(const seed of seeds){
   const x=w*.3,y=h*.7,size=120;
   const start=bagVolleyPose(seed,seed.delay,x,y,size,w,h);
   assert.ok(Math.abs(start.x-x)<1e-8&&Math.abs(start.y-y)<1e-8);
   const top=bagVolleyPose(seed,seed.delay+seed.ascent,x,y,size,w,h);
   assert.ok(top.y+top.height<0,'the entire seed clears the screen');
   const returning=bagVolleyPose(seed,seed.delay+seed.ascent*2,x,y,size,w,h);
   assert.ok(returning.y>top.y&&Math.abs(returning.y-y)<1e-7);
   for(let i=0;i<=60;i++)assert.ok(Object.values(bagVolleyPose(seed,i/30,x,y,size,w,h)).every(Number.isFinite));
  }
 }
 const rewardHandoff=(.425-ENTRY_CURTAIN_START)/(ENTRY_CURTAIN_END-ENTRY_CURTAIN_START);
 assert.ok(rewardHandoff>=.45&&rewardHandoff<=.55);
});

test('curtain never stops or jumps at the coverage handoff and begins off-screen',async()=>{
 const {clusterPose,loosePose,looseSeeds}=await import('./seedCurtain.mjs');
 for(const [w,h] of [[390,844],[1920,1080],[844,390]]){
  const eps=1e-5;
  for(const p of [.035,.45,.5,.55,.96]){
   const left=(curtainGeometry(p,w,h).top-curtainGeometry(p-eps,w,h).top)/eps;
   const right=(curtainGeometry(p+eps,w,h).top-curtainGeometry(p,w,h).top)/eps;
   assert.ok(left>0&&right>0);
   assert.ok(Math.abs(left-right)/left<.001);
  }
  for(const p of [0,1]){
   const poses=[...curtainSeeds.map(s=>clusterPose(s,p,w,h)),...looseSeeds.map(s=>loosePose(s,p,w,h))];
   for(const pose of poses){
    const extent=(Math.abs(Math.sin(pose.rotation))*pose.width+Math.abs(Math.cos(pose.rotation))*pose.height)/2;
    assert.ok(p===0?pose.y+extent<0:pose.y-extent>h,'seeds must cross the edge rather than appear/disappear');
   }
  }
 }
});

test('the same volley grows continuously from mouth-sized seeds into the curtain',async()=>{
 const {makeBagVolley,growingVolleyPose,ENTRY_CURTAIN_START,ENTRY_CURTAIN_END}=await import('./seedCurtain.mjs');
 const seeds=makeBagVolley(18,4321);
 for(const [w,h]of [[390,844],[1920,1080]])for(const [i,seed]of seeds.entries()){
  const pose=t=>growingVolleyPose(seed,t,w*.3,h*.7,120,w,h,Math.max(0,Math.min(1,((t+.8)/8-ENTRY_CURTAIN_START)/(ENTRY_CURTAIN_END-ENTRY_CURTAIN_START))),i,54);
  const first=pose(seed.delay);
  assert.ok(Math.abs(first.x-w*.3)<1e-7&&Math.abs(first.y-h*.7)<1e-7);
  assert.ok(first.height<20);
  let prev=first.height;
  for(let t=seed.delay;t<2;t+=.01){
   const p=pose(t);assert.ok(Object.values(p).every(Number.isFinite));
   assert.ok(p.height>=prev-1e-8);prev=p.height;
  }
  assert.ok(pose(2).height>first.height*10);
  for(const t of [seed.delay+seed.ascent*.8,seed.delay+seed.ascent*.8+.65]){
   const a=pose(t-1e-6),b=pose(t+1e-6);
   assert.ok(Math.hypot(a.x-b.x,a.y-b.y)<.1,'no position jump at handoff');
  }
 }
});

test('wave crests barely beyond the top silhouette and rolls down continuously',async()=>{
 const {makeBagVolley,growingVolleyPose,ENTRY_CURTAIN_START,ENTRY_CURTAIN_END}=await import('./seedCurtain.mjs');
 for(const [w,h]of [[390,844],[1920,1080],[844,390]]){
  for(const [i,seed]of makeBagVolley(18,4321).entries()){
   const pose=t=>growingVolleyPose(seed,t,w*.3,h*.7,120,w,h,Math.max(0,Math.min(1,((t+.8)/8-ENTRY_CURTAIN_START)/(ENTRY_CURTAIN_END-ENTRY_CURTAIN_START))),i,54);
   const turn=seed.delay+seed.ascent;
   const crest=pose(turn);
   const extent=(Math.abs(Math.sin(crest.rotation))*crest.width+Math.abs(Math.cos(crest.rotation))*crest.height)/2;
   assert.ok(crest.y<0);
   assert.ok(crest.y+extent>=-1e-7&&crest.y+extent<crest.height*.03);
   assert.ok(pose(turn+.35).height>crest.height,'seeds swell toward the viewer after cresting');
   assert.ok(Math.abs(pose(turn-1e-5).y-pose(turn+1e-5).y)<.01);
   let previous=pose(turn).y;
   for(let t=turn;t<3.5;t+=.01){const p=pose(t);assert.ok(p.y>=previous-1e-7);previous=p.y;}
  }
 }
});

test('reveal edge tracks the middle of the falling wave, ahead of its trailing seeds',async()=>{
 const {curtainReveal,seedWaveReveal,CURTAIN_HANDOFF}=await import('./seedCurtain.mjs');
 for(const [w,h]of [[390,844],[1920,1080],[844,390],[2560,1080]]){
  assert.equal(curtainReveal(CURTAIN_HANDOFF,w,h),0);
  let previous=0;
  for(let i=0;i<=100;i++){
   const p=i/100,g=curtainGeometry(p,w,h),reveal=curtainReveal(p,w,h);
   assert.ok(reveal>=previous&&reveal<=1);previous=reveal;
   if(reveal>0&&reveal<1)assert.ok(Math.abs(reveal*h-(g.top+g.sheetHeight/2))<1e-6);
   if(g.top>=h*.5)assert.equal(reveal,1,'new screen is complete before the trailing edge clears');
  }
  assert.equal(curtainReveal(1,w,h),1);
 }
 assert.equal(seedWaveReveal([{y:80},{y:20},{y:50}],100),.5);
 assert.equal(seedWaveReveal([{y:80},{y:20}],100),.5);
 assert.equal(seedWaveReveal([{y:200},{y:150}],100),1);
 assert.equal(seedWaveReveal([],100),0);
});
