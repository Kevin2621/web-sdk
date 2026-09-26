export const audioLabels = {
 sfx_scatter_riser:'Bonus approach · Metallic Sparkle Riser Swish',
 ...Object.fromEntries(Array.from({length:5},(_,i)=>[`sfx_scatter_stop_${i+1}`,`Scatter ${i+1} · Simple Wild West Hit ${i+1}`])),
 bgm_main:'Base music · Relaxing Ambient',bgm_freespin:'Bonus music · Cheerful Celebration',
 sfx_btn_spin:'Spin · Mechanical Ticking',sfx_reel_stop_1:'Reel landing · UI Thump',
 sfx_winlevel_small:'Normal win · Level 2 Rollups',jng_intro_fs:'Bonus entry · Level 4 Rollups',
 sfx_bonus_yeehaw:'Entry accent · Yeehaw',sfx_fs_respins:'Free-spin award · Bell 01',
 sfx_bonus_open:'Sign open · Metal Trap',sfx_bonus_close:'Sign close · Metal Trap',
 sfx_money_drop:'All base wins / bonus below 10× · Money Bag Drop',sfx_money_pour:'Payout finish · Money Bag Pour',
 sfx_bonus_ending_riser:'Ending buildup · Orchestral Riser',sfx_youwon_panel:'Bonus summary · Cheerful Sting',
};
export const defaultEnding={leadIn:6000,summary:8230,returnOverlap:1100,duck:800,returnFade:1100};
export function defaultAudioSettings(audio){
 return {version:1,scatterSequence:1,cues:Object.fromEntries(Object.keys(audio.sprite).map(name=>[name,{source:name,volume:audio.config[name]?.volume??1,start:0,end:audio.sprite[name][1]}])),ending:{...defaultEnding}};
}
function number(value,min,max,label){
 if(typeof value!=='number'||!Number.isFinite(value)||value<min||value>max)throw Error(`${label} must be between ${min} and ${max}.`);
 return value;
}
export function validateAudioSettings(input,audio,library={}){
 if(!input||input.version!==1||!input.cues||!input.ending)throw Error('Choose a version 1 audio-workbench JSON file.');
 const settings=defaultAudioSettings(audio);
 for(const [name,value] of Object.entries(input.cues)){
  // Older saved mixes used the template scatter clips/durations. Migrate only these five cues.
  if(input.scatterSequence!==1 && /^sfx_scatter_stop_[1-5]$/.test(name))continue;
  if(!Object.hasOwn(audio.sprite,name)||!value||(!Object.hasOwn(audio.sprite,value.source)&&!Object.hasOwn(library,value.source)))throw Error(`Unknown cue or source: ${name}`);
  const duration=library[value.source]?.duration??audio.sprite[value.source][1];
  const start=number(value.start,0,duration-1,`${name} start`);
  settings.cues[name]={source:value.source,volume:number(value.volume,0,1,`${name} volume`),start,end:number(value.end,start+1,duration,`${name} end`)};
 }
 const summary=settings.cues.sfx_youwon_panel;
 for(const key of ['leadIn','duck','returnFade'])settings.ending[key]=number(input.ending[key],0,30000,key);
 // Summary length follows the chosen/trimmed clip, never an unrelated timer.
 settings.ending.summary=summary.end-summary.start;
 settings.ending.returnOverlap=number(input.ending.returnOverlap,0,settings.ending.summary,'Return overlap');
 if(settings.ending.returnFade>settings.ending.returnOverlap)throw Error('Base fade-in must fit inside the return overlap.');
 return settings;
}
export function configuredAudio(audio,settings,library={}){
 const result={...audio,sprite:{...audio.sprite},config:{...audio.config}};
 for(const [name,cue] of Object.entries(settings.cues)){
  result.sprite[name]=[(library[cue.source]?0:audio.sprite[cue.source][0])+cue.start,cue.end-cue.start,!!audio.sprite[name][2]];
  result.config[name]={volume:cue.volume};
 }
 return result;
}

export function recordingSources(settings,library){
 return Object.fromEntries(Object.entries(settings.cues).filter(([,cue])=>Object.hasOwn(library,cue.source)).map(([name,cue])=>[name,library[cue.source].src]));
}
