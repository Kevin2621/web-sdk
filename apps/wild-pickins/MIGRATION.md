# Wild Pickins template migration

## Baseline

This app starts from `apps/lines` in fresh SDK commit `1843d60`.
The authoritative existing game is in the sibling repository
`../../../web-sdk`, commit `170d8c8` (paths below are relative to this app).
Its selected story is **Standard Bonus Buys · 50× / 200× / 500×**.

Checkpoint 1 copied the sample lines game with only package identity, ports and
the visible baseline label changed. Checkpoint 2 now uses the selected Wild
Pickins configuration and adds real event books to the normal template player.
Checkpoint 3 transfers the original scene, symbols, Wild multiplier and persistent
lock layers into the normal player. This is not an Engine release candidate.
Shared changes are limited to optional reel hooks in `utils-slots`, two Pixi
filter exports and the source canvas renderer used by the gameplay seed overlay.
The original lines app and preserved game repository are unchanged.

## Run

From the SDK root, with Node 22.16+ and pnpm 10.5:

```sh
pnpm install --frozen-lockfile
pnpm run storybook --filter=wild-pickins
pnpm run build --filter=wild-pickins
pnpm --filter wild-pickins test:books
pnpm --filter wild-pickins test:presentation
```

Storybook uses port 6011; the app dev server uses 3011. Stop the old app's
server before using the same ports. Storybook previews components, individual
events, and full books through the template event player. The normal dev route
requires Engine session parameters; no local wallet implementation is planned.

For a static Storybook build, first run the root build above to build workspace
dependencies, then:

```sh
NODE_OPTIONS=--max-old-space-size=8192 PUBLIC_CHROMATIC=true \
  pnpm --filter wild-pickins exec storybook build --disable-telemetry
```

## Initial verification (2026-10-02)

- Installed with the original dependency versions; the lockfile adds only the
  new app importer copied from lines. Frozen-lockfile installation succeeded.
- Compared every tracked lines-app file against the copy: only package metadata
  and the visible baseline label changed, plus this new document.
- Production compilation and static adaptation completed and emitted `build/`.
- Static Storybook compilation completed and emitted `storybook-static/`, with
  23 indexed stories spanning components, base/bonus events and base/bonus books.
- Storybook exceeded Node's default heap limit; the 8 GiB setting above succeeded.
- Both build processes remained alive after reporting completed output and were
  interrupted. Production behaved the same outside the sandbox. Clean process
  exit remains unresolved; these are artifact-generation checks, not clean-exit
  or browser playback acceptance.
- Inherited warnings include static asset URLs unresolved at build time,
  Svelte/Storybook metadata warnings and large Storybook chunks. Browser visual
  acceptance and runtime asset loading have not yet been checked.
- No changes to the original game repository, fresh lines app or shared packages.

## Agreed scope

- Preserve all current player-facing art, UI, animation, audio, preferences,
  sticky Wild interactions, bonus progression, purchase tiers and replay.
- Use the fresh template actor and normal event-handler system.
- Remove the audio workbench and session statistics from the migration.
  Extract shipped audio configuration from workbench modules before removal.
- Keep Golden Picks disabled, matching the selected corrected profile.
- Preserve selected book outcomes, IDs, payouts and weights; do not rebalance.
- User performs visual acceptance. Technical checks cover event compatibility,
  asset completeness, book/lookup consistency, build and Engine packaging.
- Wallet acceptance happens on Engine. Completion requires the uploaded game
  to work, including custom-state recovery and replay.

## Checkpoint 2: selected books and event contract

- `selectedMath.json` is an exact, hash-checked copy of the selected configuration.
  `config.ts` now supplies its 25 paylines, paytable and visual padding strips.
- `selectedModes.json` records the actual four costs, entry-spin counts and
  positive-weight lookup maxima. The low buy's available maximum is 2,922.3×;
  the other modes reach the 5,000× round cap. Mode metadata is configured locally.
- Seven small source-verified books live under `src/stories/data/selected`, with
  source IDs, lookup weights and SHA-256 provenance in `manifest.json`.
  These coverage examples are not a random sampler or a production math package.
