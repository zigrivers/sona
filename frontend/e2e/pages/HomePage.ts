import { expect } from '@playwright/test';

import { BasePage } from './BasePage';

export class HomePage extends BasePage {
  readonly url = '/';

  readonly heading = this.page.getByRole('heading', { name: 'Sona' });

  async expectLoaded() {
    await super.expectLoaded();
    await expect(this.heading).toBeVisible();
  }
}
