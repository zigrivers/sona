import { setupServer } from 'msw/node';

import { cloneHandlers } from './handlers/clones';
import { contentHandlers } from './handlers/content';
import { dataHandlers } from './handlers/data';
import { methodologyHandlers } from './handlers/methodology';
import { providerHandlers } from './handlers/providers';

export const handlers = [
  ...cloneHandlers,
  ...contentHandlers,
  ...dataHandlers,
  ...providerHandlers,
  ...methodologyHandlers,
];

export const server = setupServer(...handlers);
