import { setupServer } from 'msw/node';

import { cloneHandlers } from './handlers/clones';
import { contentHandlers } from './handlers/content';
import { methodologyHandlers } from './handlers/methodology';
import { providerHandlers } from './handlers/providers';

export const handlers = [
  ...cloneHandlers,
  ...contentHandlers,
  ...providerHandlers,
  ...methodologyHandlers,
];

export const server = setupServer(...handlers);
