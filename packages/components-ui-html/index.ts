import Modals from './src/components/Modals.svelte';
import GameVersion from './src/components/GameVersion.svelte';
import GlobalStyle from './src/components/GlobalStyle.svelte';

import messagesMap from './src/i18n/messagesMap';
import { i18nDerived } from './src/i18n/i18nDerived';

export * from './src/types';

export { messagesMap, i18nDerived, Modals, GameVersion, GlobalStyle };

// Additive Wild Pickins control surfaces; existing template modals remain available.
export { default as PlayerControlsSurface } from './src/components/PlayerControlsSurface.svelte';
export { default as SlotControlBar } from './src/components/SlotControlBar.svelte';
export { default as BonusPurchaseDialog } from './src/components/BonusPurchaseDialog.svelte';
export { default as ModalError } from './src/components/ModalError.svelte';
export { default as ModalAutoSpinMessage } from './src/components/ModalAutoSpinMessage.svelte';
export { registerDismissiblePopup } from './src/components/popupDismissal';
export type { BonusPurchaseContent } from './src/components/BonusPurchaseDialog.types';
export type { PlayerControlsSurfaceProps } from './src/components/PlayerControlsSurface.types';
