import Modals from './src/components/Modals.svelte';
import GameVersion from './src/components/GameVersion.svelte';
import SlotControlBar from './src/components/SlotControlBar.svelte';
import BonusPurchaseDialog from './src/components/BonusPurchaseDialog.svelte';
import PlayerControlsSurface from './src/components/PlayerControlsSurface.svelte';
export { SlotControlBar, BonusPurchaseDialog, PlayerControlsSurface };
export { registerDismissiblePopup } from './src/components/popupDismissal';
export type { BonusPurchaseContent } from './src/components/BonusPurchaseDialog.types';
export type { PlayerControlsSurfaceProps } from './src/components/PlayerControlsSurface.types';
import GlobalStyle from './src/components/GlobalStyle.svelte';

import messagesMap from './src/i18n/messagesMap';
import { i18nDerived } from './src/i18n/i18nDerived';

export * from './src/types';

export { messagesMap, i18nDerived, Modals, GameVersion, GlobalStyle };
