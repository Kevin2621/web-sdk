# Baked letter artwork

Transparent PNGs for A, K, Q, J and 10. These include the painted face, wooden rim, connected extrusion, and soft shadow. The game renders one sprite per letter. Win animations, dimming and spin blur remain on the parent symbol.

## Regenerate

From the workspace root:

```sh
pnpm --filter wild-pickins render:letters
```

Requires Node 22.16+ and the app's development dependencies. No browser or game server is needed.

- `src/game/symbolAppearance.ts`: committed defaults, palette, font and layout.
- `src/game/letterRendering.mjs`: shared material styles and extrusion offsets, also used by the live workshop.
- `scripts/render-letters.mjs`: uses Pixi's CanvasTextSystem with a native canvas adapter to bake the layers. Native rasterization can have minor antialiasing differences from browser canvas.
- `src/game/bakedLetterBounds.json`: generated face dimensions and anchors. Padding and shadows are excluded from face normalization, preserving the live renderer's placement.

The export uses a 768px face metric height, plus transparent padding and shadow space; total image height is 921px. `preview.png` is a comparison sheet, not a runtime asset. The exporter validates transparent edges to catch clipping.

The offline exporter supports the selected Luckiest Guy font and bakes shadow strength and softness into the PNG. Tilt is applied to the sprite at runtime (currently 3 degrees clockwise). It rejects unsupported settings instead of silently generating mismatched artwork. Browser-local workshop changes must be copied into the committed appearance defaults before regenerating. The dev panel's live editing mode is opt-in and resets on reload; production always uses sprites.

Luckiest Guy's license is included in `../fonts/luckiest-guy/LICENSE.txt`.
