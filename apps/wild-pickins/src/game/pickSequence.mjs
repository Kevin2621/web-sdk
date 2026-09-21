// Presentation-only sequence. Abort drops stale work; skip/failure settles the same target.
export async function runPickSequence({ animate=true, signal, frame, commit, clear, wait }) {
 const active=()=>!signal?.aborted;
 try {
  if(animate) {
   for(const [phase,frames] of [['mark',12],['grip',8],['lift',14],['reveal',8]]) {
    for(let i=0;i<frames;i++) {
     if(!active()) return;
     frame(phase,(i+1)/frames);
     await wait(25);
    }
   }
  }
 } finally {
  try { if(active()) commit(); } finally { clear(); }
 }
}
