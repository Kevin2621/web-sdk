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
 const mode=response?.mode??'base';
 const tier={standard_bonus_buy_medium:{cost:200,spins:15,scatters:4,hash:'mediumBonusHash'},standard_bonus_buy_high:{cost:500,spins:20,scatters:5,hash:'highBonusHash'}}[mode];
 if(!['base','bonus','standard_bonus_buy_medium','standard_bonus_buy_high'].includes(mode)||(mode==='bonus'&&!['multiplier-wilds','candidate-1m-2','candidate-corrected-1m-1'].includes(profile))||(tier&&profile!=='candidate-corrected-1m-1'))throw Error('Unsupported purchase mode');
 if(!Object.hasOwn(profiles,profile))throw Error('Weighted profile mismatch');
 const expectedHash=tier?profiles[profile][tier.hash]:mode==='bonus'&&profiles[profile].bonusHash?profiles[profile].bonusHash:profiles[profile].hash;
 if(expectedHash!==(response.lookupSha256??null))throw Error('Weighted profile mismatch');
 const multiplied=usesMultiplierRules(profile);
 const expectedConfigHash=profiles[profile].configHash??(multiplied?config.multiplierConfigSha256:config.configSha256);
 if(response?.protocol!=='wp-local-1'||response.configSha256!==expectedConfigHash) throw Error('Local math configuration mismatch');
 const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(response.bookJson));
 const hash=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
 if(hash!==response.sha256) throw Error('Generated book integrity mismatch');
 const book=JSON.parse(response.bookJson);
 if(tier) {
  const reveals=book.events?.filter(e=>e.type==='reveal')??[];
  const entries=book.events?.filter(e=>e.type==='freeSpinTrigger')??[];
  if(response.tierId!==mode||response.purchaseCost!==tier.cost||response.initialSpins!==tier.spins||book.entryMode&&book.entryMode!=='base'||reveals[0]?.gameType!=='basegame'||entries.length!==1||entries[0].totalFs!==tier.spins||entries[0].spinId!==0||entries[0].positions?.length!==tier.scatters||entries[0].purchase===true||reveals[0].underlyingBoard?.flat().filter(s=>s==='S').length!==tier.scatters||reveals[1]?.stickyBefore?.length!==0||reveals.slice(1).some(e=>e.gameType!=='freegame'))throw Error('Invalid purchased tier trigger round');
 } else if(mode==='bonus') {
  if(profile==='candidate-corrected-1m-1') {
   const reveals=book.events?.filter(e=>e.type==='reveal')??[];
   const entries=book.events?.filter(e=>e.type==='freeSpinTrigger')??[];
   if(book.entryMode&&book.entryMode!=='base'||reveals[0]?.gameType!=='basegame'||entries.length!==1||entries[0].totalFs!==10||entries[0].spinId!==0||entries[0].positions?.length!==3||entries[0].purchase===true||reveals.slice(1).some(e=>e.gameType!=='freegame'))throw Error('Invalid purchased trigger round');
  } else {
   const entry=book.events?.[0];
   if(book.entryMode!=='standardBonusBuy'||entry?.type!=='freeSpinTrigger'||entry.spinId!==-1||entry.totalFs!==10||entry.purchase!==true||entry.positions?.length!==0)throw Error('Invalid purchased entry');
   if(book.events.some(e=>e.type==='reveal'&&e.gameType!=='freegame')||book.events.filter(e=>e.type==='freeSpinTrigger').length!==1)throw Error('Purchased bonus contains base play');
  }
 } else if(book.entryMode&&book.entryMode!=='base')throw Error('Unexpected purchased entry');
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
export async function requestGeneratedRound(seed,roundId,signal,profile='natural',mode='base') {
 if(!Object.hasOwn(profiles,profile))throw Error('Unknown playtest profile');
 const res=await fetch(`http://127.0.0.1:8025/round?seed=${seed}&id=${roundId}&profile=${encodeURIComponent(profile)}&mode=${encodeURIComponent(mode)}`,{signal});
 if(!res.ok)throw Error(`Local math request failed (${res.status})`);
 const payload=await res.json();
 if(payload.seed!==seed||payload.roundId!==roundId||(payload.profile??'natural')!==profile||(payload.mode??'base')!==mode)throw Error('Generated round identity mismatch');
 return payload;
}
