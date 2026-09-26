import { Howl, Howler } from 'howler';
import { routeHowls } from './routeHowls.mjs';
import { installAudioActivation } from './audioActivation.mjs';

import { type LoadedAudio } from 'pixi-svelte';
import { stateSoundDerived } from 'state-shared';

import { createPlayer, type Player } from './createPlayer.svelte';
import { createPlayMusic } from './createPlayMusic.svelte';
import { createPlayLoop } from './createPlayLoop.svelte';
import { createPlayOnce } from './createPlayOnce.svelte';
import type { FadeOptions, RateOptions, StopOptions } from './types';

function createSound<TSoundName extends string>() {
	type PlayMusic = ReturnType<typeof createPlayMusic<TSoundName>>['play'];
	type PlayLoop = ReturnType<typeof createPlayLoop<TSoundName>>['play'];
	type PlayOnce = ReturnType<typeof createPlayOnce<TSoundName>>['play'];

	let loadedAudio: LoadedAudio<TSoundName>;
	let loaded = $state(false);
	let visibilityState = $state<DocumentVisibilityState>('visible');
	let players: {
		music: Player<TSoundName, PlayMusic>;
		loop: Player<TSoundName, PlayLoop>;
		once: Player<TSoundName, PlayOnce>;
	};

	const load = (loadedAudioValue: LoadedAudio<TSoundName>, sources: Partial<Record<TSoundName, string>> = {}) => {
		// loadedAudio
		loadedAudio = loadedAudioValue;

		const primary = new Howl({
			src: loadedAudio.src,
			sprite: loadedAudio.sprite,
			volume: 1,
		});
		const overrides: Record<string, Howl> = {};
		for (const [name, src] of Object.entries(sources) as [TSoundName, string][]) {
			overrides[name] = new Howl({src: [src], sprite: {[name]: loadedAudio.sprite[name]}, volume: 1});
		}
		const howl = Object.keys(overrides).length ? routeHowls(primary, overrides) as unknown as Howl : primary;
		// players
		players = {
			music: createPlayer<TSoundName, PlayMusic>({ loadedAudio, loop: true, howl, createPlay: createPlayMusic<TSoundName> }), // prettier-ignore
			loop: createPlayer<TSoundName, PlayLoop>({ loadedAudio, loop: true, howl, createPlay: createPlayLoop<TSoundName> }), // prettier-ignore
			once: createPlayer<TSoundName, PlayOnce>({ loadedAudio, loop: false, howl, createPlay: createPlayOnce<TSoundName> }), //  prettier-ignore
		};

		// audioContextState and visibilityState
		const onVisibilityStateChange = () => (visibilityState = document.visibilityState);
		visibilityState = document.visibilityState;
		const removeActivation = installAudioActivation({
			getContext: () => Howler.ctx,
			target: document,
			onActivate: () => {
				if (!document.hidden) {
					visibilityState = document.visibilityState;
					Howler.volume(1);
					Howler.mute(false);
				}
			},
		});
		document.addEventListener('visibilitychange', onVisibilityStateChange);
		loaded = true;

		const destroy = () => {
			loaded = false;
			removeActivation();
			document.removeEventListener('visibilitychange', onVisibilityStateChange);

			if (players) {
				players.music.howl.unload();
				
			}
		};

		return {
			destroy,
		};
	};

	const stop = (stopOptions: StopOptions<TSoundName>) => {
		if (players) {
			players.music.stop(stopOptions);
			players.loop.stop(stopOptions);
			players.once.stop(stopOptions);
		}
	};

	const fade = async (fadeOptions: FadeOptions<TSoundName>) => {
		if (players) {
			const getPromises = () => [
				players.music.fade(fadeOptions),
				players.loop.fade(fadeOptions),
				players.once.fade(fadeOptions),
			];

			await Promise.all(getPromises());
		}
	};

	const rate = (rateOptions: RateOptions<TSoundName>) => {
		if (players) {
			players.music.rate(rateOptions);
			players.loop.rate(rateOptions);
			players.once.rate(rateOptions);
		}
	};

	const disable = () => {
		Howler.volume(0);
		Howler.mute(true);
	};

	const enable = () => {
		Howler.volume(1);
		Howler.mute(false);
	};

	const enableEffect = () => {
		$effect(() => {
			// A suspended context is unlocked by a real gesture, not a global mute.
			if (visibilityState === 'visible') {
				enable();
			} else {
				disable();
			}
		});
	};


	const volumeMusicEffect = () => {
		if (loaded && players) {
			players.music.volume(stateSoundDerived.volumeMusic());
		}
	};

	const volumeLoopEffect = () => {
		if (loaded && players) {
			players.loop.volume(stateSoundDerived.volumeSoundEffect());
		}
	};

	const volumeOnceEffect = () => {
		if (loaded && players) {
			players.once.volume(stateSoundDerived.volumeSoundEffect());
		}
	};

	const volumeEffect = () => {
		$effect(() => {
			volumeMusicEffect();
		});

		$effect(() => {
			volumeLoopEffect();
		});

		$effect(() => {
			volumeOnceEffect();
		});
	};

	return {
		load,
		stop,
		fade,
		rate,
		volumeEffect,
		enableEffect,
		get players() {
			return players;
		},
	};
}

export { createSound };
