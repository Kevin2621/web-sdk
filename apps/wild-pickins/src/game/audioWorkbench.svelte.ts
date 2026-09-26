import { AUDIO_WORKBENCH_ENABLED } from './audioWorkbenchEnabled';
import catalogue from './audioSprite.json';
import library from './audioLibrary.json';
export const audioLibrary=library;
import { defaultAudioSettings, validateAudioSettings, configuredAudio } from './audioWorkbench.mjs';
import { bonusEndingTiming } from './bonusEnding.mjs';
import type { LoadedAudio } from 'pixi-svelte';
import type { SoundName } from './sound';
export const audioCatalogue = catalogue;
export const audioWorkbench = $state({
 settings:defaultAudioSettings(catalogue), revision:0, ready:false,
 audio:null as LoadedAudio<SoundName>|null,
 phase:'Idle', lastBonus:null as null|{input:unknown;options:Record<string,boolean>},
});
const storageKey='wild-pickins.audio-workbench.v1';
export function applyAudioSettings(input:unknown){
 if(!AUDIO_WORKBENCH_ENABLED)return;
 const settings=validateAudioSettings(input,catalogue,library);
 audioWorkbench.settings=settings;
 Object.assign(bonusEndingTiming,settings.ending);
 audioWorkbench.revision++;
}
export function loadSavedAudioSettings(){
 if(!import.meta.env.DEV || !AUDIO_WORKBENCH_ENABLED)return;
 try{const saved=localStorage.getItem(storageKey);if(saved)applyAudioSettings(JSON.parse(saved));}
 catch(error){audioWorkbench.phase=`Saved settings not loaded: ${String(error)}`;}
}
export function saveAudioSettings(){localStorage.setItem(storageKey,JSON.stringify(audioWorkbench.settings));}
export function resetAudioSettings(){localStorage.removeItem(storageKey);applyAudioSettings(defaultAudioSettings(catalogue));}
export function effectiveAudio(audio:LoadedAudio<SoundName>){
 return import.meta.env.DEV && AUDIO_WORKBENCH_ENABLED ? configuredAudio(audio,audioWorkbench.settings,library) as LoadedAudio<SoundName> : audio;
}
