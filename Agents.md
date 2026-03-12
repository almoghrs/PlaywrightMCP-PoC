# Agents.md — Master Orchestrator

> **Read this file first.** It is the single source of truth for any AI agent working in this repository.

---

## 1. Project Purpose

This repository is a **Proof of Concept (PoC) and template** for running End-to-End (E2E) tests using:

- **Playwright** — browser automation and test runner
- **TypeScript** — strict, typed test code
- **Model Context Protocol (MCP)** — enabling AI agents to interact with a live browser

The target application is **Wikipedia** (`https://en.wikipedia.org`). The architecture is intentionally simple so it can serve as a starting point for testing any web application.

---

## 2. Repository Map

```
PlaywrightMCP-PoC/
├── Agents.md                          ← You are here
├── skills/                            ← Modular skill definitions (read before acting)
│   ├── test-authoring/SKILL.md        ← How to create test files
│   ├── element-location/SKILL.md      ← How to find elements on a page
│   ├── dom-inspection/SKILL.md        ← How to inspect page state via MCP
│   ├── assertion-building/SKILL.md    ← How to write assertions
│   ├── page-interaction/SKILL.md      ← How to interact with page elements
│   └── state-management/SKILL.md      ← How to manage test state & fixtures
├── tests/
│   ├── fixtures/
│   │   └── base.fixture.ts            ← Base fixtures (homePage, etc.)
│   └── wikipedia/
│       └── homepage-navigation.spec.ts ← Example test — use as reference
├── pages/
│   └── wikipedia-home.page.ts         ← Page Object Model for Wikipedia homepage
├── playwright.config.ts               ← Playwright configuration
├── tsconfig.json                      ← TypeScript configuration
├── package.json                       ← Dependencies and npm scripts
└── README.md                          ← Human-facing project overview
```

---

## 3. Technology Stack

| Technology | Version | Purpose |
|---|---|---|
| Playwright | `^1.52` | Browser automation, test runner, assertions |
| TypeScript | `^5.8` | Typed language for all test code |
| `@playwright/mcp` | `^0.0.28` | MCP server exposing browser tools to agents |
| Node.js | `>=18` | Runtime |
| npm | `>=9` | Package manager |

---

## 4. Agent Behavior Contract

When working in this repository, you **MUST**:

1. **Read this file first** before writing any code.
2. **Read the relevant skill** before performing a task (see [Skill Index](#10-skill-index) below).
3. **Always use the Page Object Model (POM)** — never put locators directly in test files.
4. **Always use fixtures** for shared setup — never duplicate setup code across tests.
5. **Never hardcode selectors** — define them in POM classes in `pages/`.
6. **Run tests after changes** — verify with `npx playwright test` before considering work complete.
7. **Follow the coding standards** in Section 5 and the test-writing standards in Section 6.
8. **Keep tests independent** — each test must work in isolation. No shared mutable state.

You **MUST NOT**:

- Use XPath selectors unless no alternative exists (document the reason).
- Use `page.waitForTimeout()` — use web-first assertions or `locator.waitFor()` instead.
- Use `any` type in TypeScript.
- Skip writing Page Object classes for new pages.
- Modify `playwright.config.ts` without explicit instruction.

---

## 5. Coding Standards

### TypeScript

- **Strict mode** is enabled — respect all type checks.
- **No `any`** — use proper types. Import `Page`, `Locator`, `expect` from `@playwright/test`.
- **No magic strings** — extract URLs, text, and identifiers into POM properties or constants.
- **Use `const` by default** — only `let` when mutation is required.
- **Name files consistently**:
  - Page Objects: `<page-name>.page.ts` in `pages/`
  - Test specs: `<feature>.spec.ts` in `tests/<area>/`
  - Fixtures: `<name>.fixture.ts` in `tests/fixtures/`

### Code Style

- Use descriptive names: `searchInput` not `si`, `homePage` not `hp`.
- One class per file for Page Objects.
- Export only what is needed.
- Prefer `async`/`await` — never use raw Promises with `.then()`.

---

## 6. Playwright Test-Writing Standards

These rules are non-negotiable. They produce reliable, maintainable tests.

### Test Structure

```typescript
import { test, expect } from '../fixtures/base.fixture';

test.describe('Feature Area', () => {
  test('should [expected behavior] when [condition]', async ({ fixtureName }) => {
    await test.step('action description', async () => {
      // Arrange / Act / Assert within a logical step
    });
  });
});
```

### Rules

1. **Use `test.describe()`** to group related tests by feature or page.
2. **Use `test.step()`** to create logical sections within a test for readability and trace output.
3. **One focus per test** — test one behavior. Multiple assertions are fine if they validate the same behavior.
4. **Descriptive test names** — format: `should [expected behavior] when [condition]`.
5. **Use fixtures** — extend `test` in `tests/fixtures/` for shared setup (navigation, POM instantiation).

### Locator Priority (strict order)

Use the **most user-facing** locator available:

| Priority | Method | When to use |
|---|---|---|
| 1 | `getByRole()` | Always prefer — matches how users/assistive tech see the page |
| 2 | `getByTestId()` | When elements have `data-testid` attributes |
| 3 | `getByText()` | For visible text content |
| 4 | `getByLabel()` | For form fields with labels |
| 5 | `getByPlaceholder()` | For inputs with placeholder text |
| 6 | `locator()` (CSS) | When no semantic locator works |
| 7 | XPath | **Last resort only** — document why |

### Assertions

- **Always use web-first assertions** — they auto-wait and auto-retry:
  ```typescript
  await expect(locator).toBeVisible();      // ✅ Auto-waits
  await expect(page).toHaveTitle(/text/);    // ✅ Auto-waits
  ```
- **Never do this**:
  ```typescript
  await page.waitForTimeout(2000);           // ❌ Arbitrary wait
  const el = await page.$('.foo');            // ❌ Not auto-waiting
  expect(el).not.toBeNull();                 // ❌ Not a web-first assertion
  ```

### Page Object Model (POM)

Every page interaction goes through a POM class:

```typescript
// pages/example.page.ts
import type { Page, Locator } from '@playwright/test';

export class ExamplePage {
  readonly page: Page;
  readonly heading: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Example' });
  }

  async goto() {
    await this.page.goto('/example');
  }
}
```

- Locators are `readonly` properties set in the constructor.
- Navigation methods live on the POM (`goto()`, `search()`, etc.).
- The POM never contains assertions — assertions live in test files only.

---

## 7. Error Handling & Debugging

### Configuration (already set in `playwright.config.ts`)

| Setting | Value | Purpose |
|---|---|---|
| `retries` | 1 (local), 2 (CI) | Auto-retry flaky tests |
| `trace` | `on-first-retry` | Capture trace on first retry for debugging |
| `screenshot` | `only-on-failure` | Auto-screenshot when a test fails |
| `video` | `retain-on-failure` | Keep video of failed tests |

### Debugging Workflow

1. **Read the error message** — Playwright errors are descriptive.
2. **Check the trace** — Run `npx playwright show-trace test-results/<test>/trace.zip`.
3. **Use `--debug` mode** — `npm run test:debug` to step through with the Playwright Inspector.
4. **Use `--ui` mode** — `npm run test:ui` for the full Playwright UI with timeline.
5. **Inspect via MCP** — Use `browser_snapshot` to see the accessibility tree at the point of failure.

### When Tests Fail

- **Do not add arbitrary waits** — find the real cause.
- **Check if the locator is correct** — use `browser_snapshot` to verify the accessibility tree.
- **Check if the page loaded** — verify `baseURL` and navigation in the POM.
- **Check test isolation** — ensure the test doesn't depend on another test's state.

---

## 8. MCP Integration Guide

### Starting the MCP Server

```bash
npm run mcp:start
# or directly:
npx @playwright/mcp@latest
```

This starts the official Playwright MCP server, which exposes browser control tools over the Model Context Protocol.

### Available MCP Tools

The `@playwright/mcp` server provides these tools for browser interaction:

| Tool | Purpose |
|---|---|
| `browser_navigate` | Navigate to a URL |
| `browser_snapshot` | Get the accessibility tree of the current page |
| `browser_screenshot` | Take a screenshot of the current page |
| `browser_click` | Click an element (by accessibility ref or coordinates) |
| `browser_type` | Type text into a focused element |
| `browser_hover` | Hover over an element |
| `browser_select_option` | Select an option from a dropdown |
| `browser_press_key` | Press a keyboard key |
| `browser_tab_list` | List open browser tabs |
| `browser_tab_new` | Open a new tab |
| `browser_tab_select` | Switch to a tab |
| `browser_tab_close` | Close a tab |
| `browser_go_back` | Navigate back |
| `browser_go_forward` | Navigate forward |
| `browser_console_messages` | Get console messages |
| `browser_file_upload` | Upload a file to the page |
| `browser_pdf_save` | Save the page as a PDF |

### Agent Workflow with MCP

1. **Navigate** — Use `browser_navigate` to open the target page.
2. **Inspect** — Use `browser_snapshot` to see the accessibility tree. This reveals roles, names, and structure — exactly what Playwright's `getByRole()` and `getByText()` use.
3. **Interact** — Use `browser_click`, `browser_type`, etc. to interact live and explore behavior.
4. **Translate to code** — Convert the discovered locators and interactions into POM classes and test specs using the patterns in this file.

> **Key insight**: The accessibility tree from `browser_snapshot` maps directly to Playwright's user-facing locators. An element shown as `button "Search"` in the tree → `page.getByRole('button', { name: 'Search' })` in code.

---

## 9. npm Scripts Reference

| Script | Command | Purpose |
|---|---|---|
| `npm test` | `npx playwright test` | Run all tests |
| `npm run test:headed` | `npx playwright test --headed` | Run tests with visible browser |
| `npm run test:debug` | `npx playwright test --debug` | Run with Playwright Inspector |
| `npm run test:ui` | `npx playwright test --ui` | Run with Playwright UI mode |
| `npm run report` | `npx playwright show-report` | Open the HTML test report |
| `npm run mcp:start` | `npx @playwright/mcp@latest` | Start the MCP server |

---

## 10. Skill Index

Before performing a task, **read the relevant skill file**. Each skill provides detailed instructions, examples, and anti-patterns.

| Skill | Path | Use When |
|---|---|---|
| **Test Authoring** | `skills/test-authoring/SKILL.md` | Creating new test files, structuring tests, extending fixtures |
| **Element Location** | `skills/element-location/SKILL.md` | Finding elements on a page, choosing the right locator strategy |
| **DOM Inspection** | `skills/dom-inspection/SKILL.md` | Inspecting page state, reading the accessibility tree via MCP |
| **Assertion Building** | `skills/assertion-building/SKILL.md` | Writing assertions, choosing the right matcher, avoiding flaky checks |
| **Page Interaction** | `skills/page-interaction/SKILL.md` | Clicking, typing, selecting, hovering, navigating |
| **State Management** | `skills/state-management/SKILL.md` | Managing fixtures, storage state, environment config, test isolation |

---

## Quick Reference: Creating a New Test

1. **Read** `skills/test-authoring/SKILL.md`
2. **Inspect** the target page with `browser_snapshot` (see `skills/dom-inspection/SKILL.md`)
3. **Create a POM** in `pages/<page-name>.page.ts` with locators discovered from the snapshot
4. **Create a fixture** in `tests/fixtures/` (or extend existing one) to instantiate the POM
5. **Write the test** in `tests/<area>/<feature>.spec.ts` using the fixture
6. **Run** `npx playwright test` to verify
