// Consume authoritative grants only; never infer rewards from nominal collisions.
export function extraSpinSound(result) {
 return result.grantedExtraSpins > 0 && !result.endReason ? 'sfx_fs_respins' : null;
}
