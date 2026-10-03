<script lang="ts">
 import { onMount, onDestroy } from 'svelte';
 import { StoryGameTemplate, StoryLocale } from 'components-storybook';
 import Game from './Game.svelte';
 import PlayerControls from './PlayerControls.svelte';
 import multiplierMath from '../game/multiplierPaytable.json';
 import selectedMath from '../game/selectedPaytable.json';
 import legacyMath from '../game/playerPaytable.json';
 import { stateBet } from 'state-shared';
 import { bookEventAmountToCurrencyString } from 'utils-shared/amount';
 import { SESSION_CONTROLS_DELAY_MS } from '../game/sessionIntro.mjs';
 let restoreBet=()=>{};
 let mounted=$state(false);
 let entryControlsReady=$state(false);
 onMount(()=>{
  const previous={betAmount:stateBet.betAmount,wageredBetAmount:stateBet.wageredBetAmount,currency:stateBet.currency};
  stateBet.betAmount=1;stateBet.wageredBetAmount=1;stateBet.currency='USD';
  restoreBet=()=>Object.assign(stateBet,previous);
  mounted=true;
 });
 import { getContext } from '../game/context';
 const context=getContext();
 $effect(()=>{
  if(!mounted||context.stateLayout.showLoadingScreen){entryControlsReady=false;return;}
  const timer=setTimeout(()=>entryControlsReady=true,SESSION_CONTROLS_DELAY_MS);
  return()=>clearTimeout(timer);
 });
 import { requestGeneratedRound, profiles, usesMultiplierRules } from '../game/generatedRound.mjs';
 import { addSessionRound, emptySessionStats } from '../game/sessionStats.mjs';
 let {profile='multiplier-wilds'}:{profile?:'natural'|'reference'|'quieter-base'|'multiplier-wilds'|'candidate-1'|'candidate-3'|'candidate-500k-1'|'candidate-1m-2'|'candidate-corrected-500k-3'|'candidate-corrected-500k-3-feel'|'candidate-corrected-1m-1'}=$props();
 const displayedMath=$derived(
  profile==='candidate-500k-1'||profile==='candidate-1m-2'
   ? multiplierMath
   : usesMultiplierRules(profile) ? selectedMath : legacyMath
 );
 import { playGeneratedRound, fixturePlayback, cancelFixtureAction } from '../game/fixturePlayback.svelte';
 let seed=crypto.getRandomValues(new Uint32Array(1))[0];
 let count=$state(0),returned=$state(0),requesting=$state(false),error=$state('');
 let stats=$state(emptySessionStats());
 let showStats=$state(false);
 let buyTier=$state<'low'|'medium'|'high'>('low');
 let buyArmed=$state(false);
 let armedBetAmount=$state<number|null>(null);
 const triggerBuy=$derived(profile==='candidate-corrected-1m-1');
 const highBuy=$derived(triggerBuy&&buyTier==='high');
 const mediumBuy=$derived(triggerBuy&&buyTier==='medium');
 const buyCost=$derived(highBuy?500:mediumBuy?200:50);
 const buySpins=$derived(highBuy?20:mediumBuy?15:10);
 const buyLabel=$derived(highBuy?'High':mediumBuy?'Medium':'Low');
 const money=(micros:number)=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(micros/1_000_000);
 const percent=(part:number,total:number)=>total>0?`${(part/total*100).toFixed(1)}%`:'—';
 let request:AbortController|null=null;
 let disposed=false;
 async function spin(forceBonus=false) {
  if(requesting||fixturePlayback.busy||disposed||context.stateLayout.showLoadingScreen)return;
  const mode:'base'|'bonus'|'standard_bonus_buy_medium'|'standard_bonus_buy_high'=buyArmed||forceBonus?(highBuy?'standard_bonus_buy_high':mediumBuy?'standard_bonus_buy_medium':'bonus'):'base';
  if(buyArmed&&armedBetAmount!==stateBet.betAmount){error='The bet changed while Standard Buy was armed. Cancel and choose the buy again.';return;}
  stateBet.wageredBetAmount=stateBet.betAmount;
  const betAmount=stateBet.wageredBetAmount;
  requesting=true;error='';request=new AbortController();
  const timeout=setTimeout(()=>request?.abort(),15000);
  try {
   const response=await requestGeneratedRound(seed,count,request.signal,profile,mode);
   clearTimeout(timeout);
   if(disposed)return;
   await playGeneratedRound(response);
   if(disposed||fixturePlayback.status!=='Complete')return;
   const bonusEntry=JSON.parse(response.bookJson).events.some((event:{type:string})=>event.type==='freeSpinTrigger');
   stats=addSessionRound(stats,{betAmount,roundUnits:fixturePlayback.roundTotal,bonusUnits:fixturePlayback.bonusTotal,bonusEntry,purchaseMultiplier:mode==='standard_bonus_buy_high'?500:mode==='standard_bonus_buy_medium'?200:mode==='bonus'?(profile==='candidate-1m-2'||profile==='candidate-corrected-1m-1'?50:100):1});
   if(mode!=='base'){buyArmed=false;armedBetAmount=null;}
   count+=1;returned+=fixturePlayback.roundTotal/100;
   return {win:fixturePlayback.roundTotal/100*betAmount,bonus:fixturePlayback.granted>0};
  } catch(e) {if(!disposed)error=`${String(e)}. Check that the local math server is running, then retry this round.`;}
  finally {clearTimeout(timeout);requesting=false;request=null;}
 }
 async function armBuy(){buyArmed=true;armedBetAmount=stateBet.betAmount;error='';}
 function cancelBuy(){if(!requesting&&!fixturePlayback.busy){buyArmed=false;armedBetAmount=null;}}
 onDestroy(()=>{disposed=true;request?.abort();cancelFixtureAction();restoreBet();});
