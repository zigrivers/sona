import { expect } from '@playwright/test';

import { BasePage } from './BasePage';

export class DesignSystemPage extends BasePage {
  readonly url = '/design-system';

  readonly heading = this.page.getByRole('heading', { name: 'Design System', level: 1 });
  readonly darkButton = this.page.getByRole('button', { name: 'Dark' });
  readonly lightButton = this.page.getByRole('button', { name: 'Light' });

  async expectLoaded() {
    await super.expectLoaded();
    await expect(this.heading).toBeVisible();
  }

  async switchTheme(theme: 'Light' | 'Dark' | 'System') {
    await this.page.getByRole('button', { name: theme }).click();
  }
}
