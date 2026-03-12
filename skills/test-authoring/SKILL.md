---
name: test-authoring
description: How to create new E2E test files, structure them correctly, extend fixtures, and build Page Object Model classes. Use when creating test specs, adding test cases, creating POMs, or extending fixtures.
---

# Test Authoring

## When to Use

- Creating a new test spec file
- Adding a new `test.describe` block or `test()` case
- Creating a new Page Object Model class
- Adding or extending a test fixture
- Deciding on file naming and folder placement

## Instructions

### 1. File Naming & Placement

| File Type   | Naming Convention     | Location          |
| ----------- | --------------------- | ----------------- |
| Test spec   | `<feature>.spec.ts`   | `tests/<area>/`   |
| Page Object | `<page-name>.page.ts` | `pages/`          |
| Fixture     | `<name>.fixture.ts`   | `tests/fixtures/` |

- Group tests by application area: `tests/wikipedia/`, `tests/search/`, etc.
- One POM class per page (or major page section).
- One fixture file can export multiple fixtures if they're related.

### 2. Test File Template

Every test file follows this structure:

```typescript
import { test, expect } from "../fixtures/base.fixture";

test.describe("Feature Area", () => {
  test("should [expected behavior] when [condition]", async ({
    fixtureName,
  }) => {
    await test.step("describe what this step does", async () => {
      // Arrange / Act
    });

    await test.step("verify the result", async () => {
      // Assert
      await expect(fixtureName.someLocator).toBeVisible();
    });
  });
});
```

**Key rules**:

- Always import `test` and `expect` from a fixture file, not from `@playwright/test` directly.
- Use `test.describe()` to group related tests.
- Use `test.step()` for logical sections — these appear in traces and reports.
- Test name format: `should [expected behavior] when [condition]`.

### 3. Creating a Page Object Model (POM)

When you need to interact with a new page:

```typescript
import type { Page, Locator } from "@playwright/test";

export class SearchResultsPage {
  readonly page: Page;
  readonly resultHeading: Locator;
  readonly resultList: Locator;
  readonly noResultsMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.resultHeading = page.getByRole("heading", { level: 1 });
    this.resultList = page
      .getByRole("list")
      .filter({ hasText: "search results" });
    this.noResultsMessage = page.getByText(
      "There were no results matching the query.",
    );
  }

  async goto(query: string) {
    await this.page.goto(`/w/index.php?search=${encodeURIComponent(query)}`);
  }
}
```

**POM rules**:

- All locators are `readonly` properties set in the constructor.
- Navigation methods (`goto`, `navigateToSection`) live on the POM.
- The POM **never contains assertions** — assertions live in test files only.
- Use semantic locators (`getByRole`, `getByText`) — see `skills/element-location/SKILL.md`.
- Accept `Page` in the constructor, not `BrowserContext` or `Browser`.

### 4. Creating or Extending Fixtures

To add a new fixture for a POM:

```typescript
// tests/fixtures/base.fixture.ts
import { test as base } from "@playwright/test";
import { WikipediaHomePage } from "../../pages/wikipedia-home.page";
import { SearchResultsPage } from "../../pages/search-results.page";

type Fixtures = {
  homePage: WikipediaHomePage;
  searchResults: SearchResultsPage; // ← add new fixture type
};

export const test = base.extend<Fixtures>({
  homePage: async ({ page }, use) => {
    const homePage = new WikipediaHomePage(page);
    await homePage.goto();
    await use(homePage);
  },

  searchResults: async ({ page }, use) => {
    // ← add new fixture
    const searchResults = new SearchResultsPage(page);
    await use(searchResults);
    // no goto() here — tests will navigate as needed
  },
});

export { expect } from "@playwright/test";
```

**Fixture rules**:

- Fixtures handle setup (and optionally teardown, after `use()`).
- Only navigate in the fixture if every test using it starts from the same page.
- If tests need different starting states, let them navigate themselves.
- Use `{ scope: 'test' }` (the default) to keep tests isolated.

### 5. Naming Conventions

| Element         | Convention                | Example                                                 |
| --------------- | ------------------------- | ------------------------------------------------------- |
| `test.describe` | Feature area (Title Case) | `'Wikipedia Homepage Navigation'`                       |
| `test()` name   | `should ... when ...`     | `'should display search results when query is entered'` |
| `test.step()`   | Lowercase action phrase   | `'enter search query and submit'`                       |
| POM class       | PascalCase + Page suffix  | `WikipediaHomePage`                                     |
| POM file        | kebab-case + `.page.ts`   | `wikipedia-home.page.ts`                                |
| Fixture name    | camelCase                 | `homePage`, `searchResults`                             |

## Anti-Patterns

- ❌ Importing `test` from `@playwright/test` instead of from a fixture file
- ❌ Putting locators directly in test files instead of POM classes
- ❌ Writing tests without `test.describe()` grouping
- ❌ Creating a POM that contains `expect()` assertions
- ❌ Using `test.beforeEach()` for setup that should be a fixture
- ❌ Naming tests without the `should ... when ...` pattern

## References

- Example test: `tests/wikipedia/homepage-navigation.spec.ts`
- Example POM: `pages/wikipedia-home.page.ts`
- Example fixture: `tests/fixtures/base.fixture.ts`
- Agents.md Section 6: Playwright Test-Writing Standards
