<script lang="ts" module>
	import { sound, type MusicName, type SoundEffectName, type SoundName } from '../game/sound';

	export type EmitterEventSound =
		| { type: 'soundMusic'; name: MusicName }
		| { type: 'soundPressSpin' }
		| { type: 'soundPressPlayAmount' }
		| { type: 'soundPressSpeed' }
		| { type: 'soundScatterSequenceStart'; total: number; baseGame: boolean; anticipation: boolean }
		| { type: 'soundScatterLand' }
		| { type: 'soundScatterFinalTravel'; duration: number }
		| { type: 'soundScatterFinalImpact' }
		| { type: 'soundBonusEntryReady' }
		| { type: 'soundBonusContinue' }
		| { type: 'soundScatterSequenceCancel' }
		| {
				type: 'soundBonusEnding';
				phase: 'begin' | 'summary' | 'return' | 'cancel' | 'complete';
				tier: 'quiet' | 'modest' | 'strong' | 'grand';
		  }
		| { type: 'soundCue'; name: SoundEffectName }
		| { type: 'soundOnce'; name: SoundEffectName; forcePlay?: boolean }
		| { type: 'soundLoop'; name: SoundEffectName }
		| { type: 'soundStop'; name: SoundName }
		| { type: 'soundFade'; name: SoundName; from: number; to: number; duration: number }
		| { type: 'soundScatterCounterIncrease' }
		| { type: 'soundScatterCounterClear' }
		| { type: 'soundInteractionsStop' };
</script>

