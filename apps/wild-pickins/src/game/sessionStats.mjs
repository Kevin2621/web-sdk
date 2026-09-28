export function emptySessionStats() {
 return {rounds:0,wageredMicros:0,paidMicros:0,basePaidMicros:0,bonusPaidMicros:0,positiveHits:0,profitableHits:0,bonusEntries:0,largestWinMicros:0};
}

export function addSessionRound(stats, {betAmount,roundUnits,bonusUnits=0,bonusEntry=false,purchaseMultiplier=1}) {
 if(!Number.isFinite(betAmount)||betAmount<=0||!Number.isSafeInteger(roundUnits)||roundUnits<0||!Number.isSafeInteger(bonusUnits)||bonusUnits<0||bonusUnits>roundUnits)throw Error('Invalid session round');
 const betMicros=Math.round(betAmount*1_000_000);
 const wageredMicros=Math.round(betMicros*purchaseMultiplier);
 const paidMicros=Math.round(betMicros*roundUnits/100);
 const bonusPaidMicros=Math.round(betMicros*bonusUnits/100);
 return {
  rounds:stats.rounds+1,
  wageredMicros:stats.wageredMicros+wageredMicros,
  paidMicros:stats.paidMicros+paidMicros,
  basePaidMicros:stats.basePaidMicros+paidMicros-bonusPaidMicros,
  bonusPaidMicros:stats.bonusPaidMicros+bonusPaidMicros,
  positiveHits:stats.positiveHits+Number(paidMicros>0),
  profitableHits:stats.profitableHits+Number(paidMicros>wageredMicros),
  bonusEntries:stats.bonusEntries+Number(bonusEntry),
  largestWinMicros:Math.max(stats.largestWinMicros,paidMicros),
 };
}
