<script lang="ts" module>
 import { defineMeta } from '@storybook/addon-svelte-csf';
 const { Story }=defineMeta({title:'WILD_PICKINS/Bonus fixtures'});
</script>
<script lang="ts">
 import { StoryGameTemplate, StoryLocale, templateArgs, type TemplateArgs } from 'components-storybook';
 import Game from '../components/Game.svelte';
 import FixtureStoryBoundary from '../components/FixtureStoryBoundary.svelte';
 import { setContext } from '../game/context';
 import { playBonusFixture, fixturePlayback } from '../game/fixturePlayback.svelte';
 import book0 from './data/wild-pickins-bonus/bonus-cap-suppresses-awards.json';
 import book1 from './data/wild-pickins-bonus/bonus-natural-pick-collisions.json';
 import book2 from './data/wild-pickins-bonus/bonus-no-target.json';
 import book3 from './data/wild-pickins-bonus/combined-budget-clipping.json';
 import book4 from './data/wild-pickins-bonus/entry-3.json';
 import book5 from './data/wild-pickins-bonus/entry-4.json';
 import book6 from './data/wild-pickins-bonus/entry-5.json';
 import book7 from './data/wild-pickins-bonus/full-harvest-natural-collision.json';
 import book8 from './data/wild-pickins-bonus/full-harvest-pick.json';
 import book9 from './data/wild-pickins-bonus/hidden-scatter.json';
 import book10 from './data/wild-pickins-bonus/last-spin-collision.json';
 import book11 from './data/wild-pickins-bonus/retrigger-3.json';
 import book12 from './data/wild-pickins-bonus/retrigger-4.json';
 import book13 from './data/wild-pickins-bonus/retrigger-5.json';
 import capBook from './data/wild-pickins-bonus/retrigger-budget-30.json';
 setContext();
</script>
{#snippet template(args: TemplateArgs<any>)}
 <FixtureStoryBoundary action={args.action} data={args.data}>
  <StoryGameTemplate skipLoadingScreen={true} action={async()=>{try{await args.action?.(args.data);}catch{ /* error panel */ }}}>
   <StoryLocale lang="en"><Game fixtureOnly /></StoryLocale>
  </StoryGameTemplate>
  {#if fixturePlayback.error}<div role="alert">{fixturePlayback.error}</div>{/if}
 </FixtureStoryBoundary>
{/snippet}
<Story name="Vine review — direct bonus" args={templateArgs({data:book8,action:async(data)=>playBonusFixture(data,{startAtBonus:true})})} {template}/>
<Story name="bonus-cap-suppresses-awards" args={templateArgs({data:book0,action:playBonusFixture})} {template}/>
<Story name="bonus-natural-pick-collisions" args={templateArgs({data:book1,action:playBonusFixture})} {template}/>
<Story name="bonus-no-target" args={templateArgs({data:book2,action:playBonusFixture})} {template}/>
<Story name="combined-budget-clipping" args={templateArgs({data:book3,action:playBonusFixture})} {template}/>
<Story name="entry-3" args={templateArgs({data:book4,action:playBonusFixture})} {template}/>
<Story name="entry-4" args={templateArgs({data:book5,action:playBonusFixture})} {template}/>
<Story name="entry-5" args={templateArgs({data:book6,action:playBonusFixture})} {template}/>
<Story name="full-harvest-natural-collision" args={templateArgs({data:book7,action:playBonusFixture})} {template}/>
<Story name="full-harvest-pick" args={templateArgs({data:book8,action:playBonusFixture})} {template}/>
<Story name="hidden-scatter" args={templateArgs({data:book9,action:playBonusFixture})} {template}/>
<Story name="last-spin-collision" args={templateArgs({data:book10,action:playBonusFixture})} {template}/>
<Story name="retrigger-3" args={templateArgs({data:book11,action:playBonusFixture})} {template}/>
<Story name="retrigger-4" args={templateArgs({data:book12,action:playBonusFixture})} {template}/>
<Story name="retrigger-5" args={templateArgs({data:book13,action:playBonusFixture})} {template}/>
<Story name="retrigger-budget-30" args={templateArgs({data:capBook,action:playBonusFixture})} {template}/>
<Story name="Full Harvest — animation disabled" args={templateArgs({data:book8,action:async(data)=>playBonusFixture(data,{animate:false})})} {template}/>
