import { main } from 'config-storybook';
import { fileURLToPath } from 'node:url';

const storybookConfig: typeof main = {
 ...main,
 async viteFinal(config) {
  // SvelteKit's dev allow-list omits the source of our linked workspace packages.
  config.server ??= {};
  config.server.fs ??= {};
  config.server.fs.allow = [
   ...(config.server.fs.allow ?? []),
   fileURLToPath(new URL('../../../packages', import.meta.url)),
  ];
  return config;
 },
};

export default storybookConfig;