- Storybook: **WILD_PICKINS / Selected books (template presentation)** includes
  base loss/win, natural bonus with collisions, cap, and all three buy tiers.
  Click Action to run a book; template bonus screens may require Continue.
- Preview mode disables the actor, wagering hotkeys and wallet controls. The
  stories call the same `playBet` / event handlers as the normal game.
- Math symbols C01–C08 remain unchanged in event books. `getSymbolInfo` maps
  them to artwork aliases at render time; checkpoint 3 renders those aliases
  with the source art. Payouts remain integer hundredths
  in the books and become decimal multipliers only at the preview Bet boundary.
- `wildPickinsSpinResult` is handled by the normal event map. Authoritative
  board, sticky cells, multiplier values, counters and totals live in `stateRound`.
- Resume snapshots can reconstruct the custom state without replaying prior
  effects. Full Engine progress-checkpoint/settlement recovery is not yet accepted.
- No audio workbench, session statistics or local round service was imported.

Verification: five Node tests cover source fingerprints, payout units, mode
matching, malformed events, collision state, and reconstruction at every event
boundary of all seven books. Production and static Storybook compilation emitted
artifacts (30 indexed stories total). The inherited post-build process-lifetime
issue remains; commands were stopped after output completed. Browser playback
was not checked because the available UI tool reported no browser.

## Checkpoint 3: board, symbols and reel presentation

- Copied the original W Spine files and registered `wpWildSpine`. Both moving
  and fixed W symbols now use it, including its 1×/2×/3× attachment and lock
  track. `pixi-svelte` now exports its existing Pixi `BlurFilter` and
  `ColorMatrixFilter`, restoring the source win brightness and reel blur.
- `stateRound.sticky` now masks reel cells while fixed roots and foreground
  skeletons render on opposite sides of the reels. A fresh lock animates once;
  restoring a book prefix starts existing locks settled. The bonus end clears
  the fixed layer through the normal event handler.
- The farm background and Spine play-board skin/slot now carry the original
  frame, backing and normal board together. Original scene fitting, rectangular
  reel spacing and symbol bounds preserve the art's scale and proportions.
- C01–C08 map to source symbol art only while rendering. Scatter bags use the
  source closed, landing and shake animations. Production letter/symbol art
  includes the original win lift, shine, dimming and scrolling blur.
- Optional `utils-slots` hooks restore source lift and impact timing. Wild
  landing instances render outside the reel mask; a new landing completes before
  the fixed lock takes over. Padding and retained sticky cells suppress landing
  effects on copied presentation data, leaving source books intact.
- Original normal/quick/fast timing values are present. The template controls
  currently expose normal/fast; quick selection comes with the later controls
  migration. Shipped audio routing also remains for the later audio transfer.
- Six book tests pass. All 36 transferred art/Spine files match the preserved
  source; atlas texture pages, animations and the play-board skin/slot were checked.
  Production output was generated for Wild Pickins and the unchanged lines app.
  Static Storybook output was generated with all seven selected stories.
  Browser animation and final position/scale still need visual acceptance. The
  inherited build-process exit issue remains.
- User visual review confirmed that sticky Wilds persist and the transferred
  background, scene, symbols, scatter bags and reel lift/timing look good.
  Win/bonus presentation continues in checkpoint 4; controls and audio follow.

## Checkpoint 4: win and bonus presentation

- Selected `winInfo` events now drive source payline strokes, winner highlighting,
  dimming, symbol lift/shine and collected line totals. `setWin` avoids presenting
  the same line total again with the template popup. The original template stories
  still have their normal popup event handling.
- Selected bonus entry uses the source seed-bag celebration, award count-up,
  Continue interaction and falling-seed transition. The board switches to bonus
  under seed coverage. The source `PreviewCanvas` is a gameplay overlay renderer,
  sharing loaded assets with the template App; it does not start a second player.
- The source wooden free-spin plaque works at all layout sizes. Displayed extra
  spins count upward from the authoritative granted award; `stateRound` never
  changes its awarded values to drive that animation. Collision/scatter cue arrows
  and cap explanations use source cue rules. Storybook's footer displays the cue
  text and running bonus subtotal so these transitions can be inspected.
