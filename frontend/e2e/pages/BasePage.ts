import { type Page, expect } from '@playwright/test';

export abstract class BasePage {
  constructor(readonly page: Page) {}
  abstract readonly url: string;

  async goto() {
    await this.page.goto(this.url);
  }

  async expectLoaded() {
    await expect(this.page).toHaveURL(new RegExp(this.url));
  }
}
