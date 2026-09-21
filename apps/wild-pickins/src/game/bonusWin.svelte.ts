// Book-unit bonus subtotal, independent of speed and presentation events.
export const bonusWin = $state({ visible: false, amount: 0, baseAmount: 0 });
export function resetBonusWin(){bonusWin.visible=false;bonusWin.amount=0;bonusWin.baseAmount=0;}
export function startBonusWin(baseAmount=0){
 if(bonusWin.visible)return; // Retriggers keep the running total.
 bonusWin.visible=true;bonusWin.amount=0;bonusWin.baseAmount=baseAmount;
}
export function updateBonusWin(roundTotal:number){
 if(bonusWin.visible)bonusWin.amount=Math.max(0,roundTotal-bonusWin.baseAmount);
}
