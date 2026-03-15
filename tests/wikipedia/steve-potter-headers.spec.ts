import { WikipediaArticlePage } from "../../pages/wikipedia-article.page";
import { expect, test } from "../fixtures/base.fixture";

test.describe("Wikipedia Steve Potter article headers", () => {
  test("should have 2 top-level section headers on Steve Potter page", async ({
    homePage,
  }) => {
    const articlePage = new WikipediaArticlePage(homePage.page);

    await test.step("navigate to Steve Potter article", async () => {
      await articlePage.goto("Steve_Potter");
    });

    await test.step("verify article heading is visible", async () => {
      await expect(articlePage.heading).toBeVisible();
      await expect(articlePage.heading).toHaveText("Steve Potter");
    });

    await test.step("verify number of top-level section headers", async () => {
      const count = await articlePage.getSectionHeaderCount();
      expect(count).toBe(2);
    });
  });
});
