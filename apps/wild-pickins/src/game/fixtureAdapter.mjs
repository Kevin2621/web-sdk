// Local C01 base-book adapter. Bonus and live RGS playback remain separate work.
export const textureNames = Object.freeze({ C01:'H1', C02:'H2', C03:'H3', C04:'H4', C05:'L1', C06:'L2', C07:'L3', C08:'L4', W:'W', S:'S' });
const check = (ok, message) => { if (!ok) throw new Error(`Wild Pickins fixture: ${message}`); };
const equal = (a,b) => JSON.stringify(a) === JSON.stringify(b);
export const mapSymbol = (name) => { check(Object.hasOwn(textureNames,name),'unknown symbol'); return {name:textureNames[name]}; };
export const mapPaddedBoard = (board) => board.map(reel=>reel.map(s=>mapSymbol(s.name)));
export const mapVisibleBoard = (board) => board.map(reel=>[mapSymbol('C08'),...reel.map(mapSymbol),mapSymbol('C08')]);

export function validateBaseFixture(book) {
 check(book.fixtureOnly===true && book.schemaVersion===1 && book.gameId==='wild_pickins','unsupported book');
 check(book.lineSetId==='WP-L20-draft1' || book.lineSetId==='WP-L10-draft1','line version');
 const events=book.events; check(Array.isArray(events) && events.length>0,'empty book');
 let board, target, result, stage='reveal', picked=false, info=false, win=false, total=false;
 for (const [i,e] of events.entries()) {
  check(e.index===i && e.spinId===0,'index/spin');
  switch(e.type) {
   case 'reveal':
    check(stage==='reveal' && e.gameType==='basegame' && e.stickyBefore.length===0,'base reveal');
    check(e.board.length===5 && e.board.every(r=>r.length===5),'padding');
    mapPaddedBoard(e.board);
    board=e.board.map(r=>r.slice(1,4).map(s=>s.name));
    check(equal(board,e.underlyingBoard),'underlying mismatch');
    target=e.goldenTarget;
    if(target!==null) {
     check(Number.isInteger(target.reel)&&target.reel>=0&&target.reel<5&&Number.isInteger(target.row)&&target.row>=0&&target.row<3,'target bounds');
     check(board[target.reel][target.row].startsWith('C'),'target eligibility');
    }
    stage='pickOrResult'; break;
   case 'goldenCropPick':
    check(stage==='pickOrResult' && target!==null && !picked,'unexpected pick');
    check(equal(e.target,target) && e.expectedCrop===board[target.reel][target.row] && e.result==='W' && e.persistent===false,'pick payload');
    board[target.reel][target.row]='W'; check(equal(board,e.visibleAfterPick),'post-pick board'); picked=true; break;
   case 'wildPickinsSpinResult':
    check(stage==='pickOrResult' && picked===(target!==null),'missing pick');
    check(equal(board,e.finalBoard) && e.stickyAfter.length===0,'result board');
    for(const key of ['lineWin','harvestTopUp','spinWin','bonusTotal','roundTotal']) check(Number.isSafeInteger(e[key])&&e[key]>=0,'amount');
    check(e.harvestTopUp===0 && e.bonusTotal===0 && e.lineWin===e.spinWin && e.spinWin===e.roundTotal && e.roundTotal<=book.roundCap,'totals');
    for(const key of ['remaining','totalGranted','completedBonusSpins','nominalCollisionAward','nominalRetriggerAward','grantedExtraSpins']) check(e[key]===0,'bonus unsupported');
    check(e.scatterPositions.length<3 && e.collisionPositions.length===0,'feature unsupported');
    result=e; stage='presentation'; break;
   case 'winInfo':
    check(stage==='presentation'&&!info&&!win&&!total,'win info order');
    check(e.totalWin===result.lineWin && e.wins.reduce((sum,w)=>sum+w.win,0)===result.lineWin,'line sum');
    for(const w of e.wins) { mapSymbol(w.symbol); check(Number.isSafeInteger(w.win)&&w.win>=0,'line amount'); for(const p of w.positions) check(Number.isInteger(p.reel)&&p.reel>=0&&p.reel<5&&Number.isInteger(p.row)&&p.row>=1&&p.row<=3,'win coordinates'); }
    info=true; break;
   case 'setWin': check(stage==='presentation'&&!win&&!total&&e.amount===result.spinWin&&e.amount>0,'setWin'); win=true; break;
   case 'setTotalWin': check(stage==='presentation'&&!total&&e.amount===result.roundTotal&&win===(result.spinWin>0),'setTotalWin'); total=true; break;
   case 'finalWin': check(stage==='presentation'&&total&&e.amount===result.roundTotal&&i===events.length-1,'finalWin'); stage='done'; break;
   default: throw new Error(`Wild Pickins fixture: unsupported event ${e.type}`);
  }
 }
 check(stage==='done','incomplete book');
 return book;
}
