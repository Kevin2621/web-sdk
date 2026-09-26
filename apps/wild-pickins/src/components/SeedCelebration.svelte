<script lang="ts">
 import { PreviewCanvas } from 'pixi-svelte';
 import ScatterBag from './ScatterBag.svelte';
 import SeedCurtain from './SeedCurtain.svelte';
 import { burstPose, curtainReveal, seedWaveReveal, growingVolleyPose, makeBagVolley, ENTRY_CURTAIN_START, ENTRY_CURTAIN_END } from '../game/seedCurtain.mjs';
 import { Sprite } from 'pixi-svelte';
 import { onDestroy } from 'svelte';
 import { getContext } from '../game/context';
 import { playerLanguage } from '../game/playerLanguage.svelte';
 import { playerLabel } from '../game/playerLabels';
 import { seedCelebration, cancelSeedCelebration, continueSeedCelebration, completeSeedContinue, seedBagBurst } from '../game/seedCelebration.svelte';
 const context=getContext();
 const layout=$derived(context.stateLayoutDerived.mainLayout());
 const board=$derived(context.stateGameDerived.boardLayout());
 const bags=$derived(context.stateGame.board.flatMap((reel,x)=>reel.reelState.symbols.slice(1,4).flatMap((s,y)=>s.rawSymbol.name==='S'?[{x,y}]:[])));

 const seedArt=new URL('../../assets/art-v1/celebration-seedart.png',import.meta.url).href;
 const size=$derived(120*layout.scale);
 const centerX=$derived(layout.x+(board.x-layout.width/2)*layout.scale);
 const boardTop=$derived(layout.y+(board.y-layout.height/2-board.height/2)*layout.scale);
 const centerY=$derived(boardTop+board.height*layout.scale*.45);
 const signWidth=$derived(board.width*.4*layout.scale);
 const signHeight=$derived(signWidth*.26);
 const targetY=$derived(boardTop+4*layout.scale-signHeight/2);
 const progress=$derived(seedCelebration.progress);
 const clamp=(v:number)=>Math.max(0,Math.min(1,v));
 const flight=$derived(clamp((progress-.84)/.13));
 const ease=$derived(flight*flight*(3-2*flight));
 const reveal=$derived(clamp((progress-.63)/.16));
 let volleys = $state<Record<string,{at:number;seeds:ReturnType<typeof makeBagVolley>}>>({});
 let volleySalt=0;
 $effect(()=>{
  if(!seedCelebration.active){volleys={};volleySalt=Math.floor(Math.random()*1000000);}
 });
 function burst(id:string){
  if(!volleys[id]){
   const [x,y]=id.split(':').map(Number);
   volleys[id]={at:progress*8,seeds:makeBagVolley(Math.min(18,Math.floor(60/Math.max(1,bags.length))),volleySalt+x*131+y*37)};
  }
  seedBagBurst(id);
 }
 const canvas=$derived(context.stateLayoutDerived.canvasSizes());
 const entranceSeeds=$derived(bags.flatMap(bag=>{
  const id=`${bag.x}:${bag.y}`,volley=volleys[id];
  return volley?volley.seeds.map(seed=>({id:`${id}:${seed.id}`,at:volley.at,seed,
   x:centerX+(bag.x-2)*size,y:boardTop+(bag.y+.12)*size,size})):[];
 }));
 const entryCurtain=$derived(clamp((progress-ENTRY_CURTAIN_START)/(ENTRY_CURTAIN_END-ENTRY_CURTAIN_START)));
 const entryReveal=$derived(progress<ENTRY_CURTAIN_START?0:seedWaveReveal(entranceSeeds.map((v,index)=>
  growingVolleyPose(v.seed,progress*8-v.at,v.x,v.y,v.size,canvas.width,canvas.height,entryCurtain,index,entranceSeeds.length)
 ),canvas.height));
 const exitReveal=$derived(curtainReveal(seedCelebration.exitProgress,canvas.width,canvas.height));
 const showReward=$derived(seedCelebration.active && progress>=ENTRY_CURTAIN_START && seedCelebration.exitProgress<1);
 const spray=$derived(seedCelebration.sprayProgress);
 let rewardDialog:HTMLDialogElement;
 $effect(()=>{if(seedCelebration.active)rewardDialog?.showModal();else rewardDialog?.close();});
 function confirm(event:Event){event.stopPropagation();if(seedCelebration.waiting)continueSeedCelebration();}
 function keyConfirm(event:KeyboardEvent){event.stopPropagation();if(event.key==='Enter'||event.key===' '){event.preventDefault();if(!event.repeat)confirm(event);}}
 const packetReveal=$derived(clamp((progress-.57)/.12));
 onDestroy(cancelSeedCelebration);
