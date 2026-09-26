import { Howl, Howler } from 'howler';
import { installAudioActivation } from './audioActivation.mjs';

// One Howl per file, one owned voice per cue, one browser activation listener.
// Optional dependencies make lifecycle and playback testable without a browser.
export function createAudioBank(definitions, {resolve = path => path, HowlClass = Howl,
 howler = Howler, target = document, now = () => performance.now()} = {}) {
 const files = new Map(), voices = new Map(), gains = new Map(), lastPlayed = new Map();
 const volumes = {music: 0, effects: 0};
 let disposed = false;
 for (const [name, def] of Object.entries(definitions)) {
  if (!files.has(def.file)) files.set(def.file, {sprite:{}, howl:null});
  if (def.clip) files.get(def.file).sprite[name] = [...def.clip, !!def.loop];
 }
 const getHowl = name => {
  const file = definitions[name].file, group = files.get(file);
  group.howl ??= new HowlClass({src:[resolve(file)], volume:0,
   ...(Object.keys(group.sprite).length ? {sprite:group.sprite} : {})});
  return group.howl;
 };
 const volume = name => {
  const def = definitions[name];
  return def.volume * volumes[def.channel] * (gains.get(name) ?? 1);
 };
 const stop = name => {
  const voice = voices.get(name);
  if (voice) voice.howl.stop(voice.id);
  voices.delete(name);
 };
 const play = name => {
  const def = definitions[name];
  if (disposed || !def || def.enabled === false || (target.hidden && def.channel === 'effects')) return;
  const previous = voices.get(name);
  const howl = getHowl(name);
  if (def.channel === 'music' || def.loop) {
   if (previous) {
    if (!howl.playing(previous.id)) howl.play(previous.id);
    howl.volume(volume(name), previous.id);
    return;
   }
  } else {
   if (now() - (lastPlayed.get(name) ?? -Infinity) < 70) return;
   lastPlayed.set(name, now()); stop(name);
  }
  const id = howl.play(def.clip ? name : undefined);
  voices.set(name, {howl,id});
  howl.loop(!!def.loop, id);
  howl.volume(volume(name), id);
 };
 const setVolumes = (music, effects) => {
  volumes.music = music; volumes.effects = effects;
  for (const [name, voice] of voices) voice.howl.volume(volume(name), voice.id);
 };
 const setGain = (name, value) => {
  gains.set(name, Math.max(0, Math.min(1,value)));
  const voice = voices.get(name);
  if (voice) voice.howl.volume(volume(name), voice.id);
 };
 const stopEffects = () => {
  for (const name of voices.keys()) if (definitions[name].channel === 'effects') stop(name);
  lastPlayed.clear();
 };
 const syncVisibility = () => {
  howler.volume(1); howler.mute(!!target.hidden);
  if (target.hidden) stopEffects();
 };
 const removeActivation = installAudioActivation({getContext:()=>howler.ctx,target,
  onActivate:()=>{if (!target.hidden) syncVisibility();}});
 target.addEventListener('visibilitychange',syncVisibility);
 syncVisibility();
 return {play,stop,setVolumes,setGain,stopEffects,
  onPlay(name, listener) {
   const howl=getHowl(name);
   const handler=id=>{if(voices.get(name)?.id===id)listener();};
   howl.on('play',handler);
   return ()=>howl.off('play',handler);
  },
  dispose() {
   disposed=true;removeActivation();target.removeEventListener('visibilitychange',syncVisibility);
   for (const group of files.values()) group.howl?.unload();
   voices.clear();lastPlayed.clear();gains.clear();
  },
 };
}
