import { symbolStyleDefaults } from './symbolAppearance';
export * from './symbolAppearance';
export const symbolStyle = $state({ ...symbolStyleDefaults, livePreview: false });
