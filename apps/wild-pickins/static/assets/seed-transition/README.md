# Seed transition textures

Derived from `wild-pickins/art/art-refresh/{seeds-cluster,seed1,seed2,seed3}.png`.
Transparent margins were cropped using alpha > 8 bounds, then each image was resized to a maximum dimension of 512 pixels with @napi-rs/canvas. Original artwork is unchanged.

The curtain uses 35 cluster sprites plus 12 individual edge seeds. The click burst adds at most 12 short-lived sprites in the bag canvas. No physics or per-seed filters are used. Curtain renderers exist only during transitions. Shared textures remain in the game's asset cache.
