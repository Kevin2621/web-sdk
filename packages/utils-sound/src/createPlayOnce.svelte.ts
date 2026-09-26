import type { Howl } from 'howler';

import type { PlayOptions, GetSound, GetSoundMap } from './types';

export function createPlayOnce<TSoundName extends string>(options: {
	howl: Howl;
	newSound: (value: TSoundName) => GetSound<TSoundName>;
	getSoundMap: () => GetSoundMap<TSoundName>;
	initSoundVolume: (soundName: TSoundName) => void;
}) {
	type Sound = GetSound<TSoundName>;
	// Register once per player, not once per impact. Completed/stopped voices
	// leave no listener behind, and older overlapping tails cannot clear a new voice.
	const voices = new Map<number, TSoundName>();
	const release = (id: number) => {
		const name = voices.get(id);
		if (name === undefined) return;
		voices.delete(id);
		if (options.getSoundMap()[name]?.soundId === id) delete options.getSoundMap()[name];
	};
	options.howl.on('end', release);
	options.howl.on('stop', release);

	const playOnce = (sound: Sound) => {
		const soundId = options.howl.play(sound.soundName);
		options.getSoundMap()[sound.soundName] = {
			...sound,
			soundId,
			soundState: 'playing',
		};

		options.initSoundVolume(sound.soundName);

		voices.set(soundId, sound.soundName);
	};

	const soundPlayMap = {
		new: (sound: Sound) => playOnce(sound),
		paused: (sound: Sound) => playOnce(sound),
		playing: (sound: Sound, options: { forcePlay?: boolean }) => {
			if (options.forcePlay) playOnce(sound);
		},
	};

	const play = (playOptions: PlayOptions<TSoundName> & { forcePlay?: boolean }) => {
		const existingSound = options.getSoundMap()[playOptions.name];
		const sound = existingSound ?? options.newSound(playOptions.name);
		soundPlayMap[sound.soundState](sound, { forcePlay: playOptions.forcePlay });
	};

	return {
		play,
	};
}