- Bonus ending lookahead uses the actual last reveal/end events. Source payout-tier
  timing, summary handoff and Wild unlocking are handled by the normal event map.
  Selected resume snapshots also choose this presentation when their suffix no
  longer includes a spin-result event. Full Engine recovery still needs acceptance.
- Normal book playback owns an abort signal. Leaving a game/story or replacing its
  book cancels seed/line/ending effects and pending presentation delays. There is
  no imported fixture playback, local wallet service, audio workbench or statistics.
- Six book tests and 24 presentation tests pass. Checks include actual selected
  book endings, capped grants, resume classification, Continue timing/coverage,
  finite seed trajectories and cancelled waits. Six bonus PNGs match the source;
  their required bag animation names were verified.
- Source custom bonus audio/music routing is pending. Existing template sounds
  provide only the available entry/count/award cues. The retained bonus subtotal
  will feed the source controls during the next transfer. Win/bonus screens still
  require user visual review.

Production and static Storybook compilation emitted updated output for checkpoint 4. The inherited
post-build process exit issue remains; browser playback is accepted through the
user's visual review, not inferred from compilation or these controller tests.

To reproduce the selected examples from the preserved workspace sources:

```sh
PYTHONDONTWRITEBYTECODE=1 ../.venv/bin/python apps/wild-pickins/scripts/import-selected-books.py
```

The importer reads source SQLite databases in read-only mode, validates source
hashes and each book with the existing Python rule validator, and recreates only
two selected medium/high source rounds. It does not simulate a new pool or modify
outcomes/weights. SQLite is not a browser or Storybook dependency.

## Audio transfer checkpoint

The user accepted all seven selected book presentations before this checkpoint.
The normal template sound players now load the preserved production sprite and
standalone cue recordings. No audio workbench, saved editor settings, or session
statistics are imported. The book fixtures and selected math remain unchanged.

- `static/assets/audio/sounds.json` owns checked-in per-cue gains.
- `src/game/audioConfig.mjs` owns standalone clip routes/regions, music ducking,
  and reel pitch variation; `bonusEnding.mjs` retains musical ending timing.
- Original scatter anticipation follows visible scatter/reel impacts. Base-game
  anticipation is derived for presentation from the reveal board, without editing
  stored book events. Ultra disables anticipation, as in the source game.
- Seed entry, sign open/close, Continue accents, payout drop/pour, collision cues,
  wild landings and bonus-ending tiers run through normal game sound events.
- Shared sound changes are restricted to optional recording routing, gesture
  activation, generation cleanup, completed effect cleanup, and retrying blocked
  music. Existing template callers retain the same API and default sprite routing.
- Cancellation clears delayed anticipation work and queued cues.

Run `pnpm --filter wild-pickins test:audio` for the 19 audio checks, including the
actual Sound component event handlers with mocked audio/timer ports. Together
with the 6 book and 24 presentation checks, there are 49 automated checks.
Production and static Storybook output compile; their inherited post-build exit
issue still requires stopping the process after output is written. Browser audio
and final mix quality require user listening review and are not proven by builds.

Review in `WILD_PICKINS / Selected books (template presentation)`: Base line win,
Natural bonus with collision awards, and the three bonus buys. Listen for the
landing hits, anticipation, Continue/music handoff, payout effects, and ending
music return. The source mix is the starting point and remains adjustable.

## Controls and preferences checkpoint

The user accepted the audio checkpoint. Original control-bar, bonus-dialog and
settings visual components plus popup dismissal/drag helpers are added to the
shared HTML UI package without replacing existing template components.

- Normal play uses the template `bet` event and lowercase `base` Engine mode.
- Autoplay uses the template `autoBet` actor, its counter and limit state. Stop
  queues completion of the current round; stop-on-bonus clears the counter at
  the actual bonus entry. No separate local autoplay/book loop is transferred.
