import { test, expect } from '../fixtures/base.fixture';

test.describe('Wikipedia Homepage Navigation', () => {
  test('should load the Wikipedia homepage successfully', async ({ homePage }) => {
    await test.step('verify page title contains Wikipedia', async () => {
      await expect(homePage.page).toHaveTitle(/Wikipedia/);
    });

    await test.step('verify the main logo is visible', async () => {
      await expect(homePage.mainLogo).toBeVisible();
    });

    await test.step('verify the search input is accessible', async () => {
      await expect(homePage.searchInput).toBeVisible();
      await expect(homePage.searchInput).toBeEnabled();
    });

    await test.step('verify main content area is present', async () => {
      await expect(homePage.mainContent).toBeVisible();
    });
  });
});
