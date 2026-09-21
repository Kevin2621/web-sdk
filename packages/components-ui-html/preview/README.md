# Reusable slot control bar

From this directory run `pnpm exec vite --config vite.config.js` for the interactive preview.

Import `SlotControlBar` from `components-ui-html` in any Svelte game. Bind `amount`, `speed`, and `auto`; supply `amounts` from the game's allowed wager list. Supply `spinning` and `win` from actual round state. `win` is shown only when positive and not spinning. Clear the previous win when a new round starts.

Callbacks: `onspin()`, `onbonus()`, `onmenu()`, `onamountchange(amount)`, `onspeedchange(speed)`, and `onautochange(enabled)`. The host owns all game logic, bonus dialogs, settings, autoplay scheduling, wallet validation, and round settlement. `disabled` locks play actions; active autoplay can still be stopped. Bet changes and bonus are locked during a spin or autoplay.

`formatAmount(value)` customizes currency/locale formatting. CSS properties `--control-ink`, `--control-panel`, and `--control-surface` are reserved for game themes. No game assets or backend dependencies are required.

The preview uses deterministic sample wins and placeholder menu/bonus dialogs; it does not place wagers.

## Wild Pickins integration

`apps/wild-pickins/src/components/PlayerControls.svelte` adapts the shared bar to the live actor and generated playtest. It keeps the existing autoplay count picker and loop, wager restrictions, sound persistence, translated labels, money formatter, and paytable. Positive `winUpdate` events are converted with the wagered stake and displayed after the game becomes idle.

Additional host options: `spinDisabled`, `bonusDisabled`, `speedDisabled`, `showAuto`, `stopQueued`, `autoCount`, `speedText`, and `label(key)`. When an amount/speed/auto callback is supplied, the callback owns the state update. During autoplay, `onspin` should request a stop; the bar shows a stop icon.

Bonus opens the existing SDK purchase dialog in live play; generated playtests disable it. Wild Pickins passes its configured mode keys to `Modals` through `bonusModes` to exclude unrelated template features.

The compact layout includes optional `balance` and `balanceNote` readouts inside the left side of the bar. The desktop bar is 82px high, with flat rectangular controls, an outlined yellow bonus button, and an overlapping 136px spin button. Compact screens use a two-row layout.