- Bonus selection exposes the authoritative 50×/10-spin, 200×/15-spin and
  500×/20-spin modes in both production controls and component previews.
  Available maxima come from `selectedModes`, including 2922.3× for Low.
- Master/music/effects volume, mute restoration, independent reduced UI motion
  and screen-shake preferences retain their original local persistence.
- Normal/Quick/Ultra feed the existing migrated reel and win-presentation speed.
- Information/paytable and inactive future feature cards retain the source
  presentation. Golden Picks stay disabled and a full board keeps paying as in
  the selected math. Source artwork paths now honor the application's base path.
- The app displays its own controls and information without also mounting the
  template buy/settings dialogs. Template error/autoplay messages remain in use;
  the existing template replay UI stays separate for the later replay checkpoint.
- Space uses the template hotkey component with loading/modal/busy restrictions.

`WILD_PICKINS / Controls and preferences` contains two new component stories:
`Controls, settings and bonus selection` and `Controls while a round is playing`.
The first lets Spin and each bonus selection replay the existing selected book
through `playBet`. It never adjusts a balance or generates outcomes. Autoplay
setup can be inspected but automatic local play is disabled in these previews.
The earlier seven selected-book stories remain available in their original group.

There are 55 passing checks: 6 books, 24 presentation, 19 audio and 6 controls.
The control checks exercise actual action bodies, Engine mode/event dispatch,
preview isolation and preference persistence with mocked state/event ports.
Production and Storybook builds emit output with the inherited warnings and
post-build exit issue. Visual acceptance and live wallet/autoplay acceptance on
Engine remain separate from these checks.

## Engine packaging, recovery and replay checkpoint

The user accepted the controls/preferences checkpoint. All four selected math
modes are now packaged offline using `scripts/export-engine-math.py`; see
[`engine-math/README.md`](engine-math/README.md) for filenames, reproduction and
verification commands. Generated books/weights are excluded from Git and the
frontend build. The export preserves source IDs/events/payouts and lookup bytes,
including zero-weight rows. It writes the index only after all modes verify.
The source databases and preserved game remain unchanged.

Active-round resume now validates the checkpoint and reconstructs custom state
from the played prefix before running the exact remaining suffix. A completed
round restores its resolved board, counters, total and bonus subtotal instead of
only its last raw reveal. Existing locks restore settled, without arrival effects.
The template checkpoint convention remains "first event to play".

Engine replay accepts both event arrays and book envelopes. It validates events,
mode, cost and payout consistency, keeps book amounts in hundredths, and converts
the final payout once at the replay boundary. Replay amount query parameters use
the SDK's micro-unit conversion; missing amount defaults to a 1-unit display bet.
The shared Authenticate component has an optional replay normalization callback;
other apps keep their existing response handling. Replay errors use the template
error modal. No local wallet or replacement player is added.

Storybook **WILD_PICKINS / Recovery and replay** adds:

- **Resume after a Wild collision** — locks/counters restore before later events.
- **Resume before the bonus ending** — summary starts from the earned subtotal.
- **Replay an Engine book envelope** — a complete High buy uses the same player.

Click **Action** in each story. Existing Continue interactions still apply.
Technical recovery checks cover every boundary of all seven selected books;
they establish state/suffix equivalence, not server checkpoint acceptance.
There are 59 passing Node checks plus 5 exporter unit checks. Production and
static Storybook builds emit output; the inherited process exit and metadata/
chunk/env warnings remain. Static asset declarations now resolve to existing
base-path-aware files instead of missing source folders. The real Stake Engine
loader is retained and the sample "Add Your Loader" overlay is removed.

Engine upload, real endpoint responses, wallet/settlement, autoplay, browser
refresh and live replay acceptance remain to be exercised on Engine. Local
package verification alone does not complete the migration.

