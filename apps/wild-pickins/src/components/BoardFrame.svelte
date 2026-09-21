<script lang="ts" module>
 export type EmitterEventBoardFrame = { type: 'boardFrameGlowShow' } | { type: 'boardFrameGlowHide' };
</script>
<script lang="ts">
 import { Sprite } from 'pixi-svelte';
 import { getContext } from '../game/context';
 const context = getContext();
 const board = $derived(context.stateGameDerived.boardLayout());
 // Original opening: x=120..1495, y=197..748 in the 1619×971 artwork.
 // Preserve its nonuniform stretch and align the opening with the reels.
 const width = $derived(board.width * 1619 / 1375);
 const height = $derived(board.height * 971 / 551);
</script>
<Sprite key="wpFrame" anchor={0.5} x={board.x}
 y={board.y + (485.5-472.5)*height/971} {width} {height} />
