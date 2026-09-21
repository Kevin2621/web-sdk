<script lang="ts">
 import { onDestroy } from 'svelte';
 import { getContext } from '../game/context';
 import { playerLanguage } from '../game/playerLanguage.svelte';
 import { playerLabel } from '../game/playerLabels';
 import { seedCelebration, cancelSeedCelebration, continueSeedCelebration } from '../game/seedCelebration.svelte';
 const context=getContext();
 const layout=$derived(context.stateLayoutDerived.mainLayout());
 const board=$derived(context.stateGameDerived.boardLayout());
 const bags=$derived(context.stateGame.board.flatMap((reel,x)=>reel.reelState.symbols.slice(1,4).flatMap((s,y)=>s.rawSymbol.name==='S'?[{x,y}]:[])));
 const bagArt=new URL('../../assets/art-v1/celebration-openbag.png',import.meta.url).href;
 const closedArt=new URL('../../assets/art-v1/seed-scatter-transparent.png',import.meta.url).href;
 const seedArt=new URL('../../assets/art-v1/celebration-seedart.png',import.meta.url).href;
 const size=$derived(120*layout.scale);
 const centerX=$derived(layout.x+(board.x-layout.width/2)*layout.scale);
 const boardTop=$derived(layout.y+(board.y-layout.height/2-board.height/2)*layout.scale);
 const centerY=$derived(boardTop+board.height*layout.scale*.45);
 const signWidth=$derived(board.width*.48*layout.scale);
 const signHeight=$derived(signWidth*.26);
 const targetY=$derived(boardTop-(board.height*77/551-4)*layout.scale-signHeight/2);
 const progress=$derived(seedCelebration.progress);
 const clamp=(v:number)=>Math.max(0,Math.min(1,v));
 const flight=$derived(clamp((progress-.84)/.13));
 const ease=$derived(flight*flight*(3-2*flight));
 const reveal=$derived(clamp((progress-.63)/.16));
 // One 520 ms squash-and-pop. Swap artwork during the fast upward release.
 const openAt=.2/8;
 const pop=$derived(clamp(progress*8/.52));
 const bagMotion=$derived.by(()=>{
  const t=pop;
  if(t<.3){const q=t/.3;return {x:0,y:8*q,sx:1+.12*q,sy:1-.16*q,angle:-5*q,blur:0};}
  if(t<.52){const q=(t-.3)/.22;return {x:5*Math.sin(q*Math.PI),y:8-25*q,sx:1.12-.2*q,sy:.84+.3*q,angle:-5+12*q,blur:Math.sin(q*Math.PI)*3};}
  const q=(t-.52)/.48,e=1-(1-q)**3;
  return {x:0,y:-17*(1-e),sx:.92+.08*e,sy:1.14-.14*e,angle:7*(1-e),blur:0};
 });
 function point(x:number,y:number,i:number){
  // Every bag feeds the same path, with evenly spaced followers instead of lanes.
  const bagIndex=bags.findIndex(bag=>bag.x===x&&bag.y===y);
  const order=i*bags.length+Math.max(0,bagIndex);
  const t=progress-order*.0004;
  const sx=centerX+(x-2)*size, sy=boardTop+(y+.12)*size;
  const rise=clamp((t-openAt)/(.22-openAt));
  const topY=boardTop-size*.6;
  if(t<.22)return {x:sx+(centerX-signWidth-sx)*rise*rise,y:sy+(topY-sy)*rise,opacity:rise>0?1:0,t};
  const q=clamp((t-.22)/.20);
  return {x:centerX-signWidth+q*signWidth*2.5,
   y:topY+(centerY-topY)*q*q,opacity:1-clamp((q-.7)/.3),t};
 }
 const canvas=$derived(context.stateLayoutDerived.canvasSizes());
 const wipe=$derived.by(()=>{
  const grow=clamp((progress-.22)/.20),e=grow*grow*(3-2*grow);
  const exit=clamp((progress-.78)/.14);
  // The seed's opaque center exceeds the viewport diagonal at full coverage.
  const diameter=Math.hypot(canvas.width,canvas.height)*4;
  return {size:12+(diameter-12)*e,
   x:(centerX-signWidth)*(1-e)+canvas.width/2*e+exit*exit*(diameter+canvas.width),
   y:(boardTop-size*.6)*(1-e)+canvas.height/2*e,
   angle:-25+25*e+exit*35};
 });
 let rewardDialog:HTMLDialogElement;
 $effect(()=>{if(seedCelebration.active)rewardDialog?.showModal();else rewardDialog?.close();});
 function confirm(event:Event){event.stopPropagation();if(seedCelebration.waiting)continueSeedCelebration();}
 function keyConfirm(event:KeyboardEvent){event.stopPropagation();if(event.key==='Enter'||event.key===' '){event.preventDefault();if(!event.repeat)confirm(event);}}
 const packetReveal=$derived(clamp((progress-.57)/.12));
 onDestroy(cancelSeedCelebration);
