import { expect } from '@playwright/test';

import { BasePage } from './BasePage';

export class HomePage extends BasePage {
  readonly url = '/';

  readonly heading = this.page.getByRole('heading', { name: 'Welcome to Sona' });

  async expectLoaded() {
    await expect(this.page).toHaveURL(/\/clones/);
    await expect(this.heading).toBeVisible();
  }
}
