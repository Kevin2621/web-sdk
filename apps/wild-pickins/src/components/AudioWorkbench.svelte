<script lang="ts">
 import { onDestroy, tick, untrack } from 'svelte';
 import { getContext } from '../game/context';
 import { sound, type SoundName } from '../game/sound';
 import { audioLabels, defaultAudioSettings, validateAudioSettings } from '../game/audioWorkbench.mjs';
 import { audioWorkbench, audioCatalogue, audioLibrary, applyAudioSettings, saveAudioSettings, resetAudioSettings } from '../game/audioWorkbench.svelte';
 import { bonusEnding } from '../game/bonusEndingController';
 import { fixturePlayback, replayAudioBonus, cancelFixtureAction } from '../game/fixturePlayback.svelte';
 import { seedCelebration } from '../game/seedCelebration.svelte';
 import { stateSound } from 'state-shared';
 const {fixtureOnly=false}=$props<{fixtureOnly?:boolean}>();
 const context=getContext();
 let open=$state(false), selected=$state('sfx_bonus_ending_riser');
 let draft=$state(defaultAudioSettings(audioCatalogue));
 let message=$state(''), error=$state(''), previewing=$state(false), rehearsing=$state(false);
 let previewTimer:ReturnType<typeof setTimeout>|undefined;
 let generation=0;
 let search=$state('');
 const libraryEntries=Object.entries(audioLibrary);
 const matching=$derived(libraryEntries.filter(([id,entry])=>id===cue.source || entry.path.toLowerCase().includes(search.toLowerCase().trim())));
 const sourceDuration=(name:string)=>audioLibrary[name]?.duration??audioCatalogue.sprite[name as keyof typeof audioCatalogue.sprite][1];
 const busy=$derived(fixturePlayback.busy || seedCelebration.active || (!fixtureOnly && !context.stateXstateDerived.isIdle()) || context.stateGame.board.some(r=>r.reelState.motion!=='stopped'));
 const available=$derived(audioWorkbench.ready && !context.stateLayout.showLoadingScreen);
 const locked=$derived(!available || busy || rehearsing);
 const cue=$derived(draft.cues[selected]);
 const duration=$derived(sourceDuration(cue.source));
 const sources=Object.keys(audioCatalogue.sprite);
 const label=(name:string)=>audioLabels[name]??name.replaceAll('_',' ');
 function show(){draft=structuredClone($state.snapshot(audioWorkbench.settings));open=true;error='';}
 function halt(restore=true){
  generation++;clearTimeout(previewTimer);
  if(rehearsing)bonusEnding.cancel();
  if(previewing || rehearsing){
   // Explicit audition Stop also stops preview tails.
   sound.players.once.howl.stop();
   for(const name of sources)sound.stop({name:name as SoundName});
   if(restore && available)context.eventEmitter.broadcast({type:'soundMusic',name:context.stateGame.gameType==='freegame'?'bgm_freespin':'bgm_main'});
  }
  previewing=false;rehearsing=false;
 }
 async function apply(){
  if(locked)return false;
  try{
   validateAudioSettings($state.snapshot(draft),audioCatalogue,audioLibrary);
   halt(false);
   context.eventEmitter.broadcast({type:'soundInteractionsStop'});
   applyAudioSettings($state.snapshot(draft));await tick();
   draft=structuredClone($state.snapshot(audioWorkbench.settings));
   error='';message='Applied to this game. Save in browser to keep after refresh.';return true;
  }catch(e){error=String(e);return false;}
 }
 async function preview(){
  if(!await apply())return;
  for(const name of sources)sound.stop({name:name as SoundName});
  const name=selected as SoundName;
  previewing=true;message=`Previewing ${label(selected)}`;
  const entry=audioWorkbench.audio!.sprite[selected];
  if(selected.startsWith('bgm_'))sound.players.music.play({name});
  else if(entry[2])sound.players.loop.play({name});
  else sound.players.once.play({name,forcePlay:true});
  if(!entry[2])previewTimer=setTimeout(()=>halt(),entry[1]+50);
 }
 async function ending(){
  if(!await apply())return;
  rehearsing=true;const run=++generation;
  context.eventEmitter.broadcast({type:'soundMusic',name:'bgm_freespin'});
  bonusEnding.arm({startAt:'landed',reason:'audition'});bonusEnding.begin('landed');
  message='Rehearsing the real ending controller. Watch the phase label.';
  try{await bonusEnding.finish(()=>{});}
  catch(e){error=String(e);}
  finally{if(run===generation){rehearsing=false;message='Ending rehearsal complete.';}}
 }
 async function replay(){
  if(!await apply())return;
  message='Replaying the last bonus. Use the game’s Continue button during entry.';
  try{await replayAudioBonus();}catch(e){error=String(e);}
 }
 function save(){try{saveAudioSettings();message='Applied settings saved in this browser.';}catch(e){error=String(e);}}
 function exportSettings(){
  try{
   const validated=validateAudioSettings($state.snapshot(draft),audioCatalogue,audioLibrary);
   const url=URL.createObjectURL(new Blob([JSON.stringify(validated,null,2)],{type:'application/json'}));
   const link=document.createElement('a');link.href=url;link.download='wild-pickins-audio.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
   message='Exported draft settings. Import the JSON here, or send it back to make the mix permanent.';
  }catch(e){error=String(e);}
 }
 async function importSettings(event:Event){
  const input=event.currentTarget as HTMLInputElement;const file=input.files?.[0];if(!file)return;
  try{draft=validateAudioSettings(JSON.parse(await file.text()),audioCatalogue,audioLibrary);error='';message='Imported into the draft. Apply when ready.';}catch(e){error=String(e);}finally{input.value='';}
 }
 function reset(){if(locked)return;try{halt(false);context.eventEmitter.broadcast({type:'soundInteractionsStop'});resetAudioSettings();draft=defaultAudioSettings(audioCatalogue);error='';message='Restored shipped settings and removed the browser override.';}catch(e){error=String(e);}}
 function changeSource(){cue.start=0;cue.end=sourceDuration(cue.source);}
 function stop(){if(fixturePlayback.busy)cancelFixtureAction();halt();audioWorkbench.phase='Stopped';}
 $effect(()=>{if(busy && (previewing || rehearsing))untrack(()=>halt(false));});
 onDestroy(()=>halt(false));
