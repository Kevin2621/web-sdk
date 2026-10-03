<script lang="ts">
	import { onMount } from 'svelte';
	import { base } from '$app/paths';
	import type { LoadedAudio } from 'pixi-svelte';
	import { getContext } from '../game/context';
	import { sound, type SoundName } from '../game/sound';
	import { configureShippedAudio } from '../game/audioConfig.mjs';
	import { audioState } from '../game/audioState.svelte';
	const context = getContext();
	onMount(() => {
		const source = $state.snapshot(context.stateApp.loadedAssets.sound) as LoadedAudio<SoundName>;
		const { audio, sources } = configureShippedAudio(source, base);
		const loadedAudio = audio as LoadedAudio<SoundName>;
		audioState.audio = loadedAudio;
		const { destroy } = sound.load(loadedAudio, sources);
		const ownedPlayers = sound.players;
		let retryPending = true;
		const retryMusic = () => {
			if (!retryPending || sound.players !== ownedPlayers || context.stateLayout.showLoadingScreen)
				return;
			retryPending = false;
			sound.players.music.play({
				name: context.stateGame.gameType === 'freegame' ? 'bgm_freespin' : 'bgm_main',
			});
		};
		const events = ['pointerdown', 'touchend', 'keydown'];
		for (const event of events) document.addEventListener(event, retryMusic);
		return () => {
			for (const event of events) document.removeEventListener(event, retryMusic);
			if (sound.players === ownedPlayers) audioState.audio = undefined;
			destroy();
		};
	});
	sound.enableEffect();
	sound.volumeEffect();
</script>
