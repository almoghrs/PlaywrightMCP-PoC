import { WikipediaArticlePage } from "../../pages/wikipedia-article.page";
import { expect, test } from "../fixtures/base.fixture";

test.describe("Wikipedia Hanukkah article headers", () => {
  test("should have at least 5 top-level section headers on Hanukkah page", async ({
    homePage,
  }) => {
    const articlePage = new WikipediaArticlePage(homePage.page);

    await test.step("navigate to Hanukkah article", async () => {
      await articlePage.goto("Hanukkah");
    });

    await test.step("verify article heading is visible", async () => {
      await expect(articlePage.heading).toBeVisible();
      await expect(articlePage.heading).toHaveText(/Hanukkah|Chanukah/i);
    });

    await test.step("verify number of top-level section headers", async () => {
      const count = await articlePage.getSectionHeaderCount();
      expect(count).toBeGreaterThanOrEqual(5);
    });
  });
});
