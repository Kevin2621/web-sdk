export const clamp01 = value => Math.max(0, Math.min(1, value));
const smooth = value => { const t=clamp01(value); return t*t*(3-2*t); };
// A deep stream crosses the viewport without stopping at the covered handoff.
// Extra off-screen margins keep the first/last large seeds from popping in/out.
export function curtainGeometry(progress, width, height) {
 const tile=Math.max(width/5,height/5)*1.5;
 const sheetHeight=height*1.3+tile*2;
 const p=clamp01(progress);
 const fall=p+.12*(p*p-p); // gently accelerating; continuous velocity throughout
 const top=-sheetHeight-tile*2+(height+sheetHeight+tile*4)*fall;
 return {top,tile,sheetHeight,covered:progress>=.45&&progress<=.55};
}
export const curtainSeeds=Array.from({length:35},(_,i)=>({
 column:i%5,row:Math.floor(i/5),variant:i%3+1,
 angle:((i*47)%12-6)*Math.PI/180,
 jitter:Math.sin(i*7.13)*.13,
}));

const noise = i => {const n=Math.sin(i*127.1+311.7)*43758.5453;return n-Math.floor(n);};
// Deterministic choreography: no physics, per-frame randomness, or allocations of sprites.
export function clusterPose(seed,progress,width,height){
 const g=curtainGeometry(progress,width,height);
 const id=seed.row*5+seed.column;
 const phase=noise(id)*Math.PI*2;
 const depth=.78+noise(id+80)*.45;
 const wave=Math.sin(progress*7+phase);
 return {
  x:(seed.column-.2+seed.jitter)*width/3.6 + wave*g.tile*.22,
  y:g.top+g.tile*.4+seed.row*(g.sheetHeight-g.tile*.8)/6
    +Math.sin(seed.column*1.7+progress*9)*g.tile*.28
    +(noise(id+12)-.5)*g.tile*.35,
  width:g.tile*3*depth,
  height:g.tile*.914*depth*(.91+.09*Math.cos(progress*11+phase)),
  rotation:seed.angle+Math.sin(progress*8+phase)*.22,
  tint:depth<.95?0xe2ba80:0xffffff,
 };
}
export const looseSeeds=Array.from({length:12},(_,i)=>({id:i,phase:noise(i+200),variant:i%3+1}));
export function loosePose(seed,progress,width,height){
 const g=curtainGeometry(progress,width,height);
 const t=clamp01(progress);
 const near=seed.id%3===0;
 const scale=near?1.1:.35+seed.phase*.28;
 const edge=seed.id%2===0?g.sheetHeight-g.tile*.14:g.tile*.16;
 return {
  x:(seed.id+.25)*width/11+Math.sin(t*8+seed.phase*6)*g.tile*.3,
  y:g.top+edge+Math.sin(seed.phase*8+t*10)*g.tile*.26,
  width:g.tile*scale*(.7+.3*Math.abs(Math.cos(t*8+seed.phase*4))),
  height:g.tile*scale,
  rotation:seed.phase*6+(seed.id%2?1:-1)*t*(3+seed.phase*5),
 };
}
export function burstPose(index,progress,width,height){
 const delay=(index%4)*.035;
 const t=clamp01((progress-delay)/(1-delay));
 const side=(index-5.5)/5.5;
 const speed=.75+noise(index+300)*.4;
 const bagSize=Math.min(420,width*.64,height*.65);
 const size=(18+noise(index+320)*20)*(1+t*.65);
 return {
  x:width*.5+side*width*.52*t+Math.sin(t*Math.PI)*side*width*.09,
  y:height*.48-bagSize*.3-height*.9*speed*t+height*.4*t*t,
  width:size*(.55+.45*Math.abs(Math.cos(t*7+index))),height:size,
  rotation:index+(index%2?1:-1)*t*(5+speed*3),
  alpha:progress<=delay?0:1-clamp01((t-.7)/.3),
 };
}

