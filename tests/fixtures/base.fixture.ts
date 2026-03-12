import { test as base } from '@playwright/test';
import { WikipediaHomePage } from '../../pages/wikipedia-home.page';

type Fixtures = {
  homePage: WikipediaHomePage;
};

export const test = base.extend<Fixtures>({
  homePage: async ({ page }, use) => {
    const homePage = new WikipediaHomePage(page);
    await homePage.goto();
    await use(homePage);
  },
});

export { expect } from '@playwright/test';
