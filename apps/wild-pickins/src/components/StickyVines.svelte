<script lang="ts">

 import { Graphics } from 'pixi-svelte';
 import { untrack } from 'svelte';
 import { SYMBOL_SIZE } from '../game/constants';
 let {layer, releasing=false, dimmed=false}:{layer:'back'|'front';releasing?:boolean;dimmed?:boolean}=$props();
 let growth=$state(0);
 $effect(()=>{
  const target=releasing?0:1;
  const from=untrack(()=>growth);
  const start=performance.now(), duration=releasing?300:400;
  let frame=0;
  const tick=(now:number)=>{
   const t=Math.min(1,(now-start)/duration);
   growth=from+(target-from)*(t*t*(3-2*t));
   if(t<1)frame=requestAnimationFrame(tick);
  };
  frame=requestAnimationFrame(tick);
  return ()=>cancelAnimationFrame(frame);
 });
 // Two branches run from the bottom center around opposite sides of the square.
 function point(t:number,side:number){
  const e=SYMBOL_SIZE*0.46;
  const d=t*4*e;
  let x:number,y:number;
  if(d<e){x=d*side;y=e;}
  else if(d<3*e){x=e*side;y=e-(d-e);}
  else{x=(e-(d-3*e))*side;y=-e;}
  const ripple=Math.sin(t*Math.PI*12)*1.2*Math.sin(t*Math.PI);
  return {x:x+(d>=e&&d<3*e?side*ripple:0),y:y+(d<e||d>=3*e?ripple:0)};
 }
</script>
<Graphics draw={g=>{
 const e=SYMBOL_SIZE/2;
 if(layer==='back'){
  // Underlying symbols are hidden by ReelSymbol; the opaque green keeps
  // spinning artwork from showing through, while matching the board surface.
  g.rect(-e,-e,SYMBOL_SIZE,SYMBOL_SIZE).fill(dimmed?0x1a2819:0x283e26);
  // Nested low-alpha rounded patches soften the center without a black tile edge.
  for(let i=0;i<12;i++){
   const size=SYMBOL_SIZE*(0.94-i*0.038);
   g.roundRect(-size/2,-size/2,size,size,8).fill({color:0x171d12,alpha:0.035*growth});
  }
  g.roundRect(-e+5,-e+5,SYMBOL_SIZE-10,SYMBOL_SIZE-10,7).stroke({color:0x493323,width:7,alpha:0.24*growth});
 }else{
  for(const side of [-1,1]){
   const steps=80;
   for(const [width,color] of [[6,0x302619],[4,0x765334],[1.3,0xb08b55]]){
    const first=point(0,side);g.moveTo(first.x,first.y);
    for(let i=1;i<=steps;i++){const p=point(growth*i/steps,side);g.lineTo(p.x,p.y);}
    g.stroke({color,width,alpha:dimmed?0.72:1});
   }
   for(let i=1;i<=10;i++){
    const t=i/11;
    if(t>growth)continue;
    const p=point(t,side),prev=point(t-0.015,side);
    const len=Math.hypot(p.x,p.y), inward={x:-p.x/len,y:-p.y/len};
    g.moveTo(prev.x,prev.y).lineTo(p.x+inward.x*5,p.y+inward.y*5).lineTo(p.x,p.y).closePath().fill(0x8c683f);
    if(i===3||i===8){
     g.ellipse(p.x+inward.x*4,p.y+inward.y*4,3,1.6).fill(0x637841);
    }
   }
  }
 }
}} />
