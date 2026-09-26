/** Keep the template players while routing optional standalone cue recordings. */
export function routeHowls(primary, overrides) {
 const all=[primary,...new Set(Object.values(overrides))];
 const voices=new Map();
 const route=id=>voices.get(id)??primary;
 const facade={
  play(name){const howl=typeof name==='string'?(overrides[name]??primary):route(name);const id=howl.play(name);voices.set(id,howl);return id;},
  playing(id){return route(id).playing(id);},
  stop(id){if(id===undefined)all.forEach(h=>h.stop());else route(id).stop(id);return facade;},
  pause(id){if(id===undefined)all.forEach(h=>h.pause());else route(id).pause(id);return facade;},
  volume(value,id){if(id===undefined)all.forEach(h=>h.volume(value));else route(id).volume(value,id);return facade;},
  fade(from,to,duration,id){route(id).fade(from,to,duration,id);return facade;},
  rate(value,id){route(id).rate(value,id);return facade;},
  on(event,callback,id){if(id===undefined)all.forEach(h=>h.on(event,callback));else route(id).on(event,callback,id);return facade;},
  unload(){all.forEach(h=>h.unload());voices.clear();},
 };
 return facade;
}