export const ENTRY_CURTAIN_START=.215;
export const ENTRY_CURTAIN_END=.62;
export function makeBagVolley(count,seed){
 return Array.from({length:count},(_,i)=>({
  id:i,variant:1+Math.floor(noise(seed+i*19)*3),
  delay:noise(seed+i*19+1)*.14,
  ascent:.68+noise(seed+i*19+2)*.23,
  lane:.04+noise(seed+i*19+3)*.92,
  apex:.08+noise(seed+i*19+4)*.17,
  size:.085+noise(seed+i*19+5)*.075,
  spin:(noise(seed+i*19+6)-.5)*13,
  phase:noise(seed+i*19+7)*Math.PI*2,
 }));
}
// Ballistic vertical motion: launch, clear the viewport, turn, then return.
// Horizontal flutter vanishes at launch so every seed originates at its bag.
export function bagVolleyPose(seed,elapsed,originX,originY,bagSize,width,height){
 const t=Math.max(0,elapsed-seed.delay);
 const apex=-height*seed.apex-bagSize*.2;
 const y=apex+(originY-apex)*(1-t/seed.ascent)**2;
 const spread=clamp01(t/seed.ascent);
 const drift=Math.sin(t*5+seed.phase)-Math.sin(seed.phase);
 const x=originX+(seed.lane*width-originX)*smooth(spread)+drift*bagSize*.12*spread;
 const size=bagSize*seed.size*(1+Math.min(t,1.5)*.35);
 return {x,y,width:size*(.65+.35*Math.abs(Math.cos(t*6+seed.phase))),height:size,
  rotation:seed.phase+t*seed.spin,
  alpha:elapsed<seed.delay||y>height+size?0:1};
}

// Keep each launched sprite and texture alive through the entire entrance.
// Crest just beyond the top edge, then swell toward the camera and roll down.
export function growingVolleyPose(seed,elapsed,originX,originY,bagSize,width,height,progress,index,total){
 const launch=bagVolleyPose(seed,elapsed,originX,originY,bagSize,width,height);
 const t=Math.max(0,elapsed-seed.delay);
 const g=curtainGeometry(progress,width,height);
 const join=smooth((t-seed.ascent*.8)/.65);
 const growth=smooth((t-.12)/1.5);
 const columns=Math.min(7,Math.max(1,total));
 const rows=Math.ceil(total/columns);
 const laneX=width*(index%columns)/Math.max(1,columns-1);
 const laneY=g.top+g.tile*.4+Math.floor(index/columns)*(g.sheetHeight-g.tile*.8)/Math.max(1,rows-1);
 const target=g.tile*(1.3+.2*Math.sin(seed.phase)**2);
 const size=bagSize*seed.size+(target-bagSize*seed.size)*growth;
 // Position the crest using the actual rotated silhouette, not its center.
 // Only the lowest tip remains visible; growth continues through the rollover.
 const crestGrowth=smooth((seed.ascent-.12)/1.5);
 const crestSize=bagSize*seed.size+(target-bagSize*seed.size)*crestGrowth;
 const crestWidth=crestSize*(.8+.2*Math.abs(Math.cos(seed.ascent*3+seed.phase)));
 const crestRotation=seed.phase+seed.ascent*seed.spin*.55;
 const crestExtent=(Math.abs(Math.sin(crestRotation))*crestWidth+Math.abs(Math.cos(crestRotation))*crestSize)/2;
 const peak=-crestExtent+crestSize*.025*Math.sin(seed.phase)**2;
 const rise=clamp01(t/seed.ascent);
 const risingY=peak+(originY-peak)*(1-rise)**2;
 const fallTime=Math.max(0,t-seed.ascent);
 const fallingY=peak+height*.24*fallTime*fallTime;
 // Merge the forward roll into the falling stream without a position/velocity snap.
 const radius=g.tile*.18;
 const difference=laneY-fallingY;
 const catchup=difference<=-radius?0:difference>=radius?difference:(difference+radius)**2/(4*radius);
 const y=t<=seed.ascent?risingY:fallingY+catchup;

 return {
  x:launch.x+(laneX+Math.sin(t*2+seed.phase)*g.tile*.08-launch.x)*join,
  y,
  width:size*(.8+.2*Math.abs(Math.cos(t*3+seed.phase))),height:size,
  rotation:seed.phase+t*seed.spin*.55,
  alpha:elapsed<seed.delay?0:1,
 };
}

// The reveal edge travels through the middle of the moving seeds, not behind them.
export const CURTAIN_HANDOFF=.35;
export function curtainReveal(progress,width,height){
 const g=curtainGeometry(progress,width,height);
 return clamp01((g.top+g.sheetHeight*.5)/height);
}
export function seedWaveReveal(poses,height){
 if(!poses.length)return 0;
 const centers=poses.map(p=>p.y).sort((a,b)=>a-b);
 const middle=Math.floor(centers.length/2);
 const edge=centers.length%2?centers[middle]:(centers[middle-1]+centers[middle])/2;
 return clamp01(edge/height);
}
