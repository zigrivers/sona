import { setupServer } from 'msw/node';

import { cloneHandlers } from './handlers/clones';
import { contentHandlers } from './handlers/content';
import { dataHandlers } from './handlers/data';
import { dnaHandlers } from './handlers/dna';
import { methodologyHandlers } from './handlers/methodology';
import { presetHandlers } from './handlers/presets';
import { providerHandlers } from './handlers/providers';
import { sampleHandlers } from './handlers/samples';

export const handlers = [
  ...cloneHandlers,
  ...contentHandlers,
  ...dataHandlers,
  ...dnaHandlers,
  ...presetHandlers,
  ...providerHandlers,
  ...methodologyHandlers,
  ...sampleHandlers,
];

export const server = setupServer(...handlers);
