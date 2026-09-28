# Wild Pickins replay review

Implements https://stake-engine.com/docs/approval-guidelines/game-replay-requirements.

Launch the normal game URL with:

```
?replay=true&game=GAME_ID&version=MATH_VERSION&mode=base&event=EVENT_ID&rgs_url=https%3A%2F%2Frgs.stake-engine.com&amount=1000000&currency=USD&lang=en&social=false
```

Use the exact published mode and simulation ID. `event=0` is accepted. No session ID is needed. `amount` is an integer in millionths (1000000 displays as 1); omitted amount defaults to 1 display unit and omitted currency to USD. Bet cost is base amount × RGS costMultiplier; win is base amount × RGS payoutMultiplier. Event amounts use hundredths of the base amount. Currency and social mode initialize before playback. Existing locale loading and responsive scene layout remain in use; device hints do not override the viewport.

The launch is latched into replay mode. It fetches a public GET without credentials, automatically loads assets, and waits for Play. Play Again clones the saved event book, resets presentation state, and runs it again without another request. There is no game actor, resume action, betting hotkey, balance, bet selector, purchase menu, autoplay, or route back to wagering. The shared event recorder also refuses session writes in replay mode. A failed request or unsupported result displays Retry; requests time out after 30 seconds.

RGS `state` can be an event array or a book object containing `events`. Wild Pickins custom events use the existing custom presentation player (picks, sticky wilds, multipliers, bonus entry, retriggers and bonus endings). Template events use the existing production event handlers. Replay does not run the local math service or recalculate outcomes. Unknown event types and inconsistent final payouts are rejected.

## Checks

Run `pnpm --filter wild-pickins test:replay` and `pnpm --filter wild-pickins build`.

Before submitting, capture real published event IDs for **each mode and math version**:

| Scenario | Published event ID |
| --- | --- |
| Zero payout | To be supplied from published math |
| Ordinary win | To be supplied from published math |
| Big win | To be supplied from published math |
| 5000× cap | To be supplied from published math |
| Natural bonus trigger (base) | To be supplied from published math |
| Purchased bonus (bonus) | To be supplied from published math |
| Sticky wild collision / retrigger | To be supplied from published math |

For each ID, open the share URL without a session, verify animations and amounts against the published book, then Play Again twice. Inspect network traffic: only replay GET and asset loads are expected, with no wallet or bet/event requests. Check USD and social currencies, non-default amounts, narrow/mobile viewports, muted audio, malformed links, offline/404 responses, and unsupported event data. Local fixtures are transport regression coverage, not proof that any particular published ID is available.

Browser animation QA and real RGS round verification are still required before approval.
