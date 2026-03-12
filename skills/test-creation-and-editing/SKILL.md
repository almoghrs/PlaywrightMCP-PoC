---
name: test-creation-and-editing
description: How to create and edit E2E tests. Covers the mandatory MCP-first browser exploration workflow, translating accessibility tree output into Playwright locators, Page Object Model structure, test file templates, fixtures, and naming conventions. Use when creating or modifying test specs, POMs, or fixtures.
---

# Test Creation and Editing

## When to Use

- Creating a new test spec file or adding a new test case
- Creating or modifying a Page Object Model class
- Adding or extending a test fixture
- Editing an existing test to fix, improve, or add coverage

---

## 1. The MCP-First Mandate

> **You MUST use Playwright MCP to explore the live page before writing any code.**

This is non-negotiable. Writing tests without first observing the real browser leads to wrong locators, missed states, and flaky tests. The live browser is your source of truth.

### The Required Workflow

**Step 1 — Open the browser**
Use `browser_navigate` to open the target URL in the live browser.

**Step 2 — Take a snapshot**
Use `browser_snapshot` to get the accessibility tree. This reveals every element's role, name, and structure — exactly how Playwright sees the page.

**Step 3 — Perform the actual flow**
Use the MCP interaction tools to perform every action the test will need to cover:

- `browser_click` to click buttons, links, and interactive elements
- `browser_type` to type into inputs
- `browser_select_option` to select from dropdowns
- `browser_hover` to trigger hover states
- `browser_press_key` to send keyboard events

Take another `browser_snapshot` after each significant interaction to observe what actually changes on the page.

**Step 4 — Understand the full flow**
Only after you have personally walked through the entire user journey in the live browser should you begin writing code. You should know:

- The exact accessible names of every element you'll interact with
- What changes on the page after each action (URL, text, visibility, etc.)
- Any edge cases, loading states, or dynamic content you need to account for

**Step 5 — Write the code**
Now write the POM class, fixture, and test spec using the patterns in this skill. Every locator you write should come directly from what you observed in the accessibility tree.

```
browser_navigate → browser_snapshot → interact live → observe results
→ understand the full flow → THEN write POM + test
```

> **Never skip steps 1–4.** Even if you think you know the page, always verify with a fresh live snapshot before coding.

---

## 2. Translating Accessibility Tree Snapshots to Locators

`browser_snapshot` returns an accessibility tree. Every entry maps directly to a Playwright locator.

### Reading the Tree

```
- banner:
  - heading "Wikipedia" [level=1]
  - navigation "Personal tools":
    - link "Log in"
    - link "Create account"
- main:
  - searchbox "Search Wikipedia"
  - button "Search"
  - heading "Welcome to Wikipedia" [level=2]
  - link "English — 6,897,000+ articles"
```

| Tree Entry                      | Playwright Locator                                           |
| ------------------------------- | ------------------------------------------------------------ |
| `heading "Wikipedia" [level=1]` | `page.getByRole('heading', { name: 'Wikipedia', level: 1 })` |
| `searchbox "Search Wikipedia"`  | `page.getByRole('searchbox', { name: 'Search Wikipedia' })`  |
| `button "Search"`               | `page.getByRole('button', { name: 'Search' })`               |
| `link "Log in"`                 | `page.getByRole('link', { name: 'Log in' })`                 |
| `navigation "Personal tools"`   | `page.getByRole('navigation', { name: 'Personal tools' })`   |

### Locator Priority Order

Always use the **most user-facing** locator available. This order is mandatory:

| Priority | Method               | When to use                                        |
| -------- | -------------------- | -------------------------------------------------- |
| 1        | `getByRole()`        | Element has a semantic role + accessible name      |
| 2        | `getByTestId()`      | Element has `data-testid` attribute                |
| 3        | `getByText()`        | Unique visible text content                        |
| 4        | `getByLabel()`       | Form field with an associated label                |
| 5        | `getByPlaceholder()` | Input with placeholder text                        |
| 6        | `locator()` (CSS)    | No semantic locator works                          |
| 7        | XPath                | **Absolute last resort** — document the reason why |

### Narrowing Ambiguous Locators

When a locator matches more than one element, narrow it down:

```typescript
// Filter by child text
page.getByRole("listitem").filter({ hasText: "JavaScript" });

// Filter by containing another locator
page
  .getByRole("listitem")
  .filter({ has: page.getByRole("link", { name: "Edit" }) });

// Chain for descendants
page.getByRole("navigation").locator("a.active");

// Index as last resort
page.getByRole("link", { name: "Edit" }).first();
```

---

## 3. File Naming & Placement

| File Type   | Naming Convention     | Location          |
| ----------- | --------------------- | ----------------- |
| Test spec   | `<feature>.spec.ts`   | `tests/<area>/`   |
| Page Object | `<page-name>.page.ts` | `pages/`          |
| Fixture     | `<name>.fixture.ts`   | `tests/fixtures/` |

