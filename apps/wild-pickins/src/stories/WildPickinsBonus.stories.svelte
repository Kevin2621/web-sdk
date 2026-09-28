<script lang="ts" module>
 import { defineMeta } from '@storybook/addon-svelte-csf';
 const { Story }=defineMeta({title:'WILD_PICKINS/Bonus fixtures'});
</script>
<script lang="ts">
 import { StoryGameTemplate, StoryLocale } from 'components-storybook';
 import Game from '../components/Game.svelte';
 import FixtureStoryBoundary from '../components/FixtureStoryBoundary.svelte';
 import { setContext } from '../game/context';
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
  <StoryGameTemplate skipLoadingScreen={false} action={async()=>{try{await playGeneratedRound(await current(args.fixture),{animate:args.animate});}catch{ /* error panel */ }}}>
   <StoryLocale lang="en"><Game fixtureOnly /></StoryLocale>
  </StoryGameTemplate>
  {#if fixturePlayback.error}<div role="alert">{fixturePlayback.error}</div>{/if}
 </FixtureStoryBoundary>
{/snippet}
<Story name="Purchased bonus — direct entry" args={{fixture:'direct-bonus',storyKey:'direct-bonus'}} {template}/>
<Story name="Round cap suppresses awards" args={{fixture:'bonus-cap-suppresses-awards',storyKey:'bonus-cap'}} {template}/>
<Story name="Natural Wild collisions" args={{fixture:'natural-wild-collisions',storyKey:'natural-collisions'}} {template}/>
<Story name="Baseline bonus — no extra spins" args={{fixture:'baseline-bonus',storyKey:'baseline-bonus'}} {template}/>
<Story name="Spin-budget collision clipping" args={{fixture:'spin-budget-collision-clipping',storyKey:'budget-clipping'}} {template}/>
<Story name="Three-scatter entry" args={{fixture:'entry-3',storyKey:'entry-3'}} {template}/>
<Story name="Four-scatter entry" args={{fixture:'entry-4',storyKey:'entry-4'}} {template}/>
<Story name="Five-scatter entry" args={{fixture:'entry-5',storyKey:'entry-5'}} {template}/>
<Story name="Dense natural Wild collisions" args={{fixture:'dense-natural-wild-collisions',storyKey:'dense-collisions'}} {template}/>
<Story name="Heavy Wild accumulation" args={{fixture:'heavy-wild-accumulation',storyKey:'heavy-wilds'}} {template}/>
<Story name="Last-spin Wild collision" args={{fixture:'last-spin-collision',storyKey:'last-spin'}} {template}/>
<Story name="Heavy Wilds — animation disabled" args={{fixture:'heavy-wild-accumulation',storyKey:'heavy-wilds-no-animation',animate:false}} {template}/>
