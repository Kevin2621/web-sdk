<script lang="ts">
 import { onMount, onDestroy } from 'svelte';
 import { StoryGameTemplate, StoryLocale } from 'components-storybook';
 import Game from './Game.svelte';
 import PlayerControls from './PlayerControls.svelte';
 import multiplierMath from '../game/multiplierPaytable.json';
 import { stateBet } from 'state-shared';
 import { bookEventAmountToCurrencyString } from 'utils-shared/amount';
 let restoreBet=()=>{};
 let mounted=$state(false);
 onMount(()=>{
  const previous={betAmount:stateBet.betAmount,wageredBetAmount:stateBet.wageredBetAmount,currency:stateBet.currency};
  stateBet.betAmount=1;stateBet.wageredBetAmount=1;stateBet.currency='USD';
  restoreBet=()=>Object.assign(stateBet,previous);
  mounted=true;
 });
 import { getContext } from '../game/context';
 const context=getContext();
 import { requestGeneratedRound, profiles, usesMultiplierRules } from '../game/generatedRound.mjs';
 let {profile='multiplier-wilds'}:{profile?:'natural'|'reference'|'quieter-base'|'multiplier-wilds'|'candidate-1'|'candidate-3'|'candidate-500k-1'}=$props();
 import { playGeneratedRound, fixturePlayback, cancelFixtureAction } from '../game/fixturePlayback.svelte';
 let seed=crypto.getRandomValues(new Uint32Array(1))[0];
 let count=$state(0),returned=$state(0),requesting=$state(false),error=$state('');
 let request:AbortController|null=null;
 let disposed=false;
 async function spin(mode:'base'|'bonus'='base') {
  if(requesting||fixturePlayback.busy||disposed||context.stateLayout.showLoadingScreen)return;
  stateBet.wageredBetAmount=stateBet.betAmount;
  requesting=true;error='';request=new AbortController();
  const timeout=setTimeout(()=>request?.abort(),15000);
  try {
   const response=await requestGeneratedRound(seed,count,request.signal,profile,mode);
   clearTimeout(timeout);
   if(disposed)return;
   await playGeneratedRound(response);
   if(disposed||fixturePlayback.status!=='Complete')return;
   count+=1;returned+=fixturePlayback.roundTotal/100;
   return {win:fixturePlayback.roundTotal/100*stateBet.wageredBetAmount,bonus:fixturePlayback.granted>0};
  } catch(e) {if(!disposed)error=`${String(e)}. Check that the local math server is running, then retry this round.`;}
  finally {clearTimeout(timeout);requesting=false;request=null;}
 }
 onDestroy(()=>{disposed=true;request?.abort();cancelFixtureAction();restoreBet();});
</script>
<div class="generated-game"><StoryGameTemplate skipLoadingScreen={false} action={()=>spin()}>
 <StoryLocale lang="en"><Game fixtureOnly /></StoryLocale>
</StoryGameTemplate></div>
{#if mounted}
 <PlayerControls simulated busy={requesting||fixturePlayback.busy} onspin={()=>spin()} onbuy={profile==='multiplier-wilds'?()=>spin('bonus'):undefined} math={usesMultiplierRules(profile)?multiplierMath:undefined} multiplierRules={usesMultiplierRules(profile)}/>
 {#if error}<p class="error" role="alert">{error}</p>{/if}
{/if}
<style>.generated-game :global(.wrap){display:none}.error{position:fixed;top:10px;left:5%;max-width:90%;background:#392313;color:white;z-index:10001;padding:12px}</style>