</script>
<img src={seedArt} alt="" hidden />
{#if seedCelebration.active}
 <div class="celebration" aria-hidden="true">
  <div class="shade" style:opacity={.55*clamp(progress/.15)*(1-exitReveal)}></div>

 </div>
 {#if progress>.81}
 <div class="award" style:left={`${centerX}px`} style:top={`${centerY+(targetY-centerY)*ease}px`} style:width={`${signWidth}px`} style:font-size={`${signWidth*.06}px`} style:clip-path={`inset(0 ${(1-reveal)*100}% 0 0)`} style:transform={`translate(-50%,-50%) scale(${2.5-1.5*ease+.05*Math.sin(clamp((progress-.97)/.03)*Math.PI)})`}>
  <div class="heading">{playerLabel(playerLanguage(),'FREE SPINS')}</div>
  <div class="counter" style:font-size={`${signWidth*.09}px`}>{seedCelebration.award}</div>
 </div>
 {/if}
{/if}
<dialog class="reward-dialog" bind:this={rewardDialog} oncancel={(event)=>event.preventDefault()} onkeydown={keyConfirm} onclick={confirm} aria-label="Free spins awarded">
 {#if seedCelebration.active && context.stateApp.loaded && progress<.425}
 <div class="spine-overlay" aria-hidden="true">
  <PreviewCanvas width={canvas.width} height={canvas.height} label="Scatter bags">
   {#if progress < .425}
    {#each bags as bag (`${bag.x}:${bag.y}`)}
     <ScatterBag x={centerX+(bag.x-2)*size} y={boardTop+(bag.y+.5)*size} size={size*.96} animation="shake_open" onburst={()=>burst(`${bag.x}:${bag.y}`)} />
    {/each}
   {/if}
  </PreviewCanvas>
 </div>
 {/if}
 {#if showReward}
 <div class="reward-scene" style:clip-path={`inset(${exitReveal*100}% 0 ${(1-entryReveal)*100}% 0)`}>
  <div class="reward-background"><div class="reward-rays"></div><div class="reward-halo"></div></div>
  {#if context.stateApp.loaded}
   <div class="spine-overlay" aria-hidden="true">
    <PreviewCanvas width={canvas.width} height={canvas.height} label="Reward bag">
    <ScatterBag x={canvas.width*.5} y={canvas.height*.48} size={Math.min(420,canvas.width*.64,canvas.height*.65)} animation={seedCelebration.continuing?'bag_pop':'idle'} onburst={()=>seedBagBurst('reward')} oncomplete={completeSeedContinue} />
   {#if spray>=0 && spray<1}
    {#each [0,1,2,3,4,5,6,7,8,9,10,11] as i}
     {@const pose=burstPose(i,spray,canvas.width,canvas.height)}
     <Sprite key={`wpCurtainSeed${i%3+1}`} anchor={.5} {...pose} />
    {/each}
   {/if}
    </PreviewCanvas>
   </div>
  {/if}
  <div class="packet" style:opacity={clamp((progress-.38)/.12)} style:transform={`translate(-50%,-50%) scale(${.3+.7*clamp((progress-.38)/.18)}) rotate(${(1-clamp((progress-.38)/.18))*-18}deg)`}>

   <div class="reward-words" style:opacity={clamp((progress-.60)/.08)}>YOU WON</div>
   <svg class="seed-number" viewBox="0 0 400 150" role="img" aria-label={`${seedCelebration.award} wild free spins`} style:opacity={packetReveal}>
    <defs>
     <pattern id="reward-seed-fill" width="22" height="26" patternUnits="userSpaceOnUse">
      <rect width="22" height="26" fill="#855019" />
      <image href={seedArt} width="22" height="26" />
     </pattern>
    </defs>
    <text x="200" y="123" text-anchor="middle" font-family="Georgia, serif" font-weight="bold" font-size={seedCelebration.award>=100?112:138} fill="url(#reward-seed-fill)" stroke="#fff0a0" stroke-width="5" paint-order="stroke fill">{seedCelebration.displayAward}</text>
   </svg>
   <div class="reward-subtitle" style:opacity={clamp((progress-.65)/.08)}>WILD FREE SPINS</div>
  </div>
  {#if seedCelebration.waiting}<button class="continue" onclick={confirm}>Click or tap anywhere to continue</button>{/if}
 </div>
 {/if}
 {#if seedCelebration.active && context.stateApp.loaded}
  {#if progress<ENTRY_CURTAIN_END}
   <SeedCurtain progress={entryCurtain} width={canvas.width} height={canvas.height} volleys={entranceSeeds} clock={progress*8} />
  {:else if seedCelebration.exitProgress>=0 && seedCelebration.exitProgress<1}
   <SeedCurtain progress={seedCelebration.exitProgress} width={canvas.width} height={canvas.height} />
  {/if}
 {/if}
</dialog>
<style>
 .reward-scene{position:absolute;inset:0;overflow:hidden}
 .reward-background{position:absolute;inset:0;overflow:hidden;background:radial-gradient(ellipse at 50% 44%,#855323 0%,#3e301b 42%,#141f18 85%)}
 .reward-rays{position:absolute;inset:0;background:repeating-conic-gradient(from 0deg at 50% 45%,transparent 0deg 14deg,#ffd78010 14deg 22deg,transparent 22deg 36deg)}
 .reward-halo{position:absolute;left:50%;top:46%;width:min(700px,95vw);aspect-ratio:1;border-radius:50%;background:radial-gradient(ellipse,#ffca6530,transparent 65%);animation:reward-breathe 3s ease-in-out infinite}
 @keyframes reward-breathe{0%,100%{transform:translate(-50%,-50%) scale(.95);opacity:.6}50%{transform:translate(-50%,-50%) scale(1.08);opacity:1}}
 @media(prefers-reduced-motion:reduce){.reward-rays,.reward-halo{animation:none}.reward-halo{transform:translate(-50%,-50%)}}
 .spine-overlay{position:absolute;inset:0;pointer-events:none}
 .reward-dialog{position:fixed;inset:0;width:100vw;height:100dvh;max-width:none;max-height:none;margin:0;padding:0;border:0;background:transparent;overflow:hidden;color:#fff0c0;outline:none}
 .reward-dialog::backdrop{background:transparent}
 .packet{position:absolute;left:50%;top:48%;width:min(420px,64vw,65vh);aspect-ratio:1199/1312;pointer-events:none}
 .reward-words,.reward-subtitle{position:absolute;left:0;right:0;text-align:center;font-family:Georgia,serif;font-weight:bold;color:#fff0a0;text-shadow:0 2px 3px #46270b,0 0 8px #46270b}
 .reward-words{top:-8%;font-size:clamp(22px,4vw,36px);letter-spacing:.08em}
 .seed-number{position:absolute;left:12%;top:5%;width:76%;height:25%;overflow:visible;filter:drop-shadow(0 3px 2px #452209)}
 .reward-subtitle{top:31%;font-size:clamp(18px,3vw,28px)}
 .continue{position:absolute;bottom:8%;left:50%;transform:translateX(-50%);padding:14px 22px;border:1px solid #a48b5b;border-radius:12px;background:#302b24;color:#f2e6cd;font:600 16px system-ui;cursor:pointer;max-width:90vw}
 .continue:focus-visible{outline:3px solid #fff0a0}
 .celebration{position:fixed;inset:0;pointer-events:none;z-index:9998}
 .shade{position:absolute;inset:0;background:#131c13}
 img{position:absolute;object-fit:contain}
 .award{position:fixed;z-index:10002;pointer-events:none;text-align:center;font-family:Georgia,serif;color:#f2e6cd;text-shadow:0 2px 3px #23160e,0 0 12px #eaaa3877;display:flex;flex-direction:column;gap:2px;line-height:1.05}
 .heading{font-weight:800}.counter{font-weight:bold;font-variant-numeric:tabular-nums}
</style>
