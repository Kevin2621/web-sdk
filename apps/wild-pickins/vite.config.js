// @ts-ignore
import config from 'config-vite';

import { audioLibraryPlugin } from './scripts/audio-library-plugin.mjs';
const configured = config();
configured.plugins = [...(configured.plugins ?? []), audioLibraryPlugin()];
export default configured;
