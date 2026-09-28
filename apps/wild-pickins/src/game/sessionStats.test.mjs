import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {emptySessionStats,addSessionRound} from './sessionStats.mjs';

test('session RTP separates base and bonus returns across changing stakes',()=>{
 let stats=emptySessionStats();
 stats=addSessionRound(stats,{betAmount:1,roundUnits:20});
 stats=addSessionRound(stats,{betAmount:2,roundUnits:5000,bonusUnits:4500,bonusEntry:true});
 assert.deepEqual(stats,{rounds:2,wageredMicros:3_000_000,paidMicros:100_200_000,basePaidMicros:10_200_000,bonusPaidMicros:90_000_000,positiveHits:2,profitableHits:1,bonusEntries:1,largestWinMicros:100_000_000});
 assert.deepEqual(emptySessionStats(),{rounds:0,wageredMicros:0,paidMicros:0,basePaidMicros:0,bonusPaidMicros:0,positiveHits:0,profitableHits:0,bonusEntries:0,largestWinMicros:0});
});

test('purchased rounds use purchase cost for session return',()=>{
 const stats=addSessionRound(emptySessionStats(),{betAmount:1,roundUnits:6000,bonusUnits:6000,bonusEntry:true,purchaseMultiplier:50});
 assert.equal(stats.wageredMicros,50_000_000);
 assert.equal(stats.paidMicros,60_000_000);
 assert.equal(stats.profitableHits,1);
});
