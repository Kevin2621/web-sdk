# Wild Pickins audio

Uses the template `createSound`, `EnableSound.svelte`, `Sound.svelte`, and MP3 sprite (`static/assets/audio/sounds.json` + `sounds.mp3`).

## Current mappings

| Event | Source | Recording |
| --- | --- | --- |
| Base music | music.mp3 | Relaxing Ambient Background Theme — Loop |
| Bonus music | bonus-music.mp3 | Cheerful Celebration Theme — Looping Version |
| Spin start at any speed | static/assets/audio/effects/symbolFastWhoosh.wav | Symbol Fast Whoosh [002370], once per accepted manual press or autoplay round, including ultra |
| Scatter anticipation after the second hit | static/assets/audio/effects/windupAnticipation006343.wav | Windup Anticipation Riser Whoosh [006343], one natural-speed one-shot |
| Scatter impacts 1–5, in actual landing order | scatter-level-1.mp3 through scatter-level-5.mp3 | Simple Wild West Achievement Notification Hit — Electric Guitar Strum Levels 1–5 [008881–008885] |
| Reel stops | static/assets/audio/effects/reelStopWood.wav | Wooden Block Solid Impact Click [005305], shortened to 253 ms playback |
| Play amount and speed changes | template sprite | Short mechanical click, mixed quietly and limited to one click per 110 ms |
| Normal win | normal-win.mp3 | Level 2 with Counter Rollups |
| Bonus buildup and award | bonus-entry.mp3 | Level 4 Orchestral Mix with Counter Rollups |
| Bonus entry accent | yeehaw.mp3 | YeeeHaw 01 [003019] |
| Each awarded free spin | spin-award.mp3 | Menu Chime 01 [003880] |
| Award sign opens/closes | bonus-open.mp3 / bonus-close.mp3 | Metal Trap Open [016431] / Close [016430] |
| Total spin payout below 10×, base and bonus | money-drop.mp3 | Money Bag Drop [002265] |
| Bonus spin payout finish, provisional | money-pour.mp3 | Money Bag Pour [002268] |
| Bonus wrap-up | bonus-summary.mp3 | Cheerful Celebration Summary Splash Screen Sting |

`build-audio.py` contains mappings and per-cue gains. Run `python3 scripts/build-audio.py` from the app directory with FFmpeg on PATH or `FFMPEG_BINARY` set. Original library recordings are copied unchanged into scripts/audio-sources. The builder always starts from legacy/template.mp3 and appends replacement regions. The sprite loads as MP3; the shipped spin-start whoosh, reel-stop click, and anticipation tick are standalone WAV overrides. The ticking loop also remains in the sprite as a fallback. Run `python3 scripts/build-reel-stop-wood.py` to regenerate the reel click from its original WAV. That pass applies a 2.5 kHz Butterworth low-pass filter and matches the original RMS, softening the top end without changing its duration or overall level.

The base music retains its 485-frame quiet-tail trim. Loop music gets an encoding continuation outside its playback interval. Validate new loop seams by listening on target browsers.

The control click is set to 0.38 cue gain, below the 0.49 spin-start cue. Rapid play amount and speed changes share a 110 ms click limit so repeated input remains responsive without a stack of clicks. Menu, information, autoplay setup, and dialog actions are silent; their open, selected, and pressed states provide visual feedback. Spin keeps its start cue. Payout, reel, and bonus cues keep their established mix.

Music stings duck the base/bonus loop through template fades, then restore it when their sprite duration ends. A new music sting replaces the previous sting. There is no additional anticipation riser or payout loop layered over the selected rollups. Cancellation/unmount clears pending cue timers.

The bonus transition pass puts the bonus bed at 30% cue gain, about 2 dB below the active entry rollup, so its sustained loop carries energy after the entry. The [006343] scatter windup uses a 45% cue gain, about 3 dB above the entry rollup in its active section. The entry rollup, ending riser, and closing summary use 40%, 35%, and 40%; the Yeehaw accent uses 50%. The ending riser fades out over 180 ms when the summary starts. The bonus bed, master slider, and effects slider remain adjustable. Browser output loudness and listening approval remain to be checked.

Bonus entry begins near the end of the final scatter hit, then follows the seed animation: Level 4 enters with an 80 ms fade, Yeehaw at 2.2 seconds, opening accent at 4.3 seconds, visible award increments with one chime each from 4.56 seconds at 140 ms intervals, and closing accent once the actual award is fully counted. Continue becomes available only after the count completes and the 1.49-second close sound finishes. Pressing Continue starts Wooden Zap [003828], Healing Spell [003701], and bonus music together, with the music at its normal level and attack. Additional authoritative grants count up individually; exhausted-budget or terminal outcomes do not promise extra spins.

The session-opening feature screen starts silently. Pressing Play starts the 6.034-second Cowboy Guitar Slide riser. The feature board lifts, tilts, and draws back during the guitar bend; its launch uses a 3.9-second offset intended to meet the whip sound. After the board exits right, the reel board jumps in from the left and settles, followed by the player controls sliding up with a small overshoot. Replay mode skips this interaction.

Book amounts use 100 units per 1× bet. Money Bag Drop plays once in both base and bonus play when the total spin payout is positive and below 1000 units (not per payline and not against the accumulated bonus total). Bonus spins of at least 10× use Money Bag Pour only when another bonus spin follows. The final bonus spin never adds that six-second pour over the ending music. The generated/fixture presentation shows all payline earnings simultaneously.

