<script lang="ts">
 import { base } from '$app/paths';
 import { onDestroy, onMount } from 'svelte';
 import { SpineProvider } from 'pixi-svelte';
 import { stateModal } from 'state-shared';
 import { getContext } from '../game/context';
 import { sound } from '../game/sound';
 import FeatureBoardSpine from './FeatureBoardSpine.svelte';

 const { onloaded, automatic = false } = $props<{ onloaded: () => void; automatic?: boolean }>();
 const context = getContext();
 let entering = $state(false);
 let boardAnchor = $state<HTMLDivElement | undefined>();
 let position = $state({ x: 0, y: 0, scaleX: 1, scaleY: 1 });
 let motion = $state({ x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 });
 let fallbackTimer: ReturnType<typeof setTimeout> | undefined;
 let finished = false;
 const ready = $derived(context.stateApp.loaded);
 const progress = $derived(Math.max(0, Math.min(100, Math.round(context.stateApp.loadingProgress))));
 const loadError = $derived(stateModal.modal?.name === 'error');
 const art = `${base}/assets/art-refresh`;

 $effect(() => { if (automatic && ready) onloaded(); });
 onDestroy(() => clearTimeout(fallbackTimer));

 onMount(() => {
  const canvas = document.querySelector<HTMLCanvasElement>('.game-viewport canvas');
  const measure = () => {
   if (!boardAnchor) return;
   const bounds = boardAnchor.getBoundingClientRect();
   position = {
    x: bounds.left + bounds.width / 2,
    y: bounds.top + bounds.height / 2,
    scaleX: bounds.width / 1672,
    scaleY: bounds.height / 941,
   };
   // The narrow layout keeps its vertical HTML board; Spine still drives its motion.
   if (canvas) canvas.style.opacity = window.matchMedia('(max-width: 760px)').matches ? '0' : '';
  };
  const observer = new ResizeObserver(measure);
  if (boardAnchor) observer.observe(boardAnchor);
  window.addEventListener('resize', measure);
  measure();
  return () => {
   observer.disconnect();
   window.removeEventListener('resize', measure);
   if (canvas) canvas.style.opacity = '';
  };
 });

 function finish() {
  if (finished) return;
  finished = true;
  clearTimeout(fallbackTimer);
  onloaded();
 }

 function proceed() {
  if (!ready || entering || loadError) return;
  entering = true;
  if (sound.players) {
   sound.players.once.play({ name: 'sfx_farm_entry_riser', forcePlay: true });
  }
  fallbackTimer = setTimeout(finish, 7000);
 }

 function onKeydown(event: KeyboardEvent) {
  if (automatic || !ready || entering || loadError || event.repeat || (event.key !== 'Enter' && event.key !== ' ')) return;
  if (event.target instanceof HTMLElement && event.target.closest('button')) return;
  event.preventDefault();
  proceed();
 }
</script>

<svelte:window onkeydown={onKeydown} />

