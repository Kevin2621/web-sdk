<script lang="ts" module>
 import { defineMeta } from '@storybook/addon-svelte-csf';
 const { Story } = defineMeta({title:'WILD_PICKINS/Base fixtures'});
</script>
<script lang="ts">
 import { StoryGameTemplate, StoryLocale, templateArgs, type TemplateArgs } from 'components-storybook';
 import Game from '../components/Game.svelte';
 import { setContext } from '../game/context';
 import FixtureStoryBoundary from '../components/FixtureStoryBoundary.svelte';
 import { playBaseFixture, fixturePlayback, playFixtureBatch } from '../game/fixturePlayback.svelte';
 import loss from './data/wild-pickins/base-loss.json';
 import win from './data/wild-pickins/base-line-win.json';
 import natural from './data/wild-pickins/natural-wild-no-pick.json';
 import golden from './data/wild-pickins/golden-line-win.json';
 import noWin from './data/wild-pickins/golden-no-win.json';
 const cellBooks=import.meta.glob('./data/wild-pickins/golden-cell-*.json',{eager:true,import:'default'});
 setContext();

</script>
{#snippet template(args: TemplateArgs<any>)}
 <FixtureStoryBoundary action={args.action} data={args.data}>
 <StoryGameTemplate skipLoadingScreen={true} action={async()=>{try { await args.action?.(args.data); } catch { /* Playback exposes the error and releases its lock. */ }}}>
  <StoryLocale lang="en"><Game fixtureOnly /></StoryLocale>
 </StoryGameTemplate>
 <div class="fixture-status" role="status">
  Fixture: {fixturePlayback.status} · Round win: {fixturePlayback.roundTotal/100}×
  {#if fixturePlayback.error}<strong>{fixturePlayback.error}</strong>{/if}
 </div>
 </FixtureStoryBoundary>
{/snippet}
<Story name="No-feature loss" args={templateArgs({data:loss,action:playBaseFixture})} {template}/>
<Story name="Basic line win" args={templateArgs({data:win,action:playBaseFixture})} {template}/>
<Story name="Natural Wild — no hand" args={templateArgs({data:natural,action:playBaseFixture})} {template}/>
<Story name="Golden Crop completes line" args={templateArgs({data:golden,action:playBaseFixture})} {template}/>
<Story name="Golden Crop without win" args={templateArgs({data:noWin,action:playBaseFixture})} {template}/>
<Story name="Golden Crop — animation disabled" args={templateArgs({data:golden,action:async(data)=>playBaseFixture(data,{animate:false})})} {template}/>
<Story name="All 15 target cells" args={templateArgs({data:{},action:async()=>{await playFixtureBatch(Object.keys(cellBooks).sort().map(key=>cellBooks[key]));}})} {template}/>
<style>
 .fixture-status {position:fixed;left:12px;bottom:12px;z-index:10000;background:#172019;color:white;padding:8px 12px;font:14px monospace;pointer-events:none;}
 strong {display:block;color:#ffb4a9;}
</style>
