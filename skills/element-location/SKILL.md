---
name: element-location
description: How to find elements on a page using Playwright's locator strategies in correct priority order. Covers semantic locators, CSS fallbacks, chaining, filtering, and mapping from MCP accessibility tree to Playwright locators. Use when choosing locator strategies or translating snapshots to code.
---

# Element Location

## When to Use

- Choosing how to locate an element in a POM class
- Translating an accessibility tree snapshot into Playwright locators
- Debugging a locator that doesn't find the expected element
- Deciding between `getByRole`, `getByText`, CSS, or other strategies

## Instructions

### 1. Locator Priority Order

Always use the **most user-facing** locator available. This order is mandatory:

| Priority | Method               | Example                                        | When                                          |
| -------- | -------------------- | ---------------------------------------------- | --------------------------------------------- |
| 1        | `getByRole()`        | `page.getByRole('button', { name: 'Search' })` | Element has a semantic role + accessible name |
| 2        | `getByTestId()`      | `page.getByTestId('search-form')`              | Element has `data-testid` attribute           |
| 3        | `getByText()`        | `page.getByText('Welcome to Wikipedia')`       | Unique visible text content                   |
| 4        | `getByLabel()`       | `page.getByLabel('Username')`                  | Form field with associated label              |
| 5        | `getByPlaceholder()` | `page.getByPlaceholder('Search...')`           | Input with placeholder text                   |
| 6        | `locator()` (CSS)    | `page.locator('#mp-upper')`                    | No semantic locator works                     |
| 7        | XPath                | `page.locator('xpath=...')`                    | **Absolute last resort** — document why       |

### 2. Translating Accessibility Tree → Locators

When you run `browser_snapshot` via MCP, you get an accessibility tree like:

```
- heading "Wikipedia" [level=1]
- searchbox "Search Wikipedia"
- button "Search"
- link "English"
  - img "English"
```

Map these directly to Playwright locators:

| Accessibility Tree Entry        | Playwright Locator                                           |
| ------------------------------- | ------------------------------------------------------------ |
| `heading "Wikipedia" [level=1]` | `page.getByRole('heading', { name: 'Wikipedia', level: 1 })` |
| `searchbox "Search Wikipedia"`  | `page.getByRole('searchbox', { name: 'Search Wikipedia' })`  |
| `button "Search"`               | `page.getByRole('button', { name: 'Search' })`               |
| `link "English"`                | `page.getByRole('link', { name: 'English' })`                |

> **This is the key workflow**: snapshot → read tree → write `getByRole()` locators.

### 3. Chaining & Filtering

When a locator matches multiple elements, narrow it down:

```typescript
// Filter by child content
page.getByRole("listitem").filter({ hasText: "JavaScript" });

// Filter by containing another locator
page
  .getByRole("listitem")
  .filter({ has: page.getByRole("link", { name: "Edit" }) });

// Chain with .locator() for descendants
page.getByRole("navigation").locator("a.active");

// Use .first(), .last(), .nth() as a last resort
page.getByRole("link", { name: "Edit" }).first();
```

### 4. Exact vs. Substring Matching

By default, `getByText()` and role `name` do **substring** matching:

```typescript
page.getByText("Wikipedia"); // Matches "Welcome to Wikipedia, the free encyclopedia"
page.getByText("Wikipedia", { exact: true }); // Only matches exactly "Wikipedia"
```

Use `{ exact: true }` when the substring matches too many elements.

### 5. Regex in Locators

For flexible matching:

```typescript
page.getByRole("heading", { name: /welcome/i }); // Case-insensitive
page.getByText(/\d+ results found/); // Pattern matching
```

### 6. Where Locators Live

- **Always** define locators in POM classes (`pages/*.page.ts`), as `readonly` properties.
- **Never** put locators directly in test files.
- Parameterize locators with methods when the target varies:

```typescript
export class SearchResultsPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  resultByTitle(title: string): Locator {
    return this.page.getByRole("link", { name: title });
  }
}
```

## Anti-Patterns

- ❌ **Using CSS when a role locator works**: `page.locator('.mw-search-button')` → use `page.getByRole('button', { name: 'Search' })`
- ❌ **Using XPath**: Almost never necessary with Playwright's locator API
- ❌ **Index-based selection**: `page.locator('li').nth(3)` — fragile, breaks on DOM changes
- ❌ **Deeply nested CSS**: `page.locator('div.container > ul > li:nth-child(2) > a')` — extremely brittle
- ❌ **Relying on auto-generated classes**: `page.locator('.css-1a2b3c')` — changes on every build
- ❌ **`page.$()` or `page.$$()` APIs**: These return ElementHandles, not Locators. Always use `page.locator()` or `page.getBy*()`.

## References

- Playwright locators docs: https://playwright.dev/docs/locators
- Example POM with locators: `pages/wikipedia-home.page.ts`
- DOM Inspection skill: `skills/dom-inspection/SKILL.md` — how to get the accessibility tree
- Agents.md Section 6: Locator Priority table
