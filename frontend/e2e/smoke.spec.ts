import { expect, test } from '@playwright/test';

import { DesignSystemPage } from './pages/DesignSystemPage';
import { HomePage } from './pages/HomePage';

test.describe('Smoke tests', () => {
  test('home page loads and shows heading', async ({ page }) => {
    const home = new HomePage(page);
    await home.goto();
    await home.expectLoaded();
  });

  test('design system page loads', async ({ page }) => {
    const designSystem = new DesignSystemPage(page);
    await designSystem.goto();
    await designSystem.expectLoaded();
  });

  test('dark mode toggle works', async ({ page }) => {
    const designSystem = new DesignSystemPage(page);
    await designSystem.goto();
    await designSystem.expectLoaded();

    await designSystem.switchTheme('Dark');
    await expect(page.locator('html')).toHaveClass(/dark/);

    await designSystem.switchTheme('Light');
    await expect(page.locator('html')).not.toHaveClass(/dark/);
  });
});
