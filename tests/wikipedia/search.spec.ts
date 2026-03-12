import { WikipediaArticlePage } from "../../pages/wikipedia-article.page";
import { expect, test } from "../fixtures/base.fixture";

test.describe("Wikipedia Search", () => {
  test("should navigate to article page when searching for a known topic", async ({
    homePage,
  }) => {
    const articlePage = new WikipediaArticlePage(homePage.page);

    await test.step("search for Albert Einstein", async () => {
      await homePage.search("Albert Einstein");
    });

    await test.step("verify URL resolves to the Albert Einstein article", async () => {
      await expect(homePage.page).toHaveURL(/\/wiki\/Albert_Einstein/);
    });

    await test.step("verify the article heading is visible", async () => {
      await expect(articlePage.heading).toBeVisible();
      await expect(articlePage.heading).toHaveText(/Albert Einstein/);
    });
  });
});
