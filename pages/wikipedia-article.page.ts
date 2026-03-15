import type { Locator, Page } from "@playwright/test";

export class WikipediaArticlePage {
  readonly page: Page;
  readonly heading: Locator;
  readonly sectionHeadings: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole("heading", { level: 1 });
    this.sectionHeadings = this.page.locator("#mw-content-text").locator("h2");
  }

  async goto(articlePath: string) {
    await this.page.goto(`/wiki/${articlePath}`);
  }

  async getSectionHeaderCount(): Promise<number> {
    return await this.sectionHeadings.count();
  }
}
