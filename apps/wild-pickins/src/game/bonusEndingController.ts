import { eventEmitter } from './eventEmitter';
import { createBonusEnding } from './bonusEnding.mjs';

export const bonusEnding = createBonusEnding({
 emit: (phase: 'begin'|'summary'|'return'|'cancel'|'complete', profile: {tier:'quiet'|'modest'|'strong'|'grand'}) =>
  eventEmitter.broadcast({type:'soundBonusEnding',phase,tier:profile.tier}),
});
