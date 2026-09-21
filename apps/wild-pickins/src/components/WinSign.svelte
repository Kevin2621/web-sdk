<script lang="ts">
 import { getWinTiming } from '../game/playerSpeed.svelte';
 import { playerMotion } from '../game/playerMotion.svelte';

 import { onDestroy } from 'svelte';
 import { getContext } from '../game/context';
 import { stateBet } from 'state-shared';
 import PlayerAmount from './PlayerAmount.svelte';
 import translations from '../game/playerTranslations';
 import { playerLanguage } from '../game/playerLanguage.svelte';
 const language=$derived(playerLanguage());
 let stake=$state(1);
 const context=getContext();
 const hangingArtwork=new URL('../../assets/art-v1/hinged-win-plaque-v1.png',import.meta.url).href;
 const artwork=new URL('../../assets/art-v1/blank-sign.png',import.meta.url).href;
 let visible=$state(false), amount=$state(0), finalAmount=$state(0);
 let thudFrame=0;
 let thudX=$state(0), thudY=$state(0);
 function stopThud(){cancelAnimationFrame(thudFrame);thudX=0;thudY=0;}
 function thud(){
  stopThud();
  if(!visible || playerMotion.shakeDisabled)return;
  const start=performance.now();
  const tick=(now:number)=>{
   if(playerMotion.shakeDisabled){stopThud();return;}
   const t=Math.min(1,(now-start)/220), decay=(1-t)*(1-t);
   thudX=1.5*Math.sin(t*Math.PI*6)*decay;
   thudY=5*Math.sin(t*Math.PI*5)*decay;
   if(t<1)thudFrame=requestAnimationFrame(tick);else stopThud();
  };
  thudFrame=requestAnimationFrame(tick);
 }
 let frame=0;
 let finish=()=>{};
 function stop(){cancelAnimationFrame(frame);finish();finish=()=>{};}
 context.eventEmitter.subscribeOnMount({
  scatterLandingThud:thud,
  winShow:()=>{},
  // The sign remains after count-up; only the next spin or cancellation hides it.
  winHide:()=>{},
  winSignHide:()=>{visible=false;stop();stopThud();},
  winUpdate:({amount:target})=>new Promise<void>(resolve=>{
   stop();finish=resolve;
   const from=visible ? amount : 0;
   const timing=getWinTiming();
   const entranceDelay=visible ? 0 : timing.entrance;
   stake=stateBet.wageredBetAmount;finalAmount=target;amount=from;visible=target>0;
   if(target<=0){amount=target;finish();finish=()=>{};return;}
   const start=performance.now();
   const tick=(now:number)=>{
    const t=Math.min(1,Math.max(0,(now-start-entranceDelay)/timing.countUp));
    amount=Math.round(from+(target-from)*(1-(1-t)**3));
    if(t<1)frame=requestAnimationFrame(tick);
    else {amount=target;finish();finish=()=>{};}
   };
   frame=requestAnimationFrame(tick);
  }),
 });
 onDestroy(()=>{stop();stopThud();});
</script>
<div style:translate={`${thudX}px ${thudY}px`} class="win-sign" class:visible aria-hidden={!visible}>
 <img src={artwork} alt="" />
 <div class="heading" class:arabic={language==='ar'}>{translations[language][0]}</div>
 <!-- StoryLocale initializes on mount; do not format while the sign is hidden. -->
 <div class="amount" aria-hidden="true">{#if visible}<PlayerAmount amount={amount/100*stake} {language}/>{/if}</div>
 <span class="accessible" role="status">{visible?`${translations[language][0]} ${finalAmount/100*stake}`:''}</span>
</div>
<!-- A small hinged result plaque between the reel frame and desktop controls. -->
<div style:translate={`${thudX}px ${thudY}px`} class="win-tab-slot" aria-hidden={!visible}>
 <div class="win-tab" class:visible dir={language==='ar'?'rtl':'ltr'}>
  <img class="plaque-art" src={hangingArtwork} alt="" />
  <span class="tab-label">{translations[language][0]}</span>
  <div class="tab-amount">{#if visible}<PlayerAmount amount={finalAmount/100*stake} {language} maxFontSize={18}/>{/if}</div>
 </div>
</div>
<style>
 .win-sign{position:fixed;left:50%;bottom:16px;width:min(340px,78vw);z-index:9999;pointer-events:none;transform:translate(-50%,calc(100% + 120px));visibility:hidden;transition:transform 280ms ease-in,visibility 0s 280ms}
 .win-sign.visible{transform:translate(-50%,0);visibility:visible;transition:transform 320ms cubic-bezier(.2,.8,.3,1),visibility 0s}
 img{display:block;width:100%}
 .amount{position:absolute;left:8%;right:8%;top:53%;height:33%;display:flex;align-items:center;justify-content:center;color:#fff1d1;font:bold clamp(23px,5vw,34px) Georgia,serif;text-shadow:0 2px 0 #493522,1px 0 2px #23160e;font-variant-numeric:tabular-nums}
 .heading{position:absolute;top:10%;left:10%;right:10%;text-align:center;color:#fff0cd;font:bold clamp(18px,5vw,30px) Georgia,serif;text-shadow:0 2px 2px #392313}.heading.arabic{top:5%;font-family:serif}
 .accessible{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)}
 @media(max-width:900px), (max-height:540px){.win-sign{bottom:110px;width:min(280px,72vw)}}
 .win-tab-slot{display:none}
 @media(min-width:901px) and (min-height:541px){
  .win-sign{display:none}
  .win-tab-slot{display:block;position:fixed;left:50%;bottom:calc(max(30px,env(safe-area-inset-bottom)) + 84px);transform:translateX(-50%);width:220px;height:38px;overflow:visible;perspective:500px;z-index:10001;pointer-events:none}
  .win-tab{position:relative;height:38px;box-sizing:border-box;display:flex;align-items:center;justify-content:center;gap:10px;padding:4px 18px;background:none;color:#f2e6cd;border:0;transform-origin:50% -7px;transform:rotateX(-100deg);opacity:0;visibility:hidden;transition:transform 180ms ease-in,opacity 150ms ease-in,visibility 0s 180ms;font-family:system-ui,sans-serif;backface-visibility:hidden}
  .win-tab.visible{transform:rotateX(0);opacity:1;visibility:visible;transition:none;animation:hinged-win-arrival 850ms both}
  .plaque-art{position:absolute;left:-8px;top:-16px;width:236px;height:64px;z-index:-1;pointer-events:none}
  @keyframes hinged-win-arrival{
   0%{transform:rotateX(-100deg);opacity:0}
   12%{opacity:1}
   43%{transform:rotateX(22deg);opacity:1}
   65%{transform:rotateX(-12deg)}
   82%{transform:rotateX(5deg)}
   94%{transform:rotateX(-2deg)}
   100%{transform:rotateX(0);opacity:1}
  }
  .tab-label{font-size:12px;font-weight:800;letter-spacing:.06em;color:#e0ddc7;flex-shrink:0}
  .tab-amount{min-width:0;font-weight:750;max-width:150px}
 }
</style>