- Group tests by application area: `tests/wikipedia/`, `tests/search/`, etc.
- One POM class per page (or major page section).
- One fixture file can export multiple related fixtures.

---

## 4. Test File Template

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

**Rules:**

- Always import `test` and `expect` from a fixture file, not from `@playwright/test` directly.
- Use `test.describe()` to group related tests.
- Use `test.step()` for logical sections — these names appear in traces and reports.
- Test name format: `should [expected behavior] when [condition]`.
- One test = one behavior. Multiple assertions are fine if they all validate the same behavior.

### Naming Conventions

| Element         | Convention                | Example                                                 |
| --------------- | ------------------------- | ------------------------------------------------------- |
| `test.describe` | Feature area (Title Case) | `'Wikipedia Homepage Navigation'`                       |
| `test()` name   | `should ... when ...`     | `'should display search results when query is entered'` |
| `test.step()`   | Lowercase action phrase   | `'enter search query and submit'`                       |
| POM class       | PascalCase + Page suffix  | `WikipediaHomePage`                                     |
| POM file        | kebab-case + `.page.ts`   | `wikipedia-home.page.ts`                                |
| Fixture name    | camelCase                 | `homePage`, `searchResults`                             |

---

## 5. Page Object Model (POM)

Every page interaction goes through a POM class. Never put locators directly in test files.

```typescript
// pages/search-results.page.ts
import type { Page, Locator } from "@playwright/test";

export class SearchResultsPage {
  readonly page: Page;
  readonly resultsHeading: Locator;
  readonly resultItems: Locator;
  readonly noResultsMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    // All locators come from what you observed in browser_snapshot
    this.resultsHeading = page.getByRole("heading", { level: 1 });
    this.resultItems = page.getByRole("listitem").filter({ hasText: "result" });
    this.noResultsMessage = page.getByText(
      "There were no results matching the query.",
    );
  }

  async goto(query: string) {
    await this.page.goto(`/w/index.php?search=${encodeURIComponent(query)}`);
  }
}
```

**POM rules:**

- All locators are `readonly` properties set in the constructor.
- Locators must come from an actual `browser_snapshot` — not guessed.
- Navigation methods (`goto`, `search`, etc.) live on the POM.
- The POM **never contains assertions** — assertions live in test files only.
- Accept `Page` in the constructor.

---

## 6. Creating or Extending Fixtures

Fixtures are the correct way to share setup across tests. See `skills/state-management/SKILL.md` for complete fixture patterns, scopes, and auth session management.

Quick reference — adding a POM fixture to the base fixture file:

```typescript
// tests/fixtures/base.fixture.ts
import { test as base } from "@playwright/test";
import { WikipediaHomePage } from "../../pages/wikipedia-home.page";

type Fixtures = {
  homePage: WikipediaHomePage;
};

export const test = base.extend<Fixtures>({
  homePage: async ({ page }, use) => {
    const homePage = new WikipediaHomePage(page);
    await homePage.goto();
    await use(homePage);
    // Optional teardown after use()
  },
});

export { expect } from "@playwright/test";
```

**Rules:**

- Only navigate in the fixture if every test using it starts from the same page.
- If tests need different starting states, let each test navigate itself.
- Use `{ scope: 'test' }` (the default) for test isolation.

---

## 7. Editing Existing Tests

When modifying a test or POM:

1. **Re-run the MCP workflow first** — re-open the browser, take a fresh `browser_snapshot`, and re-walk the flow to confirm the current page structure. The live page may have changed since the test was written.
2. **Only change what the task requires** — do not refactor surrounding code or rename things unrelated to your task.
3. **Update the POM, not the test** — if a locator changed, fix it in the POM class. The test file should not contain raw locators.
4. **Run the tests** after editing to confirm nothing is broken: `npx playwright test`.

---

## Anti-Patterns

- ❌ Writing a test without first exploring the page live via MCP
- ❌ Guessing locator names instead of reading them from `browser_snapshot`
- ❌ Putting locators directly in test files instead of POM classes
- ❌ Importing `test` from `@playwright/test` instead of from a fixture file
- ❌ Creating a POM that contains `expect()` assertions
- ❌ Using `test.beforeEach()` for setup that should be a fixture
- ❌ Using `page.waitForTimeout()` — use web-first assertions instead
- ❌ Using XPath without documenting why no other strategy worked

---

## References

- Example test: `tests/wikipedia/homepage-navigation.spec.ts`
- Example POM: `pages/wikipedia-home.page.ts`
- Example fixture: `tests/fixtures/base.fixture.ts`
- Assertions: `skills/assertion-building/SKILL.md`
- Fixtures & state: `skills/state-management/SKILL.md`