</script>

<button class="audio-launch" onclick={()=>{if(open){halt();open=false;}else show();}}>Audio workbench</button>
{#if open}
 <aside class="audio-panel" aria-label="Audio workbench" onkeydown={e=>e.stopPropagation()} onkeyup={e=>e.stopPropagation()}>
  <header><strong>Audio workbench</strong><button aria-label="Close audio workbench" onclick={()=>{halt();open=false;}}>Close</button></header>
  <p>Development mix · edit → Apply & preview → Save. No sprite rebuild required.</p>
  <label>Game event<select bind:value={selected} disabled={locked}>
   {#each Object.keys(audioLabels) as name}<option value={name}>{label(name)}</option>{/each}
  </select></label>
  <fieldset disabled={locked}>
   <label>Search recordings<input type="search" placeholder="Name, number, or folder…" bind:value={search}/></label>
   <small>{matching.length} of {libraryEntries.length} MP3 recordings · plus current game clips</small>
   <label>Recording<select bind:value={cue.source} onchange={changeSource}>
    <optgroup label="Current game recordings">{#each Object.keys(audioLabels) as name}<option value={name}>{label(name)}</option>{/each}</optgroup>
    <optgroup label="Other template clips">{#each sources.filter(n=>!audioLabels[n]) as name}<option value={name}>{label(name)}</option>{/each}</optgroup>
    <optgroup label="All audio assets · MP3">{#each matching as [id,entry]}<option value={id}>{entry.label} — {entry.path.split('/')[0]}</option>{/each}</optgroup>
   </select></label>
   {#if audioLibrary[cue.source]}<small class="recording-path">{audioLibrary[cue.source].path}</small>{/if}
   <label>Volume · {Math.round(cue.volume*100)}%<input aria-label="Cue volume" type="range" min="0" max="1" step="0.01" bind:value={cue.volume}/></label>
   <div class="pair"><label>Start in clip (ms)<input type="number" min="0" max={duration-1} step="1" bind:value={cue.start}/></label>
   <label>End in clip (ms)<input type="number" min={cue.start+1} max={duration} step="1" bind:value={cue.end}/></label></div>
   <small>Full recording: {(duration/1000).toFixed(3)} s. Loop behavior follows the game event.</small>
   {#if selected==='sfx_reel_stop_1'}<button onclick={()=>{for(const n of [2,3,4,5])draft.cues[`sfx_reel_stop_${n}`]={...cue};message='Copied to all five reel landings in the draft.';}}>Use for all five reels</button>{/if}
   <div class="actions"><button onclick={apply}>Apply changes</button><button onclick={preview}>Apply & preview cue</button></div>
   <details open><summary>Bonus ending timing</summary>
    <label>Buildup before total reveal (ms)<input type="number" min="0" max="30000" step="100" bind:value={draft.ending.leadIn}/></label>
    <label>Lower bonus music over (ms)<input type="number" min="0" max="30000" step="100" bind:value={draft.ending.duck}/></label>
    <label>Base music overlap with summary (ms)<input type="number" min="0" max="30000" step="100" bind:value={draft.ending.returnOverlap}/></label>
    <label>Base music fade-in (ms)<input type="number" min="0" max={draft.ending.returnOverlap} step="100" bind:value={draft.ending.returnFade}/></label>
    <small>Summary length follows its selected clip. Fade-in must fit within overlap.</small>
   </details>
   <div class="actions"><button onclick={ending}>Apply & rehearse ending</button><button onclick={replay} disabled={!audioWorkbench.lastBonus}>Apply & replay last bonus</button></div>
  </fieldset>
  <div class="actions"><button onclick={stop} disabled={!available}>Stop audition / replay</button><button onclick={save} disabled={locked}>Save applied in browser</button></div>
  <div class="actions"><button onclick={exportSettings}>Export draft JSON</button><label class="import">Import JSON<input type="file" accept="application/json,.json" onchange={importSettings} disabled={locked}/></label><button onclick={reset} disabled={locked}>Reset</button></div>
  <p role="status"><b>{audioWorkbench.phase}</b> · {message}</p>
  {#if error}<p role="alert" class="error">{error}</p>{/if}
  {#if locked}<p>{rehearsing?'Rehearsal running—Stop to edit.':busy?'Game is playing—controls unlock when it finishes.':'Finish loading the game to preview.'}</p>{/if}
  {#if !audioWorkbench.lastBonus}<small>Play one generated or fixture bonus to enable repeatable bonus replay. Ending rehearsal works immediately.</small>{/if}
  {#if stateSound.volumeValueMaster===0 || stateSound.volumeValueSoundEffect===0 || stateSound.volumeValueMusic===0}<p class="error">A game volume channel is muted. Check the game’s sound sliders if previews are silent.</p>{/if}
  <small>Changes stay local to this development browser. Export JSON to keep a backup or share your mix. The full MP3 library is available for previews and game events. Only assigned recordings load; WAV duplicates are omitted.</small>
 </aside>
{/if}
<style>
 .recording-path{overflow-wrap:anywhere}
 .audio-launch{position:fixed;left:10px;top:48px;z-index:11000;padding:7px 10px;background:#202a22;color:#fff;border:1px solid #9ba993;border-radius:5px;font:13px system-ui;cursor:pointer}
 .audio-panel{position:fixed;left:10px;top:88px;bottom:12px;width:min(440px,calc(100vw - 20px));box-sizing:border-box;overflow:auto;z-index:11001;background:#171c19;color:#eee;padding:14px;border:1px solid #687669;border-radius:7px;box-shadow:0 6px 30px #0009;font:13px/1.4 system-ui}
 header,.actions,.pair{display:flex;gap:8px;align-items:center;flex-wrap:wrap}header{justify-content:space-between}header strong{font-size:17px}.actions{margin:10px 0}.pair>label{flex:1;min-width:120px}label{display:block;margin:8px 0}select,input[type=number],input[type=search]{display:block;width:100%;box-sizing:border-box;margin-top:3px;padding:7px;background:#29322c;color:#fff;border:1px solid #687669;border-radius:3px}input[type=range]{display:block;width:100%}button,.import{background:#334237;color:#fff;border:1px solid #879682;border-radius:4px;padding:7px 9px;font:inherit;cursor:pointer}button:disabled{opacity:.45;cursor:default}fieldset{padding:0;border:0;margin:0}summary{font-weight:600;cursor:pointer;margin:12px 0}small{display:block;color:#b7c4b9}.error{color:#ffd3a3}.import input{max-width:185px;font:11px system-ui}p{margin:9px 0}button:focus-visible,input:focus-visible,select:focus-visible{outline:2px solid #efce7c;outline-offset:2px}
</style>
