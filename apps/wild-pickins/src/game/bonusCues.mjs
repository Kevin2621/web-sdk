// Explanations only. These cues never calculate or commit awards.
export function bonusCues(result, budget, cap) {
 const cue=(text,positions=[],sound=null)=>({text,positions,sound});
 if(result.endReason==='fullHarvest') return [
  cue('FULL HARVEST · All 15 cells are Wild'),
  cue(`Round topped up to ${cap/100}× · Bonus ends here`),
 ];
 if(result.endReason==='roundCap') return [
  cue(`WIN CAP REACHED · ${result.roundTotal/100}× of ${cap/100}×`),
  cue('Round complete · Remaining free spins end; no extra spins granted'),
 ];
 const nominal=result.nominalRetriggerAward+result.nominalCollisionAward;
 if(!nominal) return [];
 const clipped=result.grantedExtraSpins<nominal;
 const cues=[];
 if(result.nominalRetriggerAward) cues.push(cue(
  `${result.scatterPositions.length} SCATTERS · ${clipped?'Nominal award: ':''}+${result.nominalRetriggerAward} FREE SPINS`,
  result.scatterPositions,'sfx_scatter_win_v2'));
 if(result.nominalCollisionAward) cues.push(cue(
  `WILD COLLISION · ${clipped?'Nominal award: ':''}+${result.nominalCollisionAward} FREE SPIN`,
  result.collisionPositions,'sfx_multiplier_landing'));
 cues.push(cue(clipped
  ? `${budget}-SPIN BUDGET · ${result.grantedExtraSpins} of ${nominal} extra spins granted · Play remaining spins`
  : `+${result.grantedExtraSpins} TOTAL · ${result.remaining} FREE SPINS REMAINING${result.totalGranted===budget?' · SPIN BUDGET REACHED':''}`));
 return cues;
}
