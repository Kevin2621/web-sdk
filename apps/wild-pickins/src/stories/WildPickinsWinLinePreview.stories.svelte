<script lang="ts" module>
 import { defineMeta } from '@storybook/addon-svelte-csf';
 const { Story } = defineMeta({title:'WILD_PICKINS/Win line preview'});
</script>
<script lang="ts">
 import { MainContainer } from 'components-layout';
 import { StoryGameTemplate, StoryLocale } from 'components-storybook';
 import Game from '../components/Game.svelte';
 import { setContext } from '../game/context';
 import FixtureStoryBoundary from '../components/FixtureStoryBoundary.svelte';
 import WinLinePreview from './WinLinePreview.svelte';
 import winResponse from './data/current/base-line-win.json';
 import type { Position } from '../game/types';
 setContext();
 type Speed = 'base' | 'quick' | 'ultra';
 type PayoutMode = 'float' | 'collect';
 type PayoutPlacement = 'clear' | 'center';
 const events=JSON.parse(winResponse.bookJson).events as Array<{
  type:string;
  board?: {name:string}[][];
  wins?: {positions:Position[];win:number}[];
 }>;
 const reveal=events.find(e=>e.type==='reveal');
 const winInfo=events.find(e=>e.type==='winInfo');
 const singleLine=winInfo?.wins[0]?.positions ?? [];
 const singleAmount=winInfo?.wins[0]?.win ?? 0;
 // Three separate lines for presentation timing previews; the single win above uses a recorded current round.
 const threeLines = [[0,0,0],[2,2,1],[1,1,2]].map(rows =>
  rows.map((row,reel) => ({reel,row:row+1}))
 );
 const threeAmounts=[136,136,136];
 const singleBoard=structuredClone(reveal?.board ?? []);
 const threeBoard=structuredClone(singleBoard);
 const symbols=['C01','C02','C03'];
 threeLines.forEach((line,index) =>
  line.forEach(({reel,row}) => {threeBoard[reel][row]={name:symbols[index]};})
 );
</script>
{#snippet template(args:{storyKey:string;lines:Position[][];amounts:number[];speed:Speed;multiple:boolean;payoutMode?:PayoutMode;payoutPlacement?:PayoutPlacement})}
 <FixtureStoryBoundary storyKey={args.storyKey}>
  <div class="win-line-story">
  <StoryGameTemplate skipLoadingScreen={true} action={async () => {}}>
   <StoryLocale lang="en">
    <Game fixtureOnly={true}>
     {#snippet presentation()}
      <MainContainer><WinLinePreview lines={args.lines} amounts={args.amounts} speed={args.speed} payoutMode={args.payoutMode ?? 'float'} payoutPlacement={args.payoutPlacement ?? 'clear'} board={args.multiple ? threeBoard : singleBoard} /></MainContainer>
     {/snippet}
    </Game>
   </StoryLocale>
  </StoryGameTemplate>
  </div>
 </FixtureStoryBoundary>
{/snippet}
<Story name="Single win — line and dimming" args={{storyKey:'single-line',lines:[singleLine],amounts:[singleAmount],speed:'base',multiple:false}} {template}/>
<Story name="Three wins — base speed" args={{storyKey:'three-base',lines:threeLines,amounts:threeAmounts,speed:'base',multiple:true}} {template}/>
<Story name="Three wins — quick speed" args={{storyKey:'three-quick',lines:threeLines,amounts:threeAmounts,speed:'quick',multiple:true}} {template}/>
<Story name="Three wins — ultra speed" args={{storyKey:'three-ultra',lines:threeLines,amounts:threeAmounts,speed:'ultra',multiple:true}} {template}/>
<Story name="Three wins — merged total, base" args={{storyKey:'merged-base',lines:threeLines,amounts:threeAmounts,speed:'base',multiple:true,payoutMode:'collect'}} {template}/>
<Story name="Three wins — merged total, quick" args={{storyKey:'merged-quick',lines:threeLines,amounts:threeAmounts,speed:'quick',multiple:true,payoutMode:'collect'}} {template}/>
<Story name="Three wins — centered payouts" args={{storyKey:'centered-payouts',lines:threeLines,amounts:threeAmounts,speed:'base',multiple:true,payoutPlacement:'center'}} {template}/>
<Story name="Three wins — centered payouts, merged total" args={{storyKey:'centered-merged',lines:threeLines,amounts:threeAmounts,speed:'base',multiple:true,payoutPlacement:'center',payoutMode:'collect'}} {template}/>
<Story name="Three wins — centered merge, quick" args={{storyKey:'centered-merged-quick',lines:threeLines,amounts:threeAmounts,speed:'quick',multiple:true,payoutPlacement:'center',payoutMode:'collect'}} {template}/>
<Story name="Three wins — centered merge, ultra" args={{storyKey:'centered-merged-ultra',lines:threeLines,amounts:threeAmounts,speed:'ultra',multiple:true,payoutPlacement:'center',payoutMode:'collect'}} {template}/>
<style>
 .win-line-story :global(.wrap) {display:none;}
</style>
