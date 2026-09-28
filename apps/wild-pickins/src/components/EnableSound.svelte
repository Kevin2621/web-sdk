<script lang="ts">
	import { onMount, untrack } from 'svelte';

	import type { LoadedAudio } from 'pixi-svelte';

	import { getContext } from '../game/context';
	import { sound, type SoundName } from '../game/sound';

	import { audioWorkbench, audioLibrary, effectiveAudio, loadSavedAudioSettings } from '../game/audioWorkbench.svelte';
	import { AUDIO_WORKBENCH_ENABLED } from '../game/audioWorkbenchEnabled';
	import { bonusEndingTiming } from '../game/bonusEnding.mjs';
	import { defaultEnding } from '../game/audioWorkbench.mjs';
	import { recordingSources } from '../game/audioWorkbench.mjs';
	const context = getContext();
	let mounted=$state(false);

	let dispose=()=>{};
	let ownedPlayers: unknown;
	let applied=-1;
	function reload(){
		dispose();
		const source=$state.snapshot(context.stateApp.loadedAssets.sound) as LoadedAudio<SoundName>;
		const configured=effectiveAudio(source);
		const recordingOverrides:Partial<Record<SoundName,string>>=import.meta.env.DEV && AUDIO_WORKBENCH_ENABLED ? recordingSources(audioWorkbench.settings,audioLibrary) : {};
		const sprite={...configured.sprite};
		const useShippedRecording=(name:SoundName)=>!Object.hasOwn(recordingOverrides,name) &&
			(!import.meta.env.DEV || !AUDIO_WORKBENCH_ENABLED || audioWorkbench.settings.cues[name].source===name);
		// Keep the old sprite regions available for workbench assignments. Normal
		// playback routes these cues to the shorter standalone WAV recordings.
		if(useShippedRecording('sfx_btn_spin')){
			sprite.sfx_btn_spin=[0,300,false];
			recordingOverrides.sfx_btn_spin='./assets/audio/effects/symbolFastWhoosh.wav';
		}
		if(useShippedRecording('sfx_anticipation_start')){
			sprite.sfx_anticipation_start=[0,2869.82,true];
			recordingOverrides.sfx_anticipation_start='./assets/audio/effects/anticipationTick.wav';
		}
		if(useShippedRecording('sfx_scatter_riser')){
			sprite.sfx_scatter_riser=[0,4922.93,false];
			recordingOverrides.sfx_scatter_riser='./assets/audio/effects/windupAnticipation006343.wav';
		}
		if(useShippedRecording('sfx_bonus_continue_spell')){
			sprite.sfx_bonus_continue_spell=[0,3395.918,false];
			recordingOverrides.sfx_bonus_continue_spell='./assets/audio/effects/bonusContinueHealingSpell003701.mp3';
		}
		if(useShippedRecording('sfx_bonus_continue_wood_zap')){
			sprite.sfx_bonus_continue_wood_zap=[0,1875.034,false];
			recordingOverrides.sfx_bonus_continue_wood_zap='./assets/audio/effects/bonusContinueWoodZap003828.wav';
		}
		if(useShippedRecording('sfx_bonus_summary_modest')){
			sprite.sfx_bonus_summary_modest=[0,3030.204,false];
			recordingOverrides.sfx_bonus_summary_modest='./assets/audio/effects/bonusSummaryLevel1.mp3';
		}
		if(useShippedRecording('sfx_bonus_summary_strong')){
			sprite.sfx_bonus_summary_strong=[0,6034.286,false];
			recordingOverrides.sfx_bonus_summary_strong='./assets/audio/effects/bonusSummaryLevel2.mp3';
		}
		if(useShippedRecording('sfx_farm_entry_riser')){
			sprite.sfx_farm_entry_riser=[0,6034.286,false];
			recordingOverrides.sfx_farm_entry_riser='./assets/audio/effects/farmEntryGuitarSlide.mp3';
		}
		if(useShippedRecording('sfx_multiplier_landing')){
			sprite.sfx_multiplier_landing=[0,999.48,false];
			recordingOverrides.sfx_multiplier_landing='./assets/audio/effects/wildLandingCurrent.mp3';
		}
		for(const reel of [1,2,3,4,5]){
			const name=`sfx_reel_stop_${reel}` as SoundName;
			if(!useShippedRecording(name))continue;
			sprite[name]=[0,252.6,false];
			recordingOverrides[name]='./assets/audio/effects/reelStopWood.wav';
		}
		const loadedAudio={...configured,sprite} as LoadedAudio<SoundName>;
		// The sprite manifest owns cue gain, including the reel mix.
		audioWorkbench.audio=loadedAudio;
		dispose=sound.load(loadedAudio,recordingOverrides).destroy;
		ownedPlayers=sound.players;
		audioWorkbench.ready=AUDIO_WORKBENCH_ENABLED;
		applied=audioWorkbench.revision;
		if(mounted && !context.stateLayout.showLoadingScreen)
			sound.players.music.play({name:context.stateGame.gameType==='freegame'?'bgm_freespin':'bgm_main'});
	}
	onMount(()=>{
		if(!AUDIO_WORKBENCH_ENABLED)Object.assign(bonusEndingTiming,defaultEnding);
		loadSavedAudioSettings();reload();mounted=true;
		// Safari may reload a memory-heavy Storybook page before autoplay unlocks.
		// Retry the requested bed on the first real gesture after mounting.
		let retryPending = true;
		const retryMusic = () => {
			if (!retryPending || sound.players!==ownedPlayers || !audioWorkbench.audio || context.stateLayout.showLoadingScreen) return;
			retryPending = false;
			sound.players.music.play({name:context.stateGame.gameType==='freegame'?'bgm_freespin':'bgm_main'});
		};
		const events = ['pointerdown', 'touchend', 'keydown'];
		for (const event of events) document.addEventListener(event, retryMusic);
		return ()=>{
			for (const event of events) document.removeEventListener(event, retryMusic);
			if(sound.players===ownedPlayers)audioWorkbench.ready=false;
			dispose();ownedPlayers=undefined;
		};
	});
	$effect(()=>{
		const revision=audioWorkbench.revision;
		if(AUDIO_WORKBENCH_ENABLED && mounted && revision!==applied)untrack(reload);
	});

	sound.enableEffect();
	sound.volumeEffect();
</script>
