<script lang="ts">
 import { Text } from 'pixi-svelte';
 import WinLineStroke from './WinLineStroke.svelte';
 import BoardContainer from './BoardContainer.svelte';
 import { SYMBOL_SIZE } from '../game/constants';
 import { getSymbolX } from '../game/utils';
 import { getWinLineTiming, type WinLineSpeed, type WinLinePayoutMode } from '../game/winLineTiming';
 import type { Position } from '../game/types';

 type Win = {positions:Position[];amount:number};
 type Placement = 'clear' | 'center';
 type Layer = 'board' | 'total' | 'both';
 let { wins, elapsed, speed, payoutMode = 'collect', payoutPlacement = 'center', layer = 'both' }: {
  wins:Win[]; elapsed:number; speed:WinLineSpeed;
  payoutMode?:WinLinePayoutMode; payoutPlacement?:Placement; layer?:Layer;
 } = $props();
 const timing = $derived(getWinLineTiming(wins.length,speed,payoutMode));
 const points = $derived(wins.map(win => [...win.positions].sort((a,b) => a.reel-b.reel).map(p => ({x:getSymbolX(p.reel),y:(p.row-0.5)*SYMBOL_SIZE}))));
 const labelPositions = $derived(points.map(path => {
  const middle = path[Math.floor(path.length/2)];
  const x = payoutPlacement === 'center' ? middle.x : path.reduce((sum,p)=>sum+p.x,0)/path.length;
  const centroidY = path.reduce((sum,p)=>sum+p.y,0)/path.length;
  const lineY = middle.y;
  const clearance = SYMBOL_SIZE*0.27;
  const y = payoutPlacement === 'center' ? lineY : Math.abs(centroidY-lineY)<clearance
   ? lineY+(centroidY>lineY ? clearance : -clearance)
   : centroidY;
  return {x,y};
 }));
 const separatedLabelPositions = $derived(labelPositions.map((position,index) => {
  const overlapIndex = labelPositions.slice(0,index).filter(other =>
   Math.abs(other.x-position.x)<1 && Math.abs(other.y-position.y)<1).length;
  if (!overlapIndex) return position;
  const direction = overlapIndex%2 ? 1 : -1;
  const distance = Math.ceil(overlapIndex/2)*SYMBOL_SIZE*0.29;
  return {x:position.x,y:position.y+direction*distance};
 }));
 const payoutCenter = $derived({
  x: speed === 'ultra' ? getSymbolX(2) : labelPositions.reduce((sum,p)=>sum+p.x,0)/Math.max(1,labelPositions.length),
  y: speed === 'ultra' ? SYMBOL_SIZE*1.5 : labelPositions.reduce((sum,p)=>sum+p.y,0)/Math.max(1,labelPositions.length),
 });
 const ease = (value:number) => {
  const t = Math.max(0, Math.min(1, value));
  return t*t*(3-2*t);
 };
 const darkness = $derived(elapsed < timing.schedule.dim
  ? ease(elapsed/timing.schedule.dim)
  : elapsed < timing.lightStart ? 1
  : 1-ease((elapsed-timing.lightStart)/timing.schedule.light));
 const boardReleased = $derived(speed === 'ultra' && timing.collect && elapsed >= timing.lightStart + timing.schedule.light);
 const mergeProgress = $derived(timing.collect ? ease((elapsed-timing.mergeStart)/timing.mergeDuration) : 0);
 const totalAppear = $derived(timing.collect ? ease((elapsed-(timing.mergeEnd-(timing.quickTiming ? 55 : 80)))/(timing.quickTiming ? 100 : 140)) : 0);
 const totalExit = $derived(timing.collect ? ease((elapsed-(timing.mergeEnd+timing.totalHold))/timing.totalExitDuration) : 0);
 const lineStates = $derived(points.map((path,index) => {
  const start = timing.schedule.dim + (speed === 'ultra' ? 0 : index*timing.schedule.line);
  const drawn = Math.max(0,Math.min(1,(elapsed-start)/timing.schedule.draw));
  const finishedAt = start+timing.schedule.line;
  const trail = speed === 'ultra' ? 1 : 0.45+0.55*(1-ease((elapsed-finishedAt)/180));
  const alpha = drawn === 0 ? 0 : trail*darkness;
  const labelStart = start+timing.schedule.draw*0.2;
  const labelAge = elapsed-labelStart;
  const appear = ease(labelAge/(timing.quickTiming ? 90 : 140));
  const settle = ease((labelAge-(timing.quickTiming ? 90 : 140))/(timing.quickTiming ? 80 : 120));
  const scale = (0.7+0.42*appear-0.12*settle)*(1-0.18*mergeProgress);
  const exit = ease((elapsed-(finishedAt-(timing.quickTiming ? 90 : 130)))/(timing.quickTiming ? 180 : 280));
  const labelAlpha = appear*(timing.collect ? 1-mergeProgress : 1-exit)*darkness;
  const anchor = separatedLabelPositions[index];
  const labelX = anchor.x+(payoutCenter.x-anchor.x)*mergeProgress;
  const labelY = timing.collect
   ? anchor.y+(payoutCenter.y-anchor.y)*mergeProgress
   : anchor.y-SYMBOL_SIZE*0.45*exit;
  return {path,drawn,alpha,labelAlpha,labelX,labelY,scale,amount:wins[index].amount};
 }));
 const totalAlpha = $derived(totalAppear*(1-totalExit)*(speed === 'ultra' && timing.collect ? 1 : darkness));
 const totalScale = $derived(0.75+0.4*totalAppear-0.1*ease((elapsed-timing.mergeEnd)/150));
 const totalAmount = $derived(Math.round(wins.reduce((sum,win)=>sum+win.amount,0)
  *ease((elapsed-(timing.mergeEnd-(timing.quickTiming ? 55 : 80)))/(speed === 'ultra' && timing.collect ? 100 : timing.quickTiming ? 200 : 280))));
</script>

{#if wins.length}
 <BoardContainer>
  {#if layer !== 'total' && !boardReleased}
  {#each lineStates as line,index (index)}
   <WinLineStroke points={line.path} drawn={line.drawn} color={0x64b5ff} width={16} alpha={0.22*line.alpha} />
   <WinLineStroke points={line.path} drawn={line.drawn} color={0x9dd6ff} width={8} alpha={0.5*line.alpha} />
   <WinLineStroke points={line.path} drawn={line.drawn} color={0xf6fbff} width={3} alpha={line.alpha} />
  {/each}
  {#each lineStates as line,index (index)}
   <Text anchor={0.5} x={line.labelX} y={line.labelY} scale={line.scale}
    alpha={line.labelAlpha} text={`${(line.amount/100).toFixed(2)}×`}
    style={{fontFamily:'Arial',fontSize:SYMBOL_SIZE*0.21,fontWeight:'bold',fill:0xfff1d1,stroke:{color:0x000000,width:5}}} />
  {/each}
  {/if}
  {#if layer !== 'board' && timing.collect}
   <Text anchor={0.5} x={payoutCenter.x} y={payoutCenter.y-SYMBOL_SIZE*0.45*totalExit}
    scale={totalScale} alpha={totalAlpha} text={`${(totalAmount/100).toFixed(2)}×`}
    style={{fontFamily:'Arial',fontSize:SYMBOL_SIZE*0.25,fontWeight:'bold',fill:0xfff1d1,stroke:{color:0x000000,width:5}}} />
  {/if}
 </BoardContainer>
{/if}
