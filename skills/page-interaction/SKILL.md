---
name: page-interaction
description: How to interact with page elements in Playwright tests — clicking, typing, selecting, hovering, keyboard actions, and more. Covers MCP tools for live exploration and Playwright's auto-waiting behavior. Use when implementing actions in POMs or exploring pages.
---

# Page Interaction

## When to Use

- Implementing actions in Page Object Model methods
- Filling forms, clicking buttons, navigating between pages
- Using MCP tools to explore and prototype interactions
- Handling special interactions (file uploads, dialogs, iframes)

## Instructions

### 1. Core Interaction Methods

All interactions are performed on Locators. Playwright **auto-waits** for the element to be actionable (visible, enabled, stable) before performing the action.

```typescript
// Click
await page.getByRole("button", { name: "Search" }).click();

// Fill a text field (clears existing content first)
await page.getByRole("searchbox").fill("TypeScript");

// Type character by character (useful for auto-complete triggers)
await page.getByRole("searchbox").pressSequentially("Type", { delay: 100 });

// Select from dropdown
await page.getByRole("combobox").selectOption("en");
await page.getByRole("combobox").selectOption({ label: "English" });

// Check / uncheck
await page.getByRole("checkbox", { name: "Remember me" }).check();
await page.getByRole("checkbox", { name: "Agree" }).uncheck();

// Hover
await page.getByRole("link", { name: "More" }).hover();

// Press keyboard key
await page.getByRole("searchbox").press("Enter");

// Clear a field
await page.getByRole("searchbox").clear();

// Focus
await page.getByRole("searchbox").focus();
```

### 2. Auto-Waiting Behavior

Playwright automatically waits for these conditions before acting:

| Action           | Waits for                                 |
| ---------------- | ----------------------------------------- |
| `click()`        | Visible, stable, receives events, enabled |
| `fill()`         | Visible, enabled, editable                |
| `check()`        | Visible, stable, enabled                  |
| `selectOption()` | Visible, enabled                          |
| `hover()`        | Visible, stable                           |
| `press()`        | Focused                                   |

**You do not need to add manual waits before interactions.** If an element isn't ready, Playwright waits automatically up to the configured timeout.

### 3. Navigation After Interactions

When a click triggers navigation:

```typescript
// Option A: Assert the new URL (web-first — auto-waits)
await page.getByRole("link", { name: "English" }).click();
await expect(page).toHaveURL(/en\.wikipedia\.org/);

// Option B: Wait for navigation explicitly (rarely needed)
await Promise.all([
  page.waitForURL("**/wiki/**"),
  page.getByRole("link", { name: "Article" }).click(),
]);
```

Prefer Option A — let web-first assertions handle the waiting.

### 4. Interactions in POM Classes

Page Object classes should expose **action methods** that encapsulate interactions:

```typescript
export class WikipediaHomePage {
  readonly page: Page;
  readonly searchInput: Locator;
  readonly searchButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.searchInput = page.getByRole("searchbox", {
      name: "Search Wikipedia",
    });
    this.searchButton = page.getByRole("button", { name: "Search" });
  }

  async search(query: string) {
    await this.searchInput.fill(query);
    await this.searchButton.click();
  }
}
```

**Rules for POM action methods**:

- Name them as user actions: `search()`, `login()`, `selectLanguage()`
- Don't include assertions — assertions stay in test files
- Return `void` or the next POM when navigation occurs:
  ```typescript
  async search(query: string): Promise<SearchResultsPage> {
    await this.searchInput.fill(query);
    await this.searchButton.click();
    return new SearchResultsPage(this.page);
  }
  ```

### 5. Using MCP Tools for Live Exploration

Before writing POM methods, use MCP tools to discover and test interactions:

| MCP Tool                | Playwright Equivalent                            | Use For                                      |
| ----------------------- | ------------------------------------------------ | -------------------------------------------- |
| `browser_click`         | `locator.click()`                                | Test that a click works on the right element |
| `browser_type`          | `locator.fill()` / `locator.pressSequentially()` | Test text input behavior                     |
| `browser_hover`         | `locator.hover()`                                | Test hover effects, tooltips, dropdowns      |
| `browser_select_option` | `locator.selectOption()`                         | Test dropdowns                               |
| `browser_press_key`     | `page.keyboard.press()`                          | Test keyboard shortcuts                      |

**Workflow**:

1. `browser_snapshot` → find the element in the accessibility tree
2. `browser_click` / `browser_type` → test the interaction
3. `browser_snapshot` again → verify the page updated correctly
4. Translate to Playwright POM code

### 6. Special Interactions

#### Dialogs (alert, confirm, prompt)

```typescript
// Set up the handler BEFORE triggering the dialog
page.on("dialog", async (dialog) => {
  expect(dialog.message()).toContain("Are you sure?");
  await dialog.accept();
});
await page.getByRole("button", { name: "Delete" }).click();
```

#### File Uploads

```typescript
await page
  .getByRole("button", { name: "Upload" })
  .setInputFiles("path/to/file.pdf");
```

#### Iframes

```typescript
const frame = page.frameLocator("#content-iframe");
await frame.getByRole("button", { name: "Submit" }).click();
```

#### Double-click and Right-click

```typescript
await locator.dblclick();
await locator.click({ button: "right" });
```

### 7. Force and No-Wait Options

In rare cases when auto-waiting blocks incorrectly:

```typescript
// Force click (bypasses actionability checks) — use sparingly
await locator.click({ force: true });

// Disable waiting for animations to complete
await locator.click({ noWaitAfter: true });
```

**These are escape hatches, not defaults.** If you need `force: true`, investigate why the element isn't actionable first.

## Anti-Patterns

- ❌ **`page.waitForTimeout()` before interactions**: Playwright auto-waits. Remove the manual wait.
- ❌ **Using `page.evaluate()` for clicks**: `page.evaluate(() => document.querySelector('.btn').click())` — bypasses Playwright's actionability checks and auto-waiting.
- ❌ **Putting assertions in POM action methods**: Assertions belong in test files.
- ❌ **Using `force: true` as a default**: Investigate the root cause instead.
- ❌ **Chaining `.then()` on interactions**: Use `async`/`await`.

## References

- Playwright actions docs: https://playwright.dev/docs/input
- Element location skill: `skills/element-location/SKILL.md` — how to build locators for interactions
- DOM inspection skill: `skills/dom-inspection/SKILL.md` — how to verify state after interactions
- Test-authoring skill: `skills/test-authoring/SKILL.md` — where to put interaction code (POM vs test)
