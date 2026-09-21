import config from './localMathConfig.json' with {type:'json'};
export const profiles={natural:{label:'Current game (unweighted)',hash:null},reference:{label:'Optimized reference · 96.7% RTP',hash:'d9be36cc8c295ea75c9589f11cf919f9a11d0597a2870da13827a7d46a896de0'},'quieter-base':{label:'Optimized quieter base · 96.7% RTP',hash:'dbf9181a1bbba7c68b922796c61002fc30d8f328f208eee99826cf590e3f4c72'}};
const types=new Set(['reveal','goldenCropPick','wildPickinsSpinResult','winInfo','setWin','setTotalWin','freeSpinTrigger','freeSpinEnd','finalWin']);
// Local Python validates full rule math. This checks transport and playback compatibility;
// it is deliberately not a replacement RGS/browser mathematical validator.
export async function validateGeneratedResponse(response) {
 const profile=response?.profile??'natural';
 if(!Object.hasOwn(profiles,profile)||profiles[profile].hash!==(response.lookupSha256??null))throw Error('Weighted profile mismatch');
 if(response?.protocol!=='wp-local-1'||response.configSha256!==config.configSha256) throw Error('Local math configuration mismatch');
 const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(response.bookJson));
 const hash=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
 if(hash!==response.sha256) throw Error('Generated book integrity mismatch');
 const book=JSON.parse(response.bookJson);
 if(book.gameId!=='wild_pickins'||book.schemaVersion!==2||book.fixtureOnly!==true||book.lineSetId!=='WP-L25-experiment1'||book.roundCap!==500000||book.spinBudget!==30) throw Error('Unsupported generated book');
 if(!book.fixtureMath?.paytable||!book.fixtureMath?.bonusPaytable)throw Error('Separate paytables required');
 if(!Array.isArray(book.events)||!book.events.length) throw Error('Empty generated round');
 let sum=0,final=0;
 for(const [i,e] of book.events.entries()) {
  if(e.index!==i||!types.has(e.type)) throw Error('Unsupported generated event/index');
  if(e.type==='wildPickinsSpinResult') {
   if(!Number.isSafeInteger(e.spinWin)||e.spinWin<0)throw Error('Invalid generated payout');
   sum+=e.spinWin;
   if(e.roundTotal!==sum)throw Error('Generated totals mismatch');
  }
 }
 final=book.events.at(-1);
 if(final.type!=='finalWin'||final.amount!==sum||sum>book.roundCap)throw Error('Generated final total mismatch');
 return book;
}
export async function requestGeneratedRound(seed,roundId,signal,profile='natural') {
 if(!Object.hasOwn(profiles,profile))throw Error('Unknown playtest profile');
 const res=await fetch(`http://127.0.0.1:8025/round?seed=${seed}&id=${roundId}&profile=${encodeURIComponent(profile)}`,{signal});
 if(!res.ok)throw Error(`Local math request failed (${res.status})`);
 const payload=await res.json();
 if(payload.seed!==seed||payload.roundId!==roundId||(payload.profile??'natural')!==profile)throw Error('Generated round identity mismatch');
 return payload;
}
