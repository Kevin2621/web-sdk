<script lang="ts" module>
 import { defineMeta } from '@storybook/addon-svelte-csf';
 const { Story }=defineMeta({title:'Wild Pickins/Max Win',id:'wild-pickins-max-win'});
</script>
<script lang="ts">
 import { StoryGameTemplate, StoryLocale } from 'components-storybook';
 import { stateBet } from 'state-shared';
 import Game from '../components/Game.svelte';
 import Win from '../components/Win.svelte';
 import { setContext } from '../game/context';
 import { playBookEvent } from '../game/utils';
 import config from '../game/config';
 setContext();
 async function preview(){
  stateBet.betAmount=1;stateBet.wageredBetAmount=1;
  await playBookEvent({index:0,type:'setWin',amount:config.betModes.base.max_win*100,winLevel:10},{bookEvents:[]});
 }
</script>
<Story name="Max Win">
 <StoryGameTemplate skipLoadingScreen={true} action={preview}>
  <StoryLocale lang="en">
   <Game fixtureOnly={true}>{#snippet presentation()}<Win />{/snippet}</Game>
  </StoryLocale>
 </StoryGameTemplate>
</Story>
