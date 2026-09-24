// Explanations only. These cues never calculate or commit awards.
export function bonusCues(result, budget, cap) {
 const cue=(text,positions=[],sound=null)=>({text,positions,sound});
 const cash=result.nominalScatterWin ? [cue(
  `${result.scatterPositions.length} SCATTERS · ${result.scatterWin/100}× BET${result.scatterWin<result.nominalScatterWin?` paid of ${result.nominalScatterWin/100}× · Limited by round cap`:''}`,
  result.scatterPositions,'sfx_scatter_win_v2')] : [];
 if(result.endReason==='fullHarvest') return [
  cue('FULL HARVEST · All 15 cells are Wild'),
  cue(`Round topped up to ${cap/100}× · Bonus ends here`),
 ];
 if(result.endReason==='roundCap') return [
  ...cash,
  cue(`WIN CAP REACHED · ${result.roundTotal/100}× of ${cap/100}×`),
  cue('Round complete · Remaining free spins end; no extra spins granted'),
 ];
 const nominal=result.nominalRetriggerAward+result.nominalCollisionAward;
 if(!nominal&&!result.scatterWin) return [];
 const clipped=result.grantedExtraSpins<nominal;
 const cues=[...cash];
 if(result.nominalRetriggerAward) cues.push(cue(
  `${result.scatterPositions.length} SCATTERS · ${clipped?'Nominal award: ':''}+${result.nominalRetriggerAward} FREE SPINS`,
  result.scatterPositions,'sfx_scatter_win_v2'));
 if(result.nominalCollisionAward) cues.push(cue(
  `WILD COLLISION${result.nominalCollisionAward>1?'S':''} · ${clipped?'Nominal award: ':''}+${result.nominalCollisionAward} FREE SPIN${result.nominalCollisionAward>1?'S':''}`,
  result.collisionPositions,'sfx_multiplier_landing'));
 if(nominal) cues.push(cue(clipped
  ? `${budget}-SPIN BUDGET · ${result.grantedExtraSpins} of ${nominal} extra spins granted · Play remaining spins`
  : `+${result.grantedExtraSpins} TOTAL · ${result.remaining} FREE SPINS REMAINING${result.totalGranted===budget?' · SPIN BUDGET REACHED':''}`));
 return cues;
}
