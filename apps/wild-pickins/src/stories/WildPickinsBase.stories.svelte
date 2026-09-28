<script lang="ts" module>
 import { defineMeta } from '@storybook/addon-svelte-csf';
 const { Story } = defineMeta({title:'WILD_PICKINS/Base fixtures'});
</script>
<script lang="ts">
 import { StoryGameTemplate, StoryLocale } from 'components-storybook';
 import Game from '../components/Game.svelte';
 import { setContext } from '../game/context';
 import FixtureStoryBoundary from '../components/FixtureStoryBoundary.svelte';
 import { playGeneratedRound, fixturePlayback } from '../game/fixturePlayback.svelte';
 const currentBooks=import.meta.glob('./data/current/*.json',{import:'default'}) as Record<string,()=>Promise<unknown>>;
 const current=async(name:string)=>{
  const load=currentBooks[`./data/current/${name}.json`];
  if(!load)throw Error(`Unknown fixture: ${name}`);
  return load();
 };
 setContext();

</script>
{#snippet template(args: {fixture: string; storyKey: string; animate?: boolean})}
 <FixtureStoryBoundary storyKey={args.storyKey}>
 <StoryGameTemplate skipLoadingScreen={false} action={async()=>{try { await playGeneratedRound(await current(args.fixture),{animate:args.animate}); } catch { /* Playback exposes the error and releases its lock. */ }}}>
  <StoryLocale lang="en"><Game fixtureOnly /></StoryLocale>
 </StoryGameTemplate>
 <div class="fixture-status" role="status">
  Fixture: {fixturePlayback.status} · Round win: {fixturePlayback.roundTotal/100}×
  {#if fixturePlayback.error}<strong>{fixturePlayback.error}</strong>{/if}
 </div>
 </FixtureStoryBoundary>
{/snippet}
<Story name="No-feature loss" args={{fixture:'base-loss',storyKey:'loss'}} {template}/>
<Story name="Basic line win" args={{fixture:'base-line-win',storyKey:'win'}} {template}/>
<Story name="Natural Wild — no hand" args={{fixture:'natural-wild-no-hand',storyKey:'natural'}} {template}/>
<Story name="Base win — animation disabled" args={{fixture:'base-no-animation',storyKey:'base-no-animation',animate:false}} {template}/>
<style>
 .fixture-status {position:fixed;left:12px;bottom:12px;z-index:10000;background:#172019;color:white;padding:8px 12px;font:14px monospace;pointer-events:none;}
 strong {display:block;color:#ffb4a9;}
</style>