</script>
<div class="generated-game"><StoryGameTemplate skipLoadingScreen={false} action={()=>spin()}>
 <StoryLocale lang="en"><Game fixtureOnly /></StoryLocale>
</StoryGameTemplate></div>
{#if mounted && entryControlsReady}
 {#if buyArmed}
  <div class="buy-armed" role="status"><strong>Standard Bonus Buy {buyLabel} armed</strong><span>Next spin: {money((armedBetAmount??stateBet.betAmount)*buyCost*1_000_000)} · guaranteed {buySpins} free spins</span><button type="button" onclick={cancelBuy} disabled={requesting||fixturePlayback.busy}>Cancel</button></div>
 {/if}
 <div class="session-stats">
  <button class="stats-toggle" type="button" aria-expanded={showStats} aria-controls="playtest-session-stats" onclick={()=>showStats=!showStats}>Session stats {showStats?'×':'▤'}</button>
  {#if showStats}
   <section class="stats-panel" id="playtest-session-stats" aria-label="Playtest session statistics">
    <div class="stats-heading"><strong>Session statistics</strong><button type="button" onclick={()=>stats=emptySessionStats()} disabled={requesting||fixturePlayback.busy}>Reset</button></div>
    <p class="stats-note">Observed results in this local playtest. Session RTP can vary widely and does not predict future spins.</p>
    <dl>
     <div><dt>Rounds</dt><dd>{stats.rounds}</dd></div>
     <div><dt>Wagered</dt><dd>{money(stats.wageredMicros)}</dd></div>
     <div><dt>Returned</dt><dd>{money(stats.paidMicros)}</dd></div>
     <div class="key"><dt>Session RTP</dt><dd>{percent(stats.paidMicros,stats.wageredMicros)}</dd></div>
     <div class="key"><dt>Net</dt><dd>{money(stats.paidMicros-stats.wageredMicros)}</dd></div>
     <div><dt>Paying rounds</dt><dd>{stats.positiveHits} ({percent(stats.positiveHits,stats.rounds)})</dd></div>
     <div><dt>Profitable rounds</dt><dd>{stats.profitableHits} ({percent(stats.profitableHits,stats.rounds)})</dd></div>
     <div><dt>Bonus entries</dt><dd>{stats.bonusEntries}</dd></div>
     <div><dt>Base returned</dt><dd>{money(stats.basePaidMicros)}</dd></div>
     <div><dt>Bonus returned</dt><dd>{money(stats.bonusPaidMicros)}</dd></div>
     <div><dt>Largest round</dt><dd>{money(stats.largestWinMicros)}</dd></div>
    </dl>
   </section>
  {/if}
 </div>
 <PlayerControls simulated simulatedBonusTier={triggerBuy?buyTier:undefined} onbonustierchange={(tier)=>{if(!buyArmed&&!requesting&&!fixturePlayback.busy)buyTier=tier;}} simulatedBonusCost={profile==='candidate-1m-2'||profile==='candidate-corrected-1m-1' ? buyCost : undefined} simulatedBonusRtp={profile==='candidate-1m-2'||profile==='candidate-corrected-1m-1' ? 0.967 : undefined} simulatedBonusMaxX={highBuy||mediumBuy?5000:profile==='candidate-1m-2' ? 1755.66 : profile==='candidate-corrected-1m-1' ? 2922.3 : undefined} simulatedBonusSpins={buySpins} simulatedBonusTitle={triggerBuy?`Standard Bonus Buy ${buyLabel}`:'Standard Bonus Buy'} simulatedBonusArmed={buyArmed} simulatedBuyArmsNextSpin={triggerBuy} busy={requesting||fixturePlayback.busy} onspin={()=>spin()} onbuy={triggerBuy?armBuy:profile==='multiplier-wilds'||profile==='candidate-1m-2'?()=>spin(true):undefined} math={displayedMath} multiplierRules={usesMultiplierRules(profile)} goldenPicksEnabled={!profile.startsWith('candidate-corrected')}/>
 {#if error}<p class="error" role="alert">{error}</p>{/if}
{/if}
<style>
.generated-game :global(.wrap){display:none}
.generated-game ~ :global(.player-controls),.session-stats{animation:playtest-ui-arrive .52s cubic-bezier(.2,.75,.2,1) both}
@keyframes playtest-ui-arrive{0%{opacity:0;translate:0 110px}72%{opacity:1;translate:0 -14px}100%{opacity:1;translate:0 0}}
@media(prefers-reduced-motion:reduce){.session-stats{animation:none}}
.error{position:fixed;top:10px;left:5%;max-width:90%;background:#392313;color:white;z-index:10001;padding:12px}
.session-stats{position:fixed;top:12px;right:12px;z-index:10002;font:14px/1.35 system-ui,sans-serif;color:#f8f1dc}
.buy-armed{position:fixed;left:50%;bottom:118px;transform:translateX(-50%);z-index:10002;display:flex;align-items:center;gap:10px;max-width:calc(100vw - 24px);padding:9px 12px;border:1px solid #f7d47e;border-radius:10px;background:#211915f2;color:#fff3ce;font:13px/1.3 system-ui,sans-serif;box-shadow:0 8px 22px #0008}.buy-armed button{border:1px solid #e9c575;border-radius:6px;background:#3d2d1f;color:#fff3ce;padding:5px 9px;cursor:pointer}.buy-armed button:disabled{opacity:.5;cursor:default}@media(max-width:640px){.buy-armed{bottom:100px;flex-wrap:wrap;justify-content:center;text-align:center;width:min(360px,calc(100vw - 24px))}}
.stats-toggle,.stats-heading button{border:1px solid #caa768;border-radius:8px;background:#2c211c;color:#f8f1dc;padding:8px 12px;cursor:pointer}
.stats-toggle:focus-visible,.stats-heading button:focus-visible{outline:3px solid #fff;outline-offset:2px}
.stats-panel{width:min(340px,calc(100vw - 24px));max-height:calc(100dvh - 64px);overflow:auto;margin-top:8px;padding:16px;border:1px solid #caa768;border-radius:12px;background:#211915f2;box-shadow:0 10px 35px #0009}
.stats-heading{display:flex;justify-content:space-between;align-items:center;gap:12px}
.stats-heading strong{font-size:17px}.stats-heading button{padding:5px 9px}.stats-heading button:disabled{opacity:.5;cursor:default}
.stats-note{color:#e0d4ba;font-size:12px;margin:10px 0}
dl{margin:0}dl div{display:flex;justify-content:space-between;gap:12px;padding:6px 0;border-top:1px solid #ffffff23}dt{color:#e0d4ba}dd{margin:0;text-align:right;font-variant-numeric:tabular-nums}.key{font-weight:700;color:#f6cf85}
</style>
