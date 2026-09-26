import { eventEmitter } from './eventEmitter';
import { createBonusEnding } from './bonusEnding.mjs';

export const bonusEnding = createBonusEnding({
 emit: (phase: 'begin'|'summary'|'return'|'cancel'|'complete') =>
  eventEmitter.broadcast({type:'soundBonusEnding',phase}),
});
