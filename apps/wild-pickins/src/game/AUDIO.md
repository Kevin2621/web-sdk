# Wild Pickins audio

Uses the template `createSound`, `EnableSound.svelte`, `Sound.svelte`, and MP3 sprite (`static/assets/audio/sounds.json` + `sounds.mp3`).

## Current mappings

| Event | Source in scripts/audio-sources | Recording |
| --- | --- | --- |
| Base music | music.mp3 | Relaxing Ambient Background Theme — Loop |
| Bonus music | bonus-music.mp3 | Cheerful Celebration Theme — Looping Version |
| Spin loop, all modes | spin.mp3 | Mechanical Analog Ticking [002278] |
| Scatter impacts 1–5, in actual landing order | scatter-level-1.mp3 through scatter-level-5.mp3 | Simple Wild West Achievement Notification Hit — Electric Guitar Strum Levels 1–5 [008881–008885] |
| Reel stops | reel-stop.mp3 | UI Notification Thump 02 [004736] |
| Normal win | normal-win.mp3 | Level 2 with Counter Rollups |
| Bonus buildup and award | bonus-entry.mp3 | Level 4 Orchestral Mix with Counter Rollups |
| Bonus entry accent | yeehaw.mp3 | YeeeHaw 01 [003019] |
| Each awarded free spin | spin-award.mp3 | Menu Chime 01 [003880] |
| Award sign opens/closes | bonus-open.mp3 / bonus-close.mp3 | Metal Trap Open [016431] / Close [016430] |
| Total spin payout below 10×, base and bonus | money-drop.mp3 | Money Bag Drop [002265] |
| Bonus spin payout finish, provisional | money-pour.mp3 | Money Bag Pour [002268] |
| Bonus wrap-up | bonus-summary.mp3 | Cheerful Celebration Summary Splash Screen Sting |

`build-audio.py` contains mappings and per-cue gains. Run `python3 scripts/build-audio.py` from the app directory with FFmpeg on PATH or `FFMPEG_BINARY` set. Original library recordings are copied unchanged into scripts/audio-sources. The builder always starts from legacy/template.mp3 and appends replacement regions. Only MP3 is loaded at runtime.

The base music retains its 485-frame quiet-tail trim. Loop music gets an encoding continuation outside its playback interval. Validate new loop seams by listening on target browsers.

Music stings duck the base/bonus loop through template fades, then restore it when their sprite duration ends. A new music sting replaces the previous sting. There is no additional anticipation riser or payout loop layered over the selected rollups. Cancellation/unmount clears pending cue timers.

Bonus entry follows the existing seed animation: Level 4 at entry, Yeehaw at 2.2 seconds, opening accent at 4.3 seconds, visible award increments with one chime each from 4.56 seconds at 140 ms intervals, and closing accent once the actual award is fully counted. Continue becomes available only when the count completes. The bonus music begins at the scene handoff. Additional authoritative grants count up individually; exhausted-budget or terminal outcomes do not promise extra spins.

Book amounts use 100 units per 1× bet. Money Bag Drop plays once in both base and bonus play when the total spin payout is positive and below 1000 units (not per payline and not against the accumulated bonus total); larger wins retain existing behavior. The generated/fixture presentation shows all payline earnings simultaneously. Money Bag Pour is the provisional positive-spin payout finish. Base music now fades in under the bonus summary’s final tail; see the planned ending below.

Run `pnpm --filter wild-pickins test:audio` and `pnpm --filter wild-pickins build`. Browser listening remains necessary for creative timing and mix approval.

Money Bag Drop plays to its natural end, including across the next spin or playback cancellation. A subsequent qualifying payout can overlap the previous drop without restarting it. Global mute and game teardown still apply.

## Planned bonus ending

`bonusEnding.mjs` contains the lookahead, shared cancellable controller, and `bonusEndingTiming` tuning values. `bonusEndingController.ts` connects it to the template sound events. Both event-book gameplay and generated/fixture playback arm the plan before a reveal. Another reveal before `freeSpinEnd` prevents premature endings, including retriggers. Final cap/Full Harvest results are recognized but currently use the ordinary ending sounds.

