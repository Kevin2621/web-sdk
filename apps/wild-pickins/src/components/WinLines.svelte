<script lang="ts">
 import WinLinePresentation from './WinLinePresentation.svelte';
 import { winLinePresentation } from '../game/winLinePresentation.svelte';

 let { layer = 'board' }: { layer?: 'board' | 'total' } = $props();
</script>

{#if winLinePresentation.active && !winLinePresentation.previewOnly}
 <WinLinePresentation wins={winLinePresentation.wins} speed={winLinePresentation.speed} elapsed={winLinePresentation.elapsed} {layer} />
{/if}
