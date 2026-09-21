// Cancellation belongs to the whole action, not just its current spin.
export function createFixtureBatch(cancelCurrent) {
 let generation=0;
 return {
  cancel() { generation++; cancelCurrent(); },
  async play(items, playOne) {
   const started=generation;
   for(const item of items) {
    if(started!==generation) return;
    await playOne(item);
   }
  }
 };
}
