---
name: dom-inspection
description: How to inspect and understand the current state of a web page using MCP tools. Covers browser_snapshot for accessibility tree, browser_screenshot for visual verification, and interpreting output to build locators and debug failures.
---

# DOM Inspection

## When to Use

- Exploring an unfamiliar page to discover its structure
- Finding the correct locator for an element
- Debugging why a locator doesn't match
- Verifying the page is in the expected state before writing assertions
- Understanding the accessibility tree output

## Instructions

### 1. Primary Tool: `browser_snapshot`

`browser_snapshot` returns the **accessibility tree** of the current page. This is the most important inspection tool because:

- It shows the page the way Playwright's `getByRole()` sees it
- It reveals element roles, names, levels, and states
- It maps directly to locator strategies (see `skills/element-location/SKILL.md`)

**When to use**: Before writing any locators for a new page. Always snapshot first, then code.

#### Example Output

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
  - paragraph: "the free encyclopedia that anyone can edit."
  - link "English — 6,897,000+ articles"
```

#### How to Read It

| Tree Element | Meaning | Playwright Locator |
|---|---|---|
| `heading "Wikipedia" [level=1]` | `<h1>` with text "Wikipedia" | `getByRole('heading', { name: 'Wikipedia', level: 1 })` |
| `searchbox "Search Wikipedia"` | Input with role=searchbox, accessible name from label | `getByRole('searchbox', { name: 'Search Wikipedia' })` |
| `button "Search"` | Button element with text "Search" | `getByRole('button', { name: 'Search' })` |
| `link "Log in"` | Anchor tag with text "Log in" | `getByRole('link', { name: 'Log in' })` |
| `navigation "Personal tools"` | Nav landmark with label | `getByRole('navigation', { name: 'Personal tools' })` |

### 2. Secondary Tool: `browser_screenshot`

`browser_screenshot` captures a visual image of the page.

**When to use**:
- Verifying layout or visual state that the accessibility tree doesn't convey
- Confirming what the user sees (modal state, error messages, loading states)
- Debugging when the snapshot looks correct but the test still fails

**When NOT to use**:
- As a substitute for `browser_snapshot` — always prefer the accessibility tree for locator discovery
- For assertion building — use Playwright's web-first assertions instead

### 3. Inspection Workflow

Follow this process when exploring a new page:

1. **Navigate** — Use `browser_navigate` to open the target URL
2. **Snapshot** — Use `browser_snapshot` to get the accessibility tree
3. **Identify elements** — Find the roles and names of elements you need
4. **Map to locators** — Translate tree entries to `getByRole()` / `getByText()` calls
5. **Verify** (optional) — Use `browser_screenshot` if you need visual confirmation
6. **Build POM** — Create the Page Object Model class with the discovered locators

### 4. Debugging Failed Locators

When a locator doesn't find the expected element:

1. **Snapshot the current page** — the page might not be in the expected state
2. **Check the accessible name** — it may differ from visible text (e.g., `aria-label` overrides)
3. **Check element visibility** — hidden elements don't appear in the accessibility tree
4. **Look for iframes** — content inside iframes has its own tree
5. **Check for dynamic content** — the element may load after an async operation
6. **Use `browser_screenshot`** — visually confirm what's on screen

### 5. Tips

- **Landmark roles** (`banner`, `main`, `navigation`, `contentinfo`) help you scope locators to specific page regions
- **Nested traversal**: If the same role+name appears multiple times, look at parent landmarks to disambiguate
- The snapshot reflects the **live DOM** — if you interact with the page (click, type), snapshot again to see the updated state
- **Tables**: Look for `table`, `row`, `cell` roles — these map to `getByRole('table')`, `.getByRole('row')`, etc.

## Anti-Patterns

- ❌ **Skipping the snapshot** and guessing at locators based on assumptions
- ❌ **Using `browser_screenshot` as the primary discovery tool** — the accessibility tree is more precise and actionable
- ❌ **Assuming the DOM hasn't changed** after interactions — always re-snapshot after clicks/navigation
- ❌ **Ignoring landmark roles** — these provide the most stable scoping for locators

## References

- MCP tools reference: Agents.md Section 8 (MCP Integration Guide)
- Element location: `skills/element-location/SKILL.md` — how to translate snapshot → locators
- Playwright accessibility docs: https://playwright.dev/docs/accessibility-testing