</script>
<img src={bagArt} alt="" hidden /><img src={seedArt} alt="" hidden />
{#if seedCelebration.active}
 <div class="celebration" aria-hidden="true">
  <div class="shade" style:opacity={.55*clamp(progress/.15)*(1-clamp((progress-.84)/.13))}></div>
  {#each bags as bag}
   <img class="bag" src={progress<openAt?closedArt:bagArt} alt="" style:left={`${centerX+(bag.x-2)*size+bagMotion.x*layout.scale}px`} style:top={`${boardTop+(bag.y+.5)*size+bagMotion.y*layout.scale}px`} style:width={`${size*.88}px`} style:height={`${size*.96}px`} style:filter={`drop-shadow(0 0 12px #ffd45aaa) blur(${bagMotion.blur*layout.scale}px)`} style:transform={`translate(-50%,-50%) scale(${bagMotion.sx},${bagMotion.sy}) rotate(${bagMotion.angle}deg)`} />
   {#each Array.from({length:32},(_,i)=>i) as i}
    {@const p=point(bag.x,bag.y,i)}
    <img class="seed" src={seedArt} alt="" style:left={`${p.x}px`} style:top={`${p.y}px`} style:width={`${size*(.065+i%4*.018)}px`} style:opacity={p.opacity} style:transform={`translate(-50%,-50%) rotate(${i*35+p.t*640}deg)`}/>
   {/each}
  {/each}
 </div>
 {#if progress>=.22 && progress<.92}
  <div class="seed-wipe" aria-hidden="true"><img src={seedArt} alt="" style:width={`${wipe.size}px`} style:height={`${wipe.size}px`} style:left={`${wipe.x}px`} style:top={`${wipe.y}px`} style:transform={`translate(-50%,-50%) rotate(${wipe.angle}deg)`}/></div>
 {/if}
 {#if progress>.81}
 <div class="award" style:left={`${centerX}px`} style:top={`${centerY+(targetY-centerY)*ease}px`} style:width={`${signWidth}px`} style:font-size={`${signWidth*.06}px`} style:clip-path={`inset(0 ${(1-reveal)*100}% 0 0)`} style:transform={`translate(-50%,-50%) scale(${2.5-1.5*ease+.05*Math.sin(clamp((progress-.97)/.03)*Math.PI)})`}>
  <div class="heading">{playerLabel(playerLanguage(),'FREE SPINS')}</div>
  <div class="counter" style:font-size={`${signWidth*.09}px`}>{seedCelebration.award}</div>
 </div>
 {/if}
{/if}
<dialog class="reward-dialog" bind:this={rewardDialog} oncancel={(event)=>event.preventDefault()} onkeydown={keyConfirm} onclick={confirm} aria-label="Free spins awarded">
 {#if progress>=.38 && progress<=.81}
  <div class="packet" style:opacity={clamp((progress-.38)/.12)} style:transform={`translate(-50%,-50%) scale(${.3+.7*clamp((progress-.38)/.18)}) rotate(${(1-clamp((progress-.38)/.18))*-18}deg)`}>
   <img class="reward-bag" src={progress<.57?closedArt:bagArt} alt="" />
   <div class="reward-words" style:opacity={clamp((progress-.60)/.08)}>YOU WON</div>
   <svg class="seed-number" viewBox="0 0 400 150" role="img" aria-label={`${seedCelebration.award} wild free spins`} style:opacity={packetReveal}>
    <defs>
     <pattern id="reward-seed-fill" width="22" height="26" patternUnits="userSpaceOnUse">
      <rect width="22" height="26" fill="#855019" />
      <image href={seedArt} width="22" height="26" />
     </pattern>
    </defs>
    <text x="200" y="123" text-anchor="middle" font-family="Georgia, serif" font-weight="bold" font-size={seedCelebration.award>=100?112:138} fill="url(#reward-seed-fill)" stroke="#fff0a0" stroke-width="5" paint-order="stroke fill">{seedCelebration.award}</text>
   </svg>
   <div class="reward-subtitle" style:opacity={clamp((progress-.65)/.08)}>WILD FREE SPINS</div>
  </div>
  {#if seedCelebration.waiting}<button class="continue" onclick={confirm}>Click or tap anywhere to continue</button>{/if}
 {/if}
</dialog>
<style>
 .reward-dialog{position:fixed;inset:0;width:100vw;height:100dvh;max-width:none;max-height:none;margin:0;padding:0;border:0;background:transparent;overflow:hidden;color:#fff0c0;outline:none}
 .reward-dialog::backdrop{background:transparent}
 .packet{position:absolute;left:50%;top:48%;width:min(420px,64vw,65vh);aspect-ratio:1199/1312;pointer-events:none}
 .reward-bag{inset:0;width:100%;height:100%;filter:drop-shadow(0 8px 24px #0008)}
 .reward-words,.reward-subtitle{position:absolute;left:0;right:0;text-align:center;font-family:Georgia,serif;font-weight:bold;color:#fff0a0;text-shadow:0 2px 3px #46270b,0 0 8px #46270b}
 .reward-words{top:-8%;font-size:clamp(22px,4vw,36px);letter-spacing:.08em}
 .seed-number{position:absolute;left:12%;top:5%;width:76%;height:25%;overflow:visible;filter:drop-shadow(0 3px 2px #452209)}
 .reward-subtitle{top:31%;font-size:clamp(18px,3vw,28px)}
 .continue{position:absolute;bottom:8%;left:50%;transform:translateX(-50%);padding:14px 22px;border:1px solid #a48b5b;border-radius:12px;background:#302b24;color:#f2e6cd;font:600 16px system-ui;cursor:pointer;max-width:90vw}
 .continue:focus-visible{outline:3px solid #fff0a0}
 .celebration{position:fixed;inset:0;pointer-events:none;z-index:9998}
 .seed-wipe{position:fixed;inset:0;overflow:hidden;pointer-events:none;z-index:10003}
 .shade{position:absolute;inset:0;background:#131c13}
 img{position:absolute;object-fit:contain}
 .bag{filter:drop-shadow(0 0 12px #ffd45aaa)}
 .seed{filter:drop-shadow(0 0 4px #ffdd79)}
 .award{position:fixed;z-index:10002;pointer-events:none;text-align:center;font-family:Georgia,serif;color:#f2e6cd;text-shadow:0 2px 3px #23160e,0 0 12px #eaaa3877;display:flex;flex-direction:column;gap:2px;line-height:1.05}
 .heading{font-weight:800}.counter{font-weight:bold;font-variant-numeric:tabular-nums}
</style>
