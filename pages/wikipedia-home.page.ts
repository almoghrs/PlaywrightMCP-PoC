import type { Page, Locator } from '@playwright/test';

export class WikipediaHomePage {
  readonly page: Page;
  readonly searchInput: Locator;
  readonly searchButton: Locator;
  readonly mainLogo: Locator;
  readonly mainContent: Locator;

  constructor(page: Page) {
    this.page = page;
    this.searchInput = page.getByRole('searchbox', { name: 'Search Wikipedia' });
    this.searchButton = page.getByRole('button', { name: 'Search' });
    this.mainLogo = page.locator('.mw-logo');
    this.mainContent = page.locator('#mp-upper');
  }

  async goto() {
    await this.page.goto('/wiki/Main_Page');
  }
}
