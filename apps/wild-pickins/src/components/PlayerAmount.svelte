<script lang="ts">
 import { onMount } from 'svelte';
 import money from '../game/playerMoney';
 import { stateBet } from 'state-shared';
 let {amount,language='en',maxFontSize=32}:{amount:number;language?:string;maxFontSize?:number}=$props();
 let node:HTMLSpanElement;
 const formatted=$derived(money.formatMoney(amount,stateBet.currency,language));
 function fit(){if(!node)return;let size=maxFontSize;node.style.fontSize=`${size}px`;while(node.scrollWidth>node.clientWidth&&size>16)node.style.fontSize=`${--size}px`;}
 $effect(()=>{formatted;maxFontSize;queueMicrotask(fit)});
 onMount(()=>{let width=-1;const observer=new ResizeObserver(()=>{if(node.clientWidth!==width){width=node.clientWidth;fit();}});observer.observe(node);return()=>observer.disconnect();});
</script>
<span bind:this={node} dir={formatted.direction} title={formatted.text}>{formatted.text}</span>
<style>span{display:block;max-width:100%;white-space:nowrap;overflow:auto;font-variant-numeric:tabular-nums;line-height:1.25}</style>
