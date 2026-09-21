# Painted wood letters v1

Generated with built-in image_gen using the existing painted-wild.png as the material/style reference. Exact prompts are in prompts.json. Original outputs are preserved without processing.

| Rank | File | Paint target |
| --- | --- | --- |
| 10 | 10.png | Sage #83A66A |
| J | j.png | Cornflower #649AC6 |
| Q | q.png | Lavender #AA83B6 |
| K | k.png | Ochre #D7A34C |
| A | a.png | Barn red #C86656 |

These are standalone RGBA sprites with substantial carved wooden depth, upright orientation and no external cast shadow. Palette values are generation targets, not exact pixel colors.

## Runtime treatment

- Use alpha bounds to normalize size and center the solid artwork; transparent canvas padding varies between outputs.
- Apply the selected 3-degree rotation in code, not to the source files.
- Render a dark tinted duplicate behind the sprite for the cast shadow; start with strength 1 and softness 10. Keep this out of sizing bounds.
- Scale and animate sprites individually. Preserve natural proportions.
- Wood depth, chips and material lighting are baked into these PNGs. Do not add the font renderer's synthetic depth on top.
- Paint and wood are not separate layers. Selective recoloring requires a verified paint-face mask; whole-sprite tinting will also color the wood. Ochre K especially overlaps the wood's hues, so simple hue selection is insufficient.

The existing font preview remains unchanged. These assets are ready for review and subsequent sprite integration, not a layered source-art replacement.