{#if automatic}
 <div class="replay-loading" role="status" aria-live="polite">
  <div class="replay-mark" aria-hidden="true">✦</div>
  <strong>WILD HARVEST</strong>
  <span>Loading replay…</span>
  <div class="loading-track"><span class="indeterminate"></span></div>
 </div>
{:else}
 {#if ready}
  <SpineProvider key="wpBaseScene" x={position.x} y={position.y}
   scale={{ x: position.scaleX, y: position.scaleY }}>
   <FeatureBoardSpine {entering} scaleX={position.scaleX} scaleY={position.scaleY}
    onpose={(pose) => (motion = pose)} oncomplete={finish} />
  </SpineProvider>
 {/if}
 <main class="intro-screen" class:entering style={`--scene-url: url('${art}/environment-v3.png')`} aria-label="Wild Harvest start screen">
   <div class="scene" aria-hidden="true"></div>
   <div class="intro-layout">
   <header class="masthead">
    <p class="eyebrow">A DAY IN THE FIELDS</p>
    <h1><span>WILD</span><span>HARVEST</span></h1>
   </header>

   <div class="board-position" bind:this={boardAnchor}>
   <section class="covered-board" class:spine-ready={ready} style={`transform: translate(${motion.x}px, ${motion.y}px) rotate(${motion.rotation}deg) scale(${motion.scaleX}, ${motion.scaleY})`} aria-label="Wild Harvest features">
    <div class="canvas-cover">
     <div class="cover-stitch" aria-hidden="true"></div>
     <div class="cover-heading">THE HARVEST AWAITS</div>
     <div class="playcards">
      <article class="playcard">
       <div class="card-emblem crop-emblem" aria-hidden="true">
        <img src={`${base}/assets/intro-elements/full-harvest.png`} alt="" />
       </div>
       <h2>FULL HARVEST</h2>
       <strong class="feature-value">5,000×</strong>
       <p>MAX WIN</p>
      </article>
      <article class="playcard">
       <div class="card-emblem wild-emblem" aria-hidden="true">
        <img src={`${base}/assets/intro-elements/rooted-wild.png`} alt="" />
       </div>
       <h2>ROOTED WILDS</h2>
       <strong class="feature-value">STAY WILD</strong>
       <p>WILDS STICK IN THE BONUS</p>
      </article>
      <article class="playcard mystery-card">
       <div class="card-emblem mystery-emblem" aria-hidden="true"><span class="sealed-cloth">?</span></div>
       <h2>HIDDEN BONUS</h2>
       <strong class="feature-value">TO BE REVEALED</strong>
       <p>A SECRET STILL UNDER COVER</p>
      </article>
     </div>
    </div>
    <img class="board-frame" src={`${art}/board-frame.png`} alt="" aria-hidden="true" />
   </section>
   </div>

   <div class="action-area">
    {#if loadError}
     <p class="status-note" role="alert">The game could not load.</p>
    {:else if !ready}
     <p class="status-note" role="status" aria-live="polite">Preparing the fields…</p>
    {/if}
    {#if loadError}
     <button class="play-button" onclick={() => location.reload()} aria-label="Retry loading Wild Harvest"><span class="button-inner">TRY AGAIN</span></button>
    {:else}
     <button class="play-button" class:waiting={!ready} onclick={proceed} disabled={!ready || entering} aria-label={entering ? 'Entering game' : ready ? 'Play Wild Harvest' : 'Loading Wild Harvest'}>
      <span class="button-inner">{entering ? 'LET’S GO' : ready ? 'PLAY' : 'LOADING'}</span>
     </button>
    {/if}
    {#if !ready && !loadError}<div class="loading-track" role="progressbar" aria-label="Loading game assets" aria-valuemin="0" aria-valuemax="100" aria-valuenow={progress}><span class:indeterminate={progress === 0} style:width={`${progress || 34}%`}></span></div>{/if}
   </div>
  </div>
 </main>
{/if}

<style>
 @font-face{font-family:PickinsDisplay;src:url('/assets/fonts/luckiest-guy/Luckiest-Guy.ttf') format('truetype');font-display:swap}
 .intro-screen,.replay-loading{position:fixed;inset:0;z-index:10000;overflow:auto;color:#fff6dd;font-family:Georgia,serif}
 .intro-screen{display:grid;place-items:center;isolation:isolate;background:transparent}
 .scene{position:absolute;inset:0;pointer-events:none}
 .scene{z-index:-3}
 .intro-layout{position:relative;width:100%;height:100svh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px 22px;box-sizing:border-box;text-align:center}
 .masthead{position:absolute;top:clamp(0px,1vh,12px);z-index:4;animation:rise-in .45s ease-out both}
 .eyebrow{margin:0 0 4px;color:#fff0b4;font:900 clamp(11px,1.2vw,15px)/1 system-ui,sans-serif;letter-spacing:.28em;text-shadow:0 2px 5px #203825}
 h1{display:flex;justify-content:center;gap:.17em;margin:0;font:clamp(52px,6.2vw,88px)/.97 PickinsDisplay,Georgia,serif;letter-spacing:.01em;-webkit-text-stroke:clamp(2px,.25vw,3px) #442b17;text-shadow:0 3px 0 #fef2ac,0 7px 0 #a7662c,0 11px 0 #49301b,0 16px 17px #12251ec9}
 h1 span:first-child{color:#d7f462}h1 span:last-child{color:#ffda69}
 .board-position{position:relative;top:1vh;flex:none;width:min(90vw,calc(94svh * 1.7779),1850px);aspect-ratio:1672/941}
 .covered-board{position:absolute;inset:0;transform-origin:center;pointer-events:none}
 .spine-ready .board-frame,.spine-ready .cover-stitch,.spine-ready .canvas-cover:before{display:none}
 .spine-ready .canvas-cover{background:transparent;box-shadow:none}
 .spine-ready .playcard + .playcard{border:0}
 .board-frame{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:3}
 .canvas-cover{position:absolute;z-index:2;inset:11.9% 13.1% 17.6%;overflow:hidden;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4%;padding:3.3% 3%;box-sizing:border-box;color:#2f3f25;background:radial-gradient(ellipse at 50% 15%,#f2dfa8 0%,#dcc58d 57%,#bd9e68 100%);box-shadow:inset 0 0 30px #684622a6;transform-origin:50% 0}
 .canvas-cover:before{content:'';position:absolute;inset:0;pointer-events:none;opacity:.35;background:repeating-linear-gradient(96deg,transparent 0 3px,#714f2b18 3px 4px,transparent 4px 9px),repeating-linear-gradient(4deg,transparent 0 4px,#fff7d51a 4px 5px,transparent 5px 11px)}
 .cover-stitch{position:absolute;inset:5.5% 2.5% 4.2%;border:2px dashed #806b3f92;pointer-events:none}
 .cover-heading{position:relative;color:#35503a;font:clamp(15px,2vw,28px)/1 PickinsDisplay,Georgia,serif;letter-spacing:.06em;text-shadow:0 1px #fff2c6}
 .playcards{position:relative;width:100%;height:82%;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));align-items:stretch}
 .playcard{position:relative;min-width:0;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:0 6%;gap:2%;box-sizing:border-box}
 .playcard + .playcard{border-left:2px dashed #8b754e92}
 .card-emblem{position:relative;width:clamp(62px,9.5vw,145px);height:clamp(65px,10.2vw,150px);flex:none;filter:drop-shadow(0 6px 5px #66503480)}
 .crop-emblem,.wild-emblem{width:clamp(100px,16vw,210px);height:clamp(85px,12.5vw,165px)}
 .crop-emblem img,.wild-emblem img{display:block;width:100%;height:100%;object-fit:contain}
 .mystery-emblem{display:grid;place-items:center}.sealed-cloth{display:grid;place-items:center;width:72%;height:73%;border:4px solid #8d764a;border-radius:13% 12% 17% 15%;background:linear-gradient(140deg,#cdb884,#aa8d58);box-shadow:inset 0 0 0 3px #ead9a3,inset 0 8px 12px #6b502a6b;color:#f4e2ad;font:clamp(44px,6.2vw,85px)/1 PickinsDisplay,Georgia,serif;text-shadow:0 3px 1px #766034;transform:rotate(-5deg)}
 .playcard h2{margin:0;color:#35472b;font:clamp(16px,2vw,27px)/1 PickinsDisplay,Georgia,serif;letter-spacing:.015em;text-shadow:0 1px #fff4c8}
 .feature-value{color:#925522;font:clamp(24px,3vw,42px)/1 PickinsDisplay,Georgia,serif;white-space:nowrap;text-shadow:0 2px #ffedba}.mystery-card .feature-value{font-size:clamp(17px,2vw,27px)}
 .playcard p{min-height:2em;margin:0;color:#40523a;font:800 clamp(10px,1.08vw,15px)/1.2 system-ui,sans-serif;letter-spacing:.09em}
 .action-area{position:absolute;bottom:-6px;z-index:4;display:flex;align-items:center;flex-direction:column;gap:12px;height:89px;animation:rise-in .55s .16s ease-out both}
 .action-area .play-button{margin-top:4px}
 .action-area .status-note{position:absolute;bottom:100%;white-space:nowrap}
 .action-area .loading-track{position:absolute;top:calc(100% - 13px)}
 .status-note{margin:0;color:#fff0b7;font:700 14px system-ui,sans-serif;text-shadow:0 2px 4px #14261d}
 .play-button{min-width:250px;min-height:68px;padding:5px;border:2px solid #fff1ba;border-radius:15px;background:linear-gradient(#f9d67e,#ad622b);box-shadow:0 6px 0 #55351f,0 13px 22px #0a1a14a8;color:#39230f;cursor:pointer;transition:transform .15s ease,filter .15s ease,box-shadow .15s ease}
 .button-inner{min-height:54px;display:flex;align-items:center;justify-content:center;border:1px solid #fff1bb83;border-radius:9px;background:linear-gradient(#ffeb9b,#e6a845 55%,#ce8030);font:clamp(25px,2.5vw,34px)/1 PickinsDisplay,Georgia,serif;letter-spacing:.07em;text-shadow:0 1px 0 #fff4ae}
 .play-button:hover:not(:disabled){transform:translateY(-3px);filter:brightness(1.07)}.play-button:active:not(:disabled){transform:translateY(4px);box-shadow:0 2px 0 #55351f,0 7px 12px #0a1a14a8}.play-button:focus-visible{outline:4px solid #fff;outline-offset:5px}.play-button:disabled{cursor:wait;filter:saturate(.55)}
 .loading-track{width:220px;height:5px;overflow:hidden;border-radius:10px;background:#10251d;box-shadow:0 0 0 1px #ffe6a37a}.loading-track span{display:block;width:34%;height:100%;border-radius:10px;background:linear-gradient(90deg,#d7ee79,#ffe598);transition:width .22s ease}.loading-track span.indeterminate{animation:load-sweep 1.4s ease-in-out infinite}
 .entering .masthead,.entering .action-area{animation:departure .24s ease-in both}
 .replay-loading{display:flex;align-items:center;justify-content:center;flex-direction:column;gap:12px;background:radial-gradient(circle at 50% 42%,#526c49,#193427 75%);font:600 20px system-ui,sans-serif}.replay-mark{font-size:55px;color:#ffe49d}.replay-loading strong{font:52px PickinsDisplay,Georgia,serif;color:#e1f56e;text-shadow:0 4px 0 #493820}.replay-loading .loading-track{margin-top:10px}
 @keyframes load-sweep{from{transform:translateX(-110%)}to{transform:translateX(400%)}}@keyframes rise-in{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}@keyframes departure{to{opacity:0;transform:translateY(-16px)}}
 @media(max-width:760px){.intro-screen{background:#1c352b}.scene{background:var(--scene-url) center/cover no-repeat}.intro-layout{height:auto;min-height:100svh;gap:22px;justify-content:center;padding:28px 14px}.masthead,.action-area{position:static}.board-position{top:0;width:min(100%,480px);aspect-ratio:auto;min-height:550px}.covered-board{min-height:0}.board-frame{display:none}.canvas-cover,.spine-ready .canvas-cover{inset:17px;border:13px solid #a9672c;border-radius:12px;padding:22px 18px;gap:16px;background:radial-gradient(ellipse at 50% 15%,#f2dfa8 0%,#dcc58d 57%,#bd9e68 100%);box-shadow:inset 0 0 0 4px #e6aa54,0 12px 20px #112b20b8}.cover-heading{font-size:23px}.playcards{height:auto;flex:1;display:flex;flex-direction:column}.playcard{flex:1;min-height:0;display:grid;grid-template-columns:90px 1fr;grid-template-rows:auto auto auto;column-gap:12px;justify-items:start;text-align:left;padding:8px 4px}.playcard + .playcard,.spine-ready .playcard + .playcard{border-left:0;border-top:2px dashed #8b754e92}.card-emblem{grid-row:1/4;grid-column:1;width:82px;height:82px;align-self:center}.playcard h2{grid-column:2;font-size:21px}.feature-value{grid-column:2;font-size:29px}.mystery-card .feature-value{font-size:20px}.playcard p{grid-column:2;font-size:11px;min-height:0}.sealed-cloth{font-size:49px}.play-button{min-width:220px}}
 @media(max-width:760px){.action-area{height:auto}.action-area .play-button{margin-top:0}.action-area .status-note,.action-area .loading-track{position:static}}
 @media(max-width:420px){h1{flex-direction:column;gap:0;font-size:clamp(47px,13vw,62px)}.board-position{min-height:520px}.playcard{grid-template-columns:72px 1fr;column-gap:7px}.card-emblem{width:66px;height:66px}.playcard h2{font-size:18px}.feature-value{font-size:25px}.mystery-card .feature-value{font-size:17px}}
 @media(max-height:700px) and (min-width:761px){.intro-layout{padding:10px}.masthead h1{font-size:clamp(48px,5.3vw,70px)}.board-position{width:min(88vw,calc(84svh * 1.7779),1850px)}.play-button{min-height:56px}.button-inner{min-height:42px}}
 @media(prefers-reduced-motion:reduce){.scene,.masthead,.action-area,.loading-track span{animation:none!important}.entering .masthead,.entering .action-area{animation:departure .24s ease-in both!important}.play-button{transition:none}.loading-track span.indeterminate{width:100%;opacity:.55}}
</style>