Run `pnpm --filter wild-pickins test:audio` and `pnpm --filter wild-pickins build`. Browser listening remains necessary for creative timing and mix approval.

Money Bag Drop plays to its natural end, including across the next spin or playback cancellation. A subsequent qualifying payout can overlap the previous drop without restarting it. Global mute and game teardown still apply.

## Bonus ending by total win

`bonusEnding.mjs` looks ahead to the authoritative `freeSpinEnd.amount`, then uses that total—not the last spin or the often-stale book win-level field—to choose one musical ending. Both event-book gameplay and generated/fixture playback use the same controller. A later reveal prevents premature endings, including retriggers. Cap and Full Harvest results follow their actual payout size.

| Bonus total | Musical arc | Summary count-up |
| --- | --- | --- |
| Below 10× | Bonus music settles, then the base bed returns; no win fanfare | Zero or brief small count |
| 10×–49.99× | Short breath, Level 1 Wild West payout tune | Medium count |
| 50×–99.99× | Short breath, Level 2 Wild West payout tune | Stronger count |
| 100× or more | Orchestral riser reaches its full 8.02-second ending, then the Cheerful Celebration summary sting | Big count, with distinct 500×, 1000×, 2500×, and 5000× titles |

The riser is Windup Orchestral Anticipation Riser [006344], separate from the Level 4 bonus-entry cue. The new 10× and 50× endings use the original Level 1 and Level 2 orchestral payout tunes as standalone MP3s. Each tier has one foreground musical statement; the bonus bed lowers before it begins. If the final spin pays under 10×, the 10×–99.99× summary tune waits about 2.8 seconds from the last result for Money Bag Drop to clear. For larger totals the riser grows from a subdued opening beneath that possible bag drop. The base bed returns after the shorter tunes finish, or under the final 700 ms of the large summary sting, and fades in over two seconds.

The grand path waits 8020 ms from the last result to the summary, matching the riser recording. Long payout presentations take precedence; if they outlast the riser, the summary starts after presentation. Animation skipping does not bypass the musical handoff. Cancellation and teardown clear controller waits and prevent delayed reveals or music changes. Resume-only endings infer a tier from their final total. Browser listening remains necessary to approve the musical joins.

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

## Reel landing replay

Normal and quick speed emit one reel landing per reel. The shared one-shot player normally ignores a second request for a cue while its previous voice is playing. Reel-stop requests explicitly stop and restart their own 253 ms clip, so adjacent autoplay rounds still get their impacts without stacking identical tails. Five subtle playback rates (0.96–1.04) cycle across landings to avoid an identical repeated click. Ultra speed plays one Symbol Fast Whoosh at the start of each animated round and omits the reel-stop impacts. A new round restarts the whoosh rather than stacking copies. Normal/quick paid autoplay rounds each get the same spin-start whoosh.

## Scatter landing sequence

Each reveal counts visible, unsuppressed scatters. Every actual scatter landing plays its progressive cue, including a lone scatter and both hits on a two-scatter miss. On an anticipated base spin, the second hit starts the [006343] windup, the quiet mechanical ticking loop, and a base-music fade timed to the final reel's remaining travel. The tick stops at the final reel impact. Anticipated reels with a scatter omit their ordinary reel click, leaving the scatter hit prominent; anticipated reels without a scatter keep the wooden stop click. The notification hits play only for actual scatter landings. The Mining Mayhem anticipation Spine remains visual only; its former `sfx_anticipation` loop is no longer requested. The final reel impact forces the base bed to silence. A two-scatter miss fades the windup out over 180 ms and returns the base music over 2.5 seconds. A bonus trigger holds the bed down; the entry waits until 100 ms before the final scatter cue ends, then fades the windup and starts the entry cue. The base bed is reset to its normal level while paused at the bonus-bed handoff. Cancellation restores the base bed and stops the windup and tick. Ultra has no anticipation and keeps its single start whoosh.

## Current mix

The decoded music recording is mastered louder than the former spin ticking loop, but a strict 20–30 dB peak difference sounded too quiet in gameplay. The current balance pass starts the master, music, and effects sliders at 75% each. The initial 100/100/50 listening balance was refined from a screenshot showing approximately 70% master, 70% music, and 80% effects. At the 75% starting sliders, cue gains are 14% base music, 30% bonus music, about 48.89% for Spin start, and about 14.22% for normal/quick reel stops. The effect gains already matched the screenshot setting within about 0.04 dB, so the original balance pass lowered the two music beds; the bonus bed was later raised for a stronger entry handoff. Other effects are scaled to 8/9 of their previous cue gains. Saved slider preferences take precedence. The reel stops were changed from the 419 ms mechanical thump to a shorter wooden click, filtered at 2.5 kHz, and lowered slightly after repeated-play feedback. The ticking loop is reserved for scatter anticipation after the second scatter, rather than ordinary spins. At normal and quick speed the whoosh plays once for each accepted manual press and each paid autoplay round; ultra uses the same single whoosh at the start of each round and no reel stops. Ordinary reel travel has no continuous sound; scatter anticipation uses a quiet ticking loop. Payout and bonus cues briefly lower the music a further 2.5 dB, then restore it. The game’s master/music/effects sliders still apply. These are starting listening values; recording gain percentages do not directly express perceived loudness. Audition several ordinary spins, including a no-win spin, before treating this mix as final.