<script lang="ts">
	import { onMount, onDestroy, untrack } from 'svelte';
	import type { LoadedAudio } from 'pixi-svelte';

	import { waitForTimeout } from 'utils-shared/wait';
	import { SECOND } from 'constants-shared/time';
	import { stateBet } from 'state-shared';

	import { getContext } from '../game/context';
	import { audioState } from '../game/audioState.svelte';
	import { audioMix } from '../game/audioConfig.mjs';
	import { bonusEnding } from '../game/statePresentation.svelte';
	import { createScatterSound } from '../game/scatterSound.mjs';
	import { bonusEndingTiming } from '../game/bonusEnding.mjs';

	const context = getContext();

	const cues = new Map<
		SoundEffectName,
		{ timer: ReturnType<typeof setTimeout>; finish: () => void }
	>();
	const musicCues = new Set<SoundEffectName>([
		'jng_intro_fs',
		'sfx_winlevel_small',
		'sfx_youwon_panel',
	]);
	const priorityCues = new Set<SoundEffectName>([
		'jng_intro_fs',
		'sfx_winlevel_small',
		'sfx_youwon_panel',
		'sfx_money_drop',
		'sfx_money_pour',
		'sfx_bonus_yeehaw',
		'sfx_bonus_ending_riser',
	]);
	const reelStopRates = audioMix.reelStopRates;
	let reelStopCount = 0;
	let lastUiClickAt = -Infinity;
	let lastSpinCueAt = -Infinity;
	function playUiClick() {
		const now = performance.now();
		if (now - lastUiClickAt < 110) return;
		lastUiClickAt = now;
		sound.players.once.play({ name: 'sfx_btn_general' });
	}
	function playSpinCue() {
		const now = performance.now();
		if (now - lastSpinCueAt < 120) return;
		lastSpinCueAt = now;
		sound.stop({ name: 'sfx_btn_spin' });
		sound.players.once.play({ name: 'sfx_btn_spin' });
	}
	let duckTimer: ReturnType<typeof setTimeout> | undefined;
	let duckUntil = 0;
	let isDucked = false;
	let baseTriggerFade = false;
	let finalReelImpactAt: number | undefined;
	let secondScatterLanded = false;
	let bonusEntryCueAt = 0;
	let riserStartedAt: number | undefined;
	let riserRate = 1;
	let riserStartTimer: ReturnType<typeof setTimeout> | undefined;
	const riserAttackClearanceMs = audioMix.riserAttackClearance;
	// The useful part of 006343 ends about a second before its WAV tail.
	const riserActiveMs = audioMix.riserActive;
	function alignRiserToFinalImpact() {
		if (riserStartedAt === undefined || finalReelImpactAt === undefined) return;
		const now = performance.now();
		const remaining = Math.max(1, finalReelImpactAt - now);
		const played = (now - riserStartedAt) * riserRate;
		const rate = Math.max(0.65, Math.min(1.8, (riserActiveMs - played) / remaining));
		if (rate > 0) {
			riserStartedAt = now - played / rate;
			riserRate = rate;
			sound.players.once.rate({ name: 'sfx_scatter_riser', rate });
		}
	}
	function fadeBaseToFinalImpact() {
		if (!secondScatterLanded || finalReelImpactAt === undefined) return;
		baseTriggerFade = true;
		sound.players.music.fade({
			name: 'bgm_main',
			from: 1,
			to: 0,
			duration: Math.max(0, finalReelImpactAt - performance.now()),
		});
		secondScatterLanded = false;
	}
	function setBedLevel(from: number, to: number, duration: number) {
		for (const name of ['bgm_main', 'bgm_freespin'] as const)
			if (name !== 'bgm_main' || !baseTriggerFade)
				sound.players.music.fade({ name, from, to, duration });
	}
	function restoreTriggerBase(duration = 250) {
		finalReelImpactAt = undefined;
		secondScatterLanded = false;
		if (!baseTriggerFade) return;
		baseTriggerFade = false;
		sound.players.music.fade({ name: 'bgm_main', from: 0, to: 1, duration });
	}
	function restoreBed() {
		clearTimeout(duckTimer);
		duckTimer = undefined;
		duckUntil = 0;
		if (isDucked) {
			isDucked = false;
			setBedLevel(audioMix.duckLevel, 1, audioMix.duckRelease);
		}
	}
	function duckBed(name: SoundEffectName) {
		if (!priorityCues.has(name)) return;
		const audio =
			audioState.audio ?? (context.stateApp.loadedAssets.sound as LoadedAudio<SoundName>);
		const duration = audio.sprite[name]?.[1] ?? 0;
		duckUntil = Math.max(duckUntil, performance.now() + duration);
		if (!isDucked) {
			isDucked = true;
			setBedLevel(1, audioMix.duckLevel, audioMix.duckAttack);
		}
		clearTimeout(duckTimer);
		duckTimer = setTimeout(
			() => {
				const remaining = duckUntil - performance.now();
				if (remaining > 0) {
					duckTimer = setTimeout(restoreBed, remaining);
					return;
				}
				restoreBed();
			},
			Math.max(0, duckUntil - performance.now()),
		);
	}
	let ending = false;
	let entryGeneration = 0;
	const scatterSound = createScatterSound({
		startTick: () => sound.players.loop.play({ name: 'sfx_anticipation_start' }),
		stopTick: () => sound.stop({ name: 'sfx_anticipation_start' }),
		onSecondScatter: () => {
			secondScatterLanded = true;
			fadeBaseToFinalImpact();
		},
		onFinalImpact: () => {
			if (baseTriggerFade || secondScatterLanded) {
				baseTriggerFade = true;
				secondScatterLanded = false;
				sound.players.music.fade({ name: 'bgm_main', from: 0, to: 0, duration: 0 });
			}
		},
		onFinalScatter: (name: SoundEffectName) => {
			const audio =
				audioState.audio ?? (context.stateApp.loadedAssets.sound as LoadedAudio<SoundName>);
			// Bring the orchestral downbeat under the scatter hit's decay.
			bonusEntryCueAt = performance.now() + Math.min(600, audio.sprite[name][1] * 0.3);
		},
		onMiss: () => {
			bonusEntryCueAt = 0;
			clearTimeout(riserStartTimer);
			riserStartTimer = undefined;
			riserStartedAt = undefined;
			sound.players.once.fade({ name: 'sfx_scatter_riser', from: 1, to: 0, duration: 180 });
			restoreTriggerBase(2500);
		},
		startRiser: () => {
			// Preserve the second scatter's click, then clear its guitar tail so the
			// bass drop at the start of 006343 can be heard on its own.
			sound.players.once.fade({
				name: 'sfx_scatter_stop_2',
				from: 1,
				to: 0.42,
				duration: riserAttackClearanceMs,
			});
			clearTimeout(riserStartTimer);
			riserStartTimer = setTimeout(() => {
				riserStartTimer = undefined;
				riserStartedAt = performance.now();
				riserRate = 1;
				sound.players.once.play({ name: 'sfx_scatter_riser' });
				alignRiserToFinalImpact();
			}, riserAttackClearanceMs);
		},
		stopRiser: () => {
			clearTimeout(riserStartTimer);
			riserStartTimer = undefined;
			riserStartedAt = undefined;
			sound.stop({ name: 'sfx_scatter_riser' });
		},
		play: (name: SoundEffectName) => sound.players.once.play({ name, forcePlay: true }),
	});

	function stopCue(name: SoundEffectName) {
		const cue = cues.get(name);
		if (cue) {
			clearTimeout(cue.timer);
			cues.delete(name);
			cue.finish();
		}
		sound.stop({ name });
	}
	function playCue(name: SoundEffectName) {
		if (musicCues.has(name)) for (const other of musicCues) if (other !== name) stopCue(other);
		stopCue(name);
		if (!ending) duckBed(name);
		sound.players.once.play({ name });
		if (name === 'jng_intro_fs') sound.players.once.fade({ name, from: 0, to: 1, duration: 80 });
		const audio =
			audioState.audio ?? (context.stateApp.loadedAssets.sound as LoadedAudio<SoundName>);
		return new Promise<void>((finish) => {
			const timer = setTimeout(() => stopCue(name), audio.sprite[name][1]);
			cues.set(name, { timer, finish });
		});
	}
	function clearCues() {
		for (const name of [...cues.keys()]) stopCue(name);
	}
	onDestroy(() => {
		entryGeneration++;
		clearTimeout(duckTimer);
		scatterSound.reset();
		bonusEnding.cancel();
		clearCues();
	});

	context.eventEmitter.subscribeOnMount({
		soundScatterSequenceStart: ({ total, baseGame, anticipation }) => {
			bonusEntryCueAt = 0;
			finalReelImpactAt = undefined;
			secondScatterLanded = false;
			scatterSound.start(total, baseGame, anticipation);
		},
		soundScatterLand: () => scatterSound.land(),
		soundScatterFinalTravel: ({ duration }) => {
			finalReelImpactAt = performance.now() + duration;
			fadeBaseToFinalImpact();
			alignRiserToFinalImpact();
		},
		soundScatterFinalImpact: () => scatterSound.finalImpact(),
		soundBonusEntryReady: async () => {
			const generation = entryGeneration;
			sound.stop({ name: 'sfx_anticipation_start' });
			const remaining = bonusEntryCueAt - performance.now();
			if (remaining > 0) await waitForTimeout(remaining);
			if (generation !== entryGeneration) return;
			bonusEntryCueAt = 0;
			// Direct bonus previews have no scatter fade. Silence the base bed
			// before the entry cue in both fixtures and normal play.
			baseTriggerFade = true;
			sound.players.music.fade({ name: 'bgm_main', from: 0, to: 0, duration: 0 });
			clearTimeout(riserStartTimer);
			riserStartTimer = undefined;
			riserStartedAt = undefined;
			sound.players.once.fade({ name: 'sfx_scatter_riser', from: 1, to: 0, duration: 100 });
		},
		soundBonusContinue: () => {
			// Start both accents and the bonus bed on the Continue press.
			stopCue('jng_intro_fs');
			clearTimeout(duckTimer);
			duckTimer = undefined;
			duckUntil = 0;
			isDucked = false;
			sound.players.once.play({ name: 'sfx_bonus_continue_wood_zap', forcePlay: true });
			sound.players.once.play({ name: 'sfx_bonus_continue_spell', forcePlay: true });
			sound.players.music.play({ name: 'bgm_freespin' });
			if (baseTriggerFade) {
				baseTriggerFade = false;
				finalReelImpactAt = undefined;
				secondScatterLanded = false;
				sound.players.music.fade({ name: 'bgm_main', from: 0, to: 1, duration: 0 });
			}
		},
		soundScatterSequenceCancel: () => {
			entryGeneration++;
			bonusEntryCueAt = 0;
			scatterSound.reset();
			restoreTriggerBase();
		},
		soundBonusEnding: ({ phase, tier }) => {
			if (phase === 'begin') {
				const bedFrom = isDucked ? audioMix.duckLevel : 1;
				ending = true;
				clearCues();
				clearTimeout(duckTimer);
				duckTimer = undefined;
				duckUntil = 0;
				isDucked = false;
				// The long coin pour belongs to the previous spin, never the exit.
				void sound.players.once.fade({ name: 'sfx_money_pour', from: 1, to: 0, duration: 220 });
				if (tier === 'grand') {
					sound.players.music.fade({
						name: 'bgm_freespin',
						from: bedFrom,
						to: 0,
						duration: bonusEndingTiming.duck,
					});
					sound.players.once.play({ name: 'sfx_bonus_ending_riser' });
					// The riser grows beneath a possible final small-payout bag drop.
					sound.players.once.fade({
						name: 'sfx_bonus_ending_riser',
						from: 0.35,
						to: 1,
						duration: 2200,
					});
				} else if (tier === 'quiet')
					sound.players.music.fade({ name: 'bgm_freespin', from: bedFrom, to: 0, duration: 400 });
				else
					sound.players.music.fade({ name: 'bgm_freespin', from: bedFrom, to: 0, duration: 650 });
			} else if (phase === 'summary') {
				sound.stop({ name: 'sfx_bonus_ending_riser' });
				sound.stop({ name: 'bgm_freespin' });
				if (tier === 'modest') sound.players.once.play({ name: 'sfx_bonus_summary_modest' });
				else if (tier === 'strong') sound.players.once.play({ name: 'sfx_bonus_summary_strong' });
				else if (tier === 'grand') sound.players.once.play({ name: 'sfx_youwon_panel' });
			} else if (phase === 'return') {
				// Resume the paused base loop at its existing position, starting silent.
				// The summary duck must not interrupt this longer return fade.
				clearTimeout(duckTimer);
				duckTimer = undefined;
				duckUntil = 0;
				isDucked = false;
				sound.players.music.fade({ name: 'bgm_main', from: 0, to: 0, duration: 0 });
				sound.players.music.play({ name: 'bgm_main' });
				sound.players.music.fade({
					name: 'bgm_main',
					from: 0,
					to: 1,
					duration: bonusEndingTiming.returnFade,
				});
			} else {
				ending = false;
				sound.stop({ name: 'sfx_bonus_ending_riser' });
				if (phase === 'cancel') {
					for (const name of [
						'sfx_bonus_summary_modest',
						'sfx_bonus_summary_strong',
						'sfx_youwon_panel',
					] as const)
						sound.stop({ name });
					const bed = context.stateGame.gameType === 'freegame' ? 'bgm_freespin' : 'bgm_main';
					sound.players.music.play({ name: bed });
					sound.players.music.fade({ name: bed, from: 1, to: 1, duration: 0 });
				}
			}
		},
		// ui
		soundBetMode: async ({ betModeKey }) => {
			if (betModeKey === 'SUPERSPIN') {
				// check if SUPERSPIN, when changing the bet mode.
				sound.players.once.play({ name: 'sfx_winlevel_end' });
				await waitForTimeout(SECOND);
				sound.players.music.play({ name: 'bgm_freespin' });
			} else {
				sound.players.music.play({ name: 'bgm_main' });
			}
		},
		// Generic menu, dialog, and selection actions are intentionally silent.
		soundPressGeneral: playUiClick,
		soundPressPlayAmount: playUiClick,
		soundPressSpeed: playUiClick,
		soundPressBet: () => {
			if (context.stateXstateDerived.isIdle()) playSpinCue();
		},
		soundPressSpin: playSpinCue,
		// scatterCounter
		soundScatterCounterIncrease: () => context.stateGame.scatterCounter++,
		soundScatterCounterClear: () => (context.stateGame.scatterCounter = 0),
		soundInteractionsStop: () => {
			entryGeneration++;
			scatterSound.reset();
			restoreTriggerBase();
			bonusEnding.cancel();
			clearCues();
			restoreBed();
			for (const name of Object.keys(
				(context.stateApp.loadedAssets.sound as LoadedAudio<SoundName>).sprite,
			) as SoundName[]) {
				// Let an earned payout finish even when playback is cancelled.
				if (name !== 'sfx_money_drop') sound.players.once.stop({ name });
				sound.players.loop.stop({ name });
			}
		},
		// game
		soundMusic: ({ name }) => {
			if (ending) return;
			if (name === 'bgm_main') {
				scatterSound.reset();
				restoreTriggerBase();
			}
			stopCue('jng_intro_fs');
			sound.players.music.play({ name });
			if (name === 'bgm_freespin' && baseTriggerFade) {
				// The base bed is paused now; prepare its original level for the return.
				baseTriggerFade = false;
				finalReelImpactAt = undefined;
				secondScatterLanded = false;
				sound.players.music.fade({ name: 'bgm_main', from: 0, to: 1, duration: 0 });
			}
		},
		soundCue: ({ name }) => playCue(name),
		soundFade: ({ name, from, to, duration }) => sound.fade({ name, from, to, duration }),
		soundLoop: ({ name }) => sound.players.loop.play({ name }),
		soundOnce: ({ name, forcePlay }) => {
			if (musicCues.has(name)) {
				void playCue(name);
				return;
			}
			// Ultra uses the same reel-stop cue each round. Restart its short tail so
			// a following fast spin still gets a landing without stacking impacts.
			const reelStop = name.startsWith('sfx_reel_stop_');
			if (name === 'sfx_fs_respins' || reelStop) sound.stop({ name });
			if (!ending) duckBed(name);
			sound.players.once.play({ name, forcePlay: name === 'sfx_money_drop' || forcePlay });
			if (reelStop)
				sound.players.once.rate({
					name,
					rate: reelStopRates[reelStopCount++ % reelStopRates.length],
				});
		},
		soundStop: ({ name }) => {
			if (cues.has(name as SoundEffectName)) stopCue(name as SoundEffectName);
			else sound.stop({ name });
		},
	});

	// Reel travel has no continuous sound. A manual spin press supplies the start cue.
	$effect(() => {
		const spinning = context.stateGame.board.some((reel) => reel.reelState.motion === 'spinning');
		untrack(() => {
			if (spinning) {
				stopCue('sfx_winlevel_small');
				sound.stop({ name: 'sfx_money_pour' });
			}
		});
	});

	onMount(() => {
		if (stateBet.activeBetModeKey === 'SUPERSPIN') {
			// check if SUPERSPIN, when resume bet and the bet is a super spin.
			sound.players.music.play({ name: 'bgm_freespin' });
		} else {
			sound.players.music.play({ name: 'bgm_main' });

			//How to control volume per soundfile(use fade)

			//How to control rate per soundfile
			// sound.players.music.rate({ rate: 2, name: 'bgm_main'}); // change play back rate(1: default, 0: slow, 1+ fasterm and higher pitch )
		}
	});
</script>