The first pass deliberately starts audible anticipation only after the result is visible: on reel completion in template books, or after authoritative result explanations in generated books. The payout presentation consumes part of the six-second lead-in; the ending does not add another six-second wait afterward. The total reveal and summary cue share one handoff. The base music starts under the summary's last 1.1 seconds. Money Bag Drop tails and simultaneous payline earnings are preserved.

The added ending riser is Windup Orchestral Anticipation Riser [006344], copied to `scripts/audio-sources/bonus-ending-riser.mp3`. It is separate from the existing Level 4 bonus-entry cue.

Current tuning: lead-in 6000 ms, summary 8230 ms, bonus-bed lowering 800 ms, base return overlap/fade 1100 ms. Summary duration corresponds to its sprite. Long payout presentations take precedence over musical timing; if they outlast the riser, the summary starts when the presentation finishes. Animation skipping does not bypass the musical handoff; it only reduces the preceding presentation time. Cancellation and teardown clear controller waits and prevent delayed reveals or music changes. Resume-only endings receive a fallback lead-in. Timing currently follows playback requests, so browser-delayed audio startup still needs listening verification.

Music fades now interpolate from their tracked current gain instead of restarting every fade from an assumed full-volume value. During the ending, legacy music requests cannot interrupt the controller's handoff.

## Audio workbench (development only)

Open **Audio workbench** at the upper left after Continue in the local game/Storybook preview.

1. Choose a game event, then search and choose its recording from all 193 MP3 files in audio-assets, current game clips, or other template clips. Folder paths distinguish duplicate filenames.
2. Set volume and optional start/end trim in milliseconds. **Apply & preview cue** applies the draft and auditions the selected event with the game’s master/music/effects controls.
3. Adjust the bonus ending’s lead-in, duck duration, base return overlap and fade-in. **Apply & rehearse ending** uses the real ending controller without needing a full bonus or math-server request; the phase label shows its progress.
4. Once you have played a bonus in a generated or fixture preview, **Apply & replay last bonus** reuses the exact original input and validation path, starting at its bonus entry. It makes no new round request and does not place a wager. Its recording is kept in memory until the page reloads.
5. **Save applied in browser** preserves the applied mix after refresh. **Export draft JSON** downloads an independently validated draft; **Import JSON** loads one for review and Apply. **Reset** removes the browser override and restores shipped settings.

Changes apply to development gameplay only. They are not automatically written into source files or included in production. Export the JSON and use it as the specification for a permanent mix. The workbench catalog includes every MP3 in audio-assets (WAV duplicates are omitted). Run `python3 scripts/build-audio-library.py` with FFmpeg available to refresh the catalog after adding files. The development-only Vite/Storybook middleware serves only catalogued files directly from audio-assets; it does not copy the library into production assets.

Controls lock during real playback and ending rehearsal. Explicit Stop cancels auditions/replays; starting gameplay stops an active audition. Closing the panel stops an audition but does not cancel ordinary gameplay. Summary timing follows the selected trimmed summary clip. Previewing a loop continues until Stop. Selecting Reel landing edits reel 1; **Use for all five reels** copies the draft to the other four.

Implementation: audioWorkbench.mjs validates/version-checks settings and creates a copy of the immutable original sprite mapping. audioWorkbench.svelte.ts owns the development overrides. EnableSound reloads the template audio once after Apply, and uses the same template players. Standalone assignments receive their own Howler clips, routed by voice ID for playback, fades, volume, and cleanup. Only assigned library recordings load; the default sprite and its corrected music loop remain unchanged.

The generated `src/game/audioSprite.json` catalog mirrors the public sprite manifest for development-tool imports. `build-audio.py` updates both together; Storybook cannot import the public static JSON as a source module.

## Scatter landing sequence

Each reveal counts visible, unsuppressed scatters. Bonus-triggering base spins play the five progressive hits in order; base spins with zero to two scatters use only reel thumps. Ultra speed uses one reel thump for its simultaneous landing. The scatter riser plays only for a bonus-triggering base spin. Cancellation resets the sequence.

## Current mix

The decoded music recording is mastered louder than the spin recording, but a strict 20–30 dB peak difference sounded too quiet in gameplay. The current listening revision uses 11% base music and 14% bonus music, with spin at 100% and reel stops at 45%. Payout and bonus cues briefly lower the music a further 2.5 dB, then restore it. The game’s master/music/effects sliders still apply. These are listening values; recording gain percentages do not directly express perceived loudness.