Background verification completed successfully; both processes exited with code
0. Export finalization logs are in `/private/tmp/wp-engine-export-final.log` and
SDK verification logs are in `/private/tmp/wp-sdk-package-verification.log`.
All four modes passed source-payload, file-hash, SDK format and ordered-payout
checks. `engine-math/package-report.json` and `engine-math/sdk-verification.json`
agree on all book/event counts and the index hash. The package contains 2,056,124
books and approximately 3.6 GiB of generated math files. Source lookups retain
their exact weights and approximately 96.7% RTP in each mode.
The initial export found the Low fixture-envelope mismatch; the exporter now
adds its database ID/payout without modifying its events. Finalization rechecked
the staged payloads against their source files after that correction. The
preserved Web SDK and Math SDK repositories are still clean. User visual review
of recovery/replay and live Engine acceptance remain outstanding.

## Next checkpoints

### Upload file audit (2026-10-03)

Checked the public source for the current Engine documentation because the
Studio documentation URL only returned its client-rendered loading shell.
The [official math file FAQ](https://github.com/engineio/docs/blob/main/src/routes/faq/math/what-files-are-required/+page.svx)
requires full outcome records with `id`, `events`, and `payoutMultiplier` in
Zstandard-compressed JSON Lines. The CSV contains outcome ID, integer weight,
and payout in hundredths; it does not replace the outcome's event array.
The four existing files were inspected directly and contain those fields.
Additional SDK fields such as `criteria`, `baseGameWins`, and `freeGameWins`
also appear in the official Math SDK example. No format change or simulation
rerun is needed to remove events.

Current upload folders, relative to the Web SDK root:

- Math: `apps/wild-pickins/engine-math/publish_files/` — exactly `index.json`,
  four `books_<mode>.jsonl.zst` files and four `lookUpTable_<mode>_0.csv` files.
  Reports, README, source databases and Python scripts are outside the upload.
- Frontend: `apps/wild-pickins/build/` — `index.html`, `_app/`, `assets/`,
  `favicon.svg`, `loader.gif`, and `stake-engine-loader.gif`, preserving paths.
  Do not upload `src/`, `node_modules/`, `.svelte-kit/`, or `storybook-static/`.

The [official Web SDK build/launch instructions](https://github.com/engineio/web-sdk#build-a-game)
describe combining the prerendered HTML and client output. Our shared Svelte
configuration already uses `adapter-static`, which assembles these into `build/`.
Its generated bootstrap derives the base directory from the launch URL; the
migrated asset definitions use that base, supporting a game/version CDN path.

Build the frontend from the Web SDK root using Node 22.16+ and pnpm 10.5:

```sh
pnpm install --frozen-lockfile
pnpm run build --filter=wild-pickins
```

The current math package already exists and passed local verification. To export
the same selected outcomes/weights into a new release directory without overwriting
it (this is an offline packaging pass, not new simulations):

```sh
PYTHONDONTWRITEBYTECODE=1 ../.venv/bin/python apps/wild-pickins/scripts/export-engine-math.py --output ../wild-pickins-engine-upload/math
PYTHONDONTWRITEBYTECODE=1 ../.venv/bin/python apps/wild-pickins/scripts/verify-engine-math.py --package ../wild-pickins-engine-upload/math
```

That creates `../wild-pickins-engine-upload/math/publish_files/`; subsequent
exports need another fresh directory. The usual Math SDK sample `run.py` flow
simulates/optimizes new math and is not the preservation exporter for this selection.

Frontend pre-upload finding, now fixed: `src/app.html` linked an Adobe Typekit
stylesheet and Pixi initialization separately requested its kit. The
[official frontend requirements](https://github.com/engineio/docs/blob/main/src/routes/docs/approval/frontend-requirements/+page.svx)
require images/fonts to load from the Engine CDN. The HTML now uses a system
font stack, and Wild Pickins passes `preloadTemplateFont={false}` to its Pixi App.
The optional App flag preserves other templates' default behavior. The main
control bar already has an explicit system font stack. HTML text that formerly
used Proxima Nova uses the system font; this needs normal visual review.
No Adobe font was downloaded or embedded, and no math files were changed.
The production frontend was rebuilt into `build/`; its HTML has no remote
stylesheet and its compiled Game disables the template font preload. All 24
presentation checks pass. The inherited build process remained alive after
writing the output and was stopped afterward. Neither package was uploaded.

### Hosted canvas startup fix

The first hosted launch reported `stateApp.pixiApplication is undefined` while
attaching the canvas. App's parent onMount reset ran after child renderer
initialization had started. Skipping the Adobe font preload exposed that existing
ordering dependency. The parent now resets synchronously before child setup;
InitialiseApplication retains its own renderer reference through async init and
publishes it after successful initialization. Unmounting during font/renderer
startup prevents attaching a stale canvas and disposes an initialized renderer.
Cleanup uses the owned renderer even if the parent already reset shared state.

Four regression checks exercise the actual component script bodies with delayed
font/renderer ports and child-before-parent mount ordering:

```sh
node --experimental-strip-types --test packages/pixi-svelte/src/lib/components/InitialiseApplication.test.mjs
```

The checks pass. Rebuild and publish the corrected frontend `build/` folder;
this fix requires no math re-upload. Live hosted acceptance still needs a fresh
Engine launch. The technical checks establish lifecycle correctness, not browser
rendering or full hosted gameplay acceptance.

### Running locally against Engine RGS

The template dev command serves the frontend. It does not generate simulations,
export math files or implement a local RGS. The normal game reads `sessionID`
and `rgs_url` from the URL for template authentication and round requests.
The [official dev/session workflow](https://github.com/engineio/web-sdk#launch-a-game)
uses an Engine-launched session's query string on the local dev URL.

From the repository root:

```sh
pnpm run dev --filter=wild-pickins
```

Or, with the existing pnpm workspace dependencies installed, from the app:

```sh
cd apps/wild-pickins
npm run dev
```

The app uses port 3011. An unfiltered root `npm run dev` launches all workspace
dev tasks, so target this app. Append the entire query string from the Engine
session launch URL to `http://localhost:3011/`. The math version selected for
that Engine session supplies outcomes; the local dev command does not alter it.
Without session parameters, the template authentication error is expected.
Storybook remains the event/visual preview tool without a wallet connection.
The npm command was smoke-checked on temporary port 3012 and served HTTP 200;
that temporary server was stopped. Live authenticated RGS play was not tested.

1. Establish and verify this unmodified template playback baseline.
2. Add the selected configuration, typed custom events and representative books.
3. Transfer the board, sticky Wild state and required reel timing extensions.
4. Transfer presentation, shipped audio, controls and preferences.
5. Export all four Engine math modes and verify recovery/replay.
6. Complete user visual review and Engine staging acceptance.

## Transfer dependencies

- UI: PlayerControlsSurface, SlotControlBar, BonusPurchaseDialog and popup helpers
  currently live in the old `components-ui-html` package.
- Reel motion: impact landing, landing batches, start lift and travel callbacks
  currently extend `utils-slots`.
- Audio: recording routing, gesture activation, lifecycle cleanup and playback
  fixes currently extend `utils-sound`.
- Bonus presentation uses the old `pixi-svelte` PreviewCanvas in actual gameplay.
- Review language, disabled-button and replay event-recording changes explicitly.
  Do not copy old shared packages wholesale.
- Move fixture-owned sticky/multiplier/counter state into normal game state.
- Preserve inactive feature cards without enabling their unimplemented mechanics.

## Math sources

All paths below are under the sibling `wild-pickins/reports/math` workspace.

| Mode | Cost | Source |
| --- | ---: | --- |
| base | 1 | candidate-corrected-1m-1-playtest |
| bonus | 50 | standard-buy-trigger-tail200k-cost50 |
| standard_bonus_buy_medium | 200 | standard-buy-medium-optimizer-quartiles-500k-trial1-exact-target |
| standard_bonus_buy_high | 500 | standard-buy-high-optimizer-quartiles-500k-trial2-exact-target |

Medium/high books are sourced through `math-sdk/games/wild_pickins/template_bonus_replay.py`;
medium also includes accepted regular-source books. Export those exact sources.
Some old `stories/data/current` fixtures identify the earlier `candidate-1m-2`
profile: do not assume that directory contains the selected game's books.
The 50× source manifest records missing cap coverage; reconcile available maximum
and published metadata before release without silently changing the selected math.
