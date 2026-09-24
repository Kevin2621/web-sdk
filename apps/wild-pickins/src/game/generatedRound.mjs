import candidateProfiles from './candidateProfiles.json' with {type:'json'};
import config from './localMathConfig.json' with {type:'json'};
export const profiles={natural:{label:'Current game (unweighted)',hash:null},reference:{label:'Optimized reference · 96.7% RTP',hash:'d9be36cc8c295ea75c9589f11cf919f9a11d0597a2870da13827a7d46a896de0'},'quieter-base':{label:'Optimized quieter base · 96.7% RTP',hash:'dbf9181a1bbba7c68b922796c61002fc30d8f328f208eee99826cf590e3f4c72'}};
Object.assign(profiles,candidateProfiles);
export const usesMultiplierRules=profile=>profile==='multiplier-wilds'||Object.hasOwn(candidateProfiles,profile);
const types=new Set(['reveal','goldenCropPick','wildPickinsSpinResult','winInfo','setWin','setTotalWin','freeSpinTrigger','freeSpinEnd','finalWin']);
profiles['multiplier-wilds']={label:'40/60 target · 25% base hits · Picks off',hash:null};
// Local Python validates full rule math. This checks transport and playback compatibility;
// it is deliberately not a replacement RGS/browser mathematical validator.
export async function validateGeneratedResponse(response) {
 const profile=response?.profile??'natural';
 if(!Object.hasOwn(profiles,profile)||profiles[profile].hash!==(response.lookupSha256??null))throw Error('Weighted profile mismatch');
 const multiplied=usesMultiplierRules(profile);
 if(response?.protocol!=='wp-local-1'||response.configSha256!==(multiplied?config.multiplierConfigSha256:config.configSha256)) throw Error('Local math configuration mismatch');
 const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(response.bookJson));
 const hash=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
 if(hash!==response.sha256) throw Error('Generated book integrity mismatch');
 const book=JSON.parse(response.bookJson);
 if(book.gameId!=='wild_pickins'||book.schemaVersion!==(multiplied?4:2)||book.fixtureOnly!==true||book.lineSetId!=='WP-L25-experiment1'||book.roundCap!==500000||book.spinBudget!==30) throw Error('Unsupported generated book');
 if(multiplied&&book.fixtureMath?.settlementPolicy!=='accumulation')throw Error('Accumulation settlement required');
 if(!book.fixtureMath?.paytable||!book.fixtureMath?.bonusPaytable)throw Error('Separate paytables required');
 if(!Array.isArray(book.events)||!book.events.length) throw Error('Empty generated round');
 let sum=0,final=0;
 for(const [i,e] of book.events.entries()) {
  if(e.index!==i||!types.has(e.type)) throw Error('Unsupported generated event/index');
  if(multiplied&&e.endReason==='fullHarvest')throw Error('Unsupported full-board termination');
  if(e.type==='wildPickinsSpinResult') {
   if(multiplied) {
    if(e.harvestTopUp!==0)throw Error('Accumulation cannot award a top-up');
    if(!Number.isSafeInteger(e.lineWin)||e.lineWin<0||!Number.isSafeInteger(e.scatterWin)||e.scatterWin<0||e.spinWin!==e.lineWin+e.scatterWin)throw Error('Accumulation award mismatch');
    if(!Array.isArray(e.wildMultipliers)||!Array.isArray(e.finalBoard))throw Error('Missing Wild multipliers');
    const seen=new Set();
    for(const p of e.wildMultipliers) {
     const key=`${p.reel}:${p.row}`;
     if(!Number.isInteger(p.reel)||p.reel<0||p.reel>4||!Number.isInteger(p.row)||p.row<0||p.row>2||![1,2,3].includes(p.multiplier)||seen.has(key)||e.finalBoard[p.reel]?.[p.row]!=='W')throw Error('Invalid Wild multiplier');
     seen.add(key);
    }
    for(const [r,reel] of e.finalBoard.entries())for(const [y,s] of reel.entries())if(s==='W'&&!seen.has(`${r}:${y}`))throw Error('Missing Wild value');
   }
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
