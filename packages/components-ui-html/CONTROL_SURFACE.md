# Slot controls UI boundary

`PlayerControlsSurface` and `BonusPurchaseDialog` are the reusable HTML presentation layer. Their markup and scoped CSS live together in this package. Neither component imports a game, game state, math engine, or audio service.

A game supplies three ports to `PlayerControlsSurface`:

- `view`: read-only values for the bar, autoplay form, and settings panels. The game chooses money formatting, labels, payline and paytable data, speed names, and whether jurisdiction options are available.
- `actions`: callbacks for spin, bet change, speed change, autoplay, bonus purchase, menu controls, settings changes, and UI input handling. The surface calls them; it never broadcasts game events itself.
- `session`: writable dialog references and autoplay form selections shared with the game controller. The surface owns its disclosure/scroll state internally. The game remains responsible for starting/stopping autoplay and applying limits.

`BonusPurchaseDialog` receives a `BonusPurchaseContent` data object for all game-specific copy and images, plus amount, balance, formatting, and purchase callbacks. A game can omit this dialog entirely.

Wild Pickins uses `src/components/PlayerControls.svelte` and `src/components/BonusMenu.svelte` as adapters. Those files contain no control bar or dialog CSS. To add another game, provide its own adapters and content while importing the shared components from `components-ui-html`.

The restored control-surface CSS is protected by `src/components/uiIsolation.test.mjs` in Wild Pickins. Intentional UI changes should update the snapshot hash after visual review. Run `test:ui` and inspect the live browser for hover, disabled spin, autoplay, settings, and bonus dialogs after changing these components.
