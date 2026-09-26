<script lang="ts">
 import { Sprite, Container } from 'pixi-svelte';
 import { getContext } from '../game/context';
 import { refreshScene } from '../game/artRefresh';
 const context = getContext();
 const canvas = $derived(context.stateLayoutDerived.canvasSizes());
 // Like the SDK template backgrounds: one viewport-covering image, independent of reel fit.
 const background = $derived(context.stateLayoutDerived.normalBackgroundLayout({scale: 1}));
 const scale = $derived(Math.max(canvas.width / refreshScene.width, canvas.height / refreshScene.height));
</script>
<Container x={background.x} y={background.y}>
 <Sprite key="wpRefreshEnvironment" anchor={0.5} width={refreshScene.width * scale + 12} height={refreshScene.height * scale + 12} />
 {#if refreshScene.showClouds}
  <Sprite key="wpRefreshCloud1" x={-canvas.width*.4} y={-canvas.height*.35} width={240*scale} height={120*scale} />
  <Sprite key="wpRefreshCloud2" x={canvas.width*.28} y={-canvas.height*.4} width={280*scale} height={140*scale} />
  <Sprite key="wpRefreshCloud3" x={canvas.width*.08} y={-canvas.height*.44} width={210*scale} height={105*scale} />
 {/if}
</Container>
