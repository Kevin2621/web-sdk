<script lang="ts" module>
	import { sound, type MusicName, type SoundEffectName, type SoundName } from '../game/sound';

	export type EmitterEventSound =
		| { type: 'soundMusic'; name: MusicName }
		| { type: 'soundScatterSequenceStart'; total: number; baseGame: boolean }
		| { type: 'soundScatterLand' }
		| { type: 'soundScatterRiserPlan'; duration: number }
		| { type: 'soundScatterSequenceCancel' }
		| {type:'soundBonusEnding';phase:'begin'|'summary'|'return'|'cancel'|'complete'}
		| { type: 'soundCue'; name: SoundEffectName }
		| { type: 'soundOnce'; name: SoundEffectName; forcePlay?: boolean }
		| { type: 'soundLoop'; name: SoundEffectName }
		| { type: 'soundStop'; name: SoundName }
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
	import { audioWorkbench } from '../game/audioWorkbench.svelte';
	import { bonusEnding } from '../game/bonusEndingController';
	import { createScatterSound, createScatterRiser } from '../game/scatterSound.mjs';

	const context = getContext();

	const cues = new Map<SoundEffectName, { timer: ReturnType<typeof setTimeout>; finish: () => void }>();
	const musicCues = new Set<SoundEffectName>(['jng_intro_fs', 'sfx_winlevel_small', 'sfx_youwon_panel']);
	const priorityCues = new Set<SoundEffectName>(['jng_intro_fs', 'sfx_winlevel_small', 'sfx_youwon_panel', 'sfx_money_drop', 'sfx_money_pour', 'sfx_bonus_yeehaw', 'sfx_bonus_ending_riser']);
	let duckTimer: ReturnType<typeof setTimeout> | undefined;
	let duckUntil = 0;
	let isDucked = false;
	function setBedLevel(from:number,to:number,duration:number) {
		for(const name of ['bgm_main','bgm_freespin'] as const)
			sound.players.music.fade({name,from,to,duration});
	}
	function restoreBed() {
		clearTimeout(duckTimer);
		duckTimer=undefined;duckUntil=0;
		if(isDucked){isDucked=false;setBedLevel(.75,1,250);}
	}
	function duckBed(name:SoundEffectName) {
		if(!priorityCues.has(name))return;
		const audio=audioWorkbench.audio ?? context.stateApp.loadedAssets.sound as LoadedAudio<SoundName>;
		const duration=audio.sprite[name]?.[1] ?? 0;
		duckUntil=Math.max(duckUntil,performance.now()+duration);
		if(!isDucked){isDucked=true;setBedLevel(1,.75,90);}
		clearTimeout(duckTimer);
		duckTimer=setTimeout(()=>{
			const remaining=duckUntil-performance.now();
			if(remaining>0){duckTimer=setTimeout(restoreBed,remaining);return;}
			restoreBed();
		},Math.max(0,duckUntil-performance.now()));
	}
	let ending = false;
	const scatterRiser = createScatterRiser({
	 play: (rate:number) => {
	  sound.players.once.play({name:'sfx_scatter_riser'});
	  sound.players.once.rate({name:'sfx_scatter_riser',rate});
	 },
	 stop: () => sound.stop({name:'sfx_scatter_riser'}),
	 duration: () => (audioWorkbench.audio ?? context.stateApp.loadedAssets.sound as LoadedAudio<SoundName>).sprite.sfx_scatter_riser[1],
	});
	const scatterSound = createScatterSound({
	 startRiser: (duration:number) => scatterRiser.plan(duration),
	 stopRiser: () => scatterRiser.cancel(),
	 play: (name:SoundEffectName) => sound.players.once.play({name,forcePlay:true}),
	 // Original recording levels: no automatic music ducking.
	 setBaseGain: () => {},
	});

	function stopCue(name: SoundEffectName) {
		const cue = cues.get(name);
		if (cue) { clearTimeout(cue.timer); cues.delete(name); cue.finish(); }
		sound.stop({ name });
	}
	function playCue(name: SoundEffectName) {
		if (musicCues.has(name)) for (const other of musicCues) if (other !== name) stopCue(other);
		stopCue(name);
		duckBed(name);
		sound.players.once.play({ name });
		const audio = audioWorkbench.audio ?? context.stateApp.loadedAssets.sound as LoadedAudio<SoundName>;
		return new Promise<void>((finish) => {
			const timer = setTimeout(() => stopCue(name), audio.sprite[name][1]);
			cues.set(name, { timer, finish });
		});
	}
	function clearCues() { for (const name of [...cues.keys()]) stopCue(name); }
	onDestroy(()=>{clearTimeout(duckTimer);scatterRiser.cancel();bonusEnding.cancel();clearCues();});

	context.eventEmitter.subscribeOnMount({
		soundScatterSequenceStart: ({total,baseGame}) => scatterSound.start(total,baseGame),
		soundScatterLand: () => scatterSound.land(),
		soundScatterRiserPlan: ({duration}) => scatterSound.planRiser(duration),
		soundScatterSequenceCancel: () => scatterSound.reset(),
		soundBonusEnding: ({phase}) => {
			if(import.meta.env.DEV)audioWorkbench.phase=({begin:'Ending buildup',summary:'Bonus total revealed',return:'Returning to base music',cancel:'Stopped',complete:'Complete'})[phase];
			if(phase==='begin'){
				ending=true;clearCues();
				sound.stop({name:'sfx_bigwin_coinloop'});
				duckBed('sfx_bonus_ending_riser');
				sound.players.once.play({name:'sfx_bonus_ending_riser'});
			}else if(phase==='summary'){
				sound.stop({name:'bgm_freespin'});
				duckBed('sfx_youwon_panel');
				sound.players.once.play({name:'sfx_youwon_panel'});
			}else if(phase==='return'){
				sound.players.music.play({name:'bgm_main'});
			}else{
				ending=false;
				sound.stop({name:'sfx_bonus_ending_riser'});
				if(phase==='cancel')sound.stop({name:'sfx_youwon_panel'});
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
		soundPressGeneral: () => sound.players.once.play({ name: 'sfx_btn_general' }),
		soundPressBet: () => sound.players.once.play({ name: 'sfx_btn_general' }),
		// scatterCounter
		soundScatterCounterIncrease: () => context.stateGame.scatterCounter++,
		soundScatterCounterClear: () => (context.stateGame.scatterCounter = 0),
		soundInteractionsStop: () => {
			scatterSound.reset();
			bonusEnding.cancel();
			clearCues();
			restoreBed();
			for (const name of Object.keys((context.stateApp.loadedAssets.sound as LoadedAudio<SoundName>).sprite) as SoundName[]) {
				// Let an earned payout finish even when playback is cancelled.
				if (name !== 'sfx_money_drop') sound.players.once.stop({ name });
				sound.players.loop.stop({ name });
			}
		},
		// game
		soundMusic: ({ name }) => {
			if(ending)return;
			if(name==='bgm_main')scatterSound.reset();
			stopCue('jng_intro_fs');
			sound.players.music.play({ name });
		},
		soundCue: ({ name }) => playCue(name),
		soundLoop: ({ name }) => sound.players.loop.play({ name }),
		soundOnce: ({ name, forcePlay }) => {
			if (musicCues.has(name)) { void playCue(name); return; }
			if (name === 'sfx_fs_respins') sound.stop({ name });
			duckBed(name);
			sound.players.once.play({ name, forcePlay: name === 'sfx_money_drop' || forcePlay });
		},
		soundStop: ({ name }) => { if (cues.has(name as SoundEffectName)) stopCue(name as SoundEffectName); else sound.stop({ name }); },
	});

	// Follow actual motion for manual spins, autoplay, bonus spins and fixtures.
	$effect(() => {
		const spinning = context.stateGame.board.some((reel) => reel.reelState.motion === 'spinning');
		untrack(() => {
			if (spinning) {
				stopCue('sfx_winlevel_small');
				sound.stop({ name: 'sfx_money_pour' });
				sound.players.loop.play({ name: 'sfx_btn_spin' });
			}
			else sound.stop({ name: 'sfx_btn_spin' });
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
