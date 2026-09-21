<script lang="ts">
 import { Sprite } from 'pixi-svelte';
 import { getContext } from '../game/context';
 const context = getContext();
 const canvas = $derived(context.stateLayoutDerived.canvasSizes());
 // Extend 12px past every canvas edge to cover the Scatter thud displacement.
 const overscan = 12;
 const scale = $derived(Math.max((canvas.width + overscan*2) / 1672, (canvas.height + overscan*2) / 941));
</script>
<Sprite key="wpField" anchor={0.5} x={canvas.width/2} y={canvas.height/2} width={1672*scale} height={941*scale} zIndex={-3} />
