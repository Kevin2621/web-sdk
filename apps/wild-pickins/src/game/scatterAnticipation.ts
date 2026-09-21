/** Anticipate every remaining reel after at least two visible scatters land.
 * Reveal reels include one hidden padding symbol at each end.
 */
export function scatterAnticipation(board: readonly (readonly { name: string }[])[], turbo = false): number[] {
 if (turbo) return board.map(() => 0);
 let landed = 0;
 return board.map((reel) => {
  const anticipate = landed >= 2 ? 1 : 0;
  landed += reel.slice(1, -1).filter((symbol) => symbol.name === 'S').length;
  return anticipate;
 });
}
