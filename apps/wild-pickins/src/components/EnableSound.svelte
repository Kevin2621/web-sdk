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
	let applied=-1;
	function reload(){
		dispose();
		const source=$state.snapshot(context.stateApp.loadedAssets.sound) as LoadedAudio<SoundName>;
		const loadedAudio=effectiveAudio(source);
		// The sprite manifest owns cue gain, including the reel mix.
		audioWorkbench.audio=loadedAudio;
		dispose=sound.load(loadedAudio, import.meta.env.DEV && AUDIO_WORKBENCH_ENABLED ? recordingSources(audioWorkbench.settings,audioLibrary) : {}).destroy;
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
			if (!retryPending || !audioWorkbench.audio || context.stateLayout.showLoadingScreen) return;
			retryPending = false;
			sound.players.music.play({name:context.stateGame.gameType==='freegame'?'bgm_freespin':'bgm_main'});
		};
		const events = ['pointerdown', 'touchend', 'keydown'];
		for (const event of events) document.addEventListener(event, retryMusic);
		return ()=>{
			for (const event of events) document.removeEventListener(event, retryMusic);
			audioWorkbench.ready=false;dispose();
		};
	});
	$effect(()=>{
		const revision=audioWorkbench.revision;
		if(AUDIO_WORKBENCH_ENABLED && mounted && revision!==applied)untrack(reload);
	});

	sound.enableEffect();
	sound.volumeEffect();
</script>
