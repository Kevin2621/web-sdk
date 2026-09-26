<script lang="ts">
 import { PreviewCanvas, Sprite } from 'pixi-svelte';
 import { curtainSeeds, clusterPose, looseSeeds, loosePose, growingVolleyPose, makeBagVolley } from '../game/seedCurtain.mjs';
 type Volley = {id:string;at:number;x:number;y:number;size:number;seed:ReturnType<typeof makeBagVolley>[number]};
 let {progress,width,height,volleys,clock=0}: {progress:number;width:number;height:number;volleys?:Volley[];clock?:number}=$props();
</script>
<div class="curtain" aria-hidden="true">
 <PreviewCanvas {width} {height} label="Falling seeds">
  {#if volleys}
   {#each volleys as volley,index (volley.id)}
    {@const pose=growingVolleyPose(volley.seed,clock-volley.at,volley.x,volley.y,volley.size,width,height,progress,index,volleys.length)}
    <Sprite key={`wpCurtainSeed${volley.seed.variant}`} anchor={.5} {...pose} />
   {/each}
  {:else}
  {#each curtainSeeds as seed}
   {@const pose=clusterPose(seed,progress,width,height)}
   <Sprite key="wpCurtainCluster" anchor={.5} {...pose} />
  {/each}
  {#each looseSeeds as seed}
   {@const pose=loosePose(seed,progress,width,height)}
   <Sprite key={`wpCurtainSeed${seed.variant}`} anchor={.5} {...pose} />
  {/each}
  {/if}
 </PreviewCanvas>
</div>
<style>.curtain{position:absolute;inset:0;pointer-events:none;z-index:10;overflow:hidden}</style>
