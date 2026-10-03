import { createAsset } from 'pixi-svelte';

import img from './anticipation.png';
import rawAtlas from './anticipation.atlas?raw';
import spine from './anticipation.json';

export default createAsset({ img, rawAtlas, spine });
