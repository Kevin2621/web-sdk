import type { LoadedAudio } from 'pixi-svelte';
import type { SoundName } from './sound';
// Only production playback metadata; no workbench state or saved editor settings.
export const audioState = $state({ audio: undefined as LoadedAudio<SoundName> | undefined });
