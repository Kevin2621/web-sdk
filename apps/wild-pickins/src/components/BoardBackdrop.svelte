<script lang="ts">
 import { Rectangle } from 'pixi-svelte';
 import { getContext } from '../game/context';
 const context = getContext();
 const board = $derived(context.stateGameDerived.boardLayout());
 let glow = $state(false);
 context.eventEmitter.subscribeOnMount({boardFrameGlowShow:()=>glow=true,boardFrameGlowHide:()=>glow=false});
</script>
<Rectangle x={board.x} y={board.y} anchor={0.5} width={board.width+10} height={board.height+10} backgroundColor={context.stateGameDerived.hasActiveWin() ? 0x1a2819 : 0x283e26} backgroundAlpha={0.94} borderColor={0xf7d16b} borderWidth={glow ? 5 : 0} />
