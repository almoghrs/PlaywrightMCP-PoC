---
name: state-management
description: How to manage test state, fixtures, authentication, environment configuration, and test isolation in the Playwright test suite. Ensures tests are independent, reproducible, and maintainable. Use when setting up shared preconditions or managing auth sessions.
---

# State Management

## When to Use

- Setting up shared preconditions for tests (navigation, authentication)
- Managing authenticated sessions across tests
- Configuring environment-specific settings (URLs, credentials)
- Ensuring tests don't interfere with each other
- Adding setup or teardown logic

## Instructions

### 1. Fixtures: The Primary State Tool

Fixtures are the correct way to manage state in Playwright. They provide **per-test setup and teardown** with automatic cleanup.

#### Basic Fixture Pattern

```typescript
// tests/fixtures/base.fixture.ts
import { test as base } from "@playwright/test";
import { WikipediaHomePage } from "../../pages/wikipedia-home.page";

type Fixtures = {
  homePage: WikipediaHomePage;
};

export const test = base.extend<Fixtures>({
  homePage: async ({ page }, use) => {
    // SETUP: runs before the test
    const homePage = new WikipediaHomePage(page);
    await homePage.goto();

    await use(homePage); // ← test runs here

    // TEARDOWN: runs after the test (optional)
    // Cleanup logic goes here if needed
  },
});

export { expect } from "@playwright/test";
```

#### Fixture Scope

| Scope              | Behavior                   | Use When                                         |
| ------------------ | -------------------------- | ------------------------------------------------ |
| `'test'` (default) | Created per test           | Most cases — keeps tests isolated                |
| `'worker'`         | Created per worker process | Expensive one-time setup (DB seed, login tokens) |

```typescript
// Worker-scoped fixture (shared across tests in the same worker)
export const test = base.extend<{}, { authToken: string }>({
  authToken: [
    async ({}, use) => {
      const token = await fetchAuthToken();
      await use(token);
    },
    { scope: "worker" },
  ],
});
```

#### Composing Fixtures

Fixtures can depend on other fixtures:

```typescript
type Fixtures = {
  homePage: WikipediaHomePage;
  searchResults: SearchResultsPage;
};

export const test = base.extend<Fixtures>({
  homePage: async ({ page }, use) => {
    const homePage = new WikipediaHomePage(page);
    await homePage.goto();
    await use(homePage);
  },

  // This fixture depends on the page fixture, not homePage
  searchResults: async ({ page }, use) => {
    const searchResults = new SearchResultsPage(page);
    await use(searchResults);
  },
});
```

### 2. Authentication & Storage State

For tests that require a logged-in user, use Playwright's `storageState` to save and restore session cookies:

#### Step 1: Create an Auth Setup

```typescript
// tests/auth.setup.ts
import { test as setup, expect } from "@playwright/test";

setup("authenticate", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Username").fill(process.env.TEST_USERNAME!);
  await page.getByLabel("Password").fill(process.env.TEST_PASSWORD!);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL(/Main_Page/);

  // Save signed-in state
  await page.context().storageState({ path: ".auth/user.json" });
});
```

#### Step 2: Configure in `playwright.config.ts`

```typescript
export default defineConfig({
  projects: [
    { name: "setup", testMatch: /.*\.setup\.ts/ },
    {
      name: "chromium",
      dependencies: ["setup"],
      use: {
        storageState: ".auth/user.json",
      },
    },
  ],
});
```

#### Step 3: Add to `.gitignore`

```
.auth/
```

> **Note**: This is not needed for the current Wikipedia PoC (no auth required), but the pattern is documented here for future test projects.

### 3. Environment Configuration

#### Current Setup (PoC)

The base URL is configured in `playwright.config.ts`:

```typescript
use: {
  baseURL: 'https://en.wikipedia.org',
},
```

All POM `goto()` methods use relative paths, so changing `baseURL` updates all tests:

```typescript
async goto() {
  await this.page.goto('/wiki/Main_Page');  // Resolved against baseURL
}
```

#### Future: Multi-Environment Support

For testing different environments, use environment variables:

```typescript
// playwright.config.ts
use: {
  baseURL: process.env.BASE_URL || 'https://en.wikipedia.org',
},
```

```bash
# .env.staging
BASE_URL=https://staging.wikipedia.org
```

### 4. Test Isolation Rules

Every test must be **completely independent**. Follow these rules:

1. **No shared mutable state** — each test gets a fresh `page` and `context`.
2. **No test ordering dependencies** — tests must pass in any order, including in parallel.
3. **Don't use `test.beforeAll()` for state that affects the page** — use fixtures instead.
4. **Clean up in fixtures** — if a fixture creates data, use the teardown phase (after `use()`) to clean it up.

#### `beforeEach` vs Fixtures

| Use Case                        | Use                                                              |
| ------------------------------- | ---------------------------------------------------------------- |
| Navigate to a starting page     | **Fixture** — encapsulates POM creation + navigation             |
| Set a cookie or local storage   | **Fixture** with `storageState` or `page.context().addCookies()` |
| Seed test data                  | **Fixture** (worker-scoped if expensive)                         |
| Log the test name for debugging | `beforeEach` (not state-related)                                 |

```typescript
// ✅ Use fixtures for state setup
export const test = base.extend<Fixtures>({
  homePage: async ({ page }, use) => {
    const homePage = new WikipediaHomePage(page);
    await homePage.goto();
    await use(homePage);
  },
});

// ❌ Don't use beforeEach for what fixtures do better
test.beforeEach(async ({ page }) => {
  await page.goto("/wiki/Main_Page"); // ❌ Should be a fixture
});
```

### 5. Parallelization

Tests run in parallel by default (`fullyParallel: true` in config). This works because:

- Each test gets its own `BrowserContext` (isolated cookies, storage, etc.)
- Each test gets its own `Page` instance
- Fixtures run independently per test

**Do not** use `test.describe.serial()` unless tests absolutely must run in order (very rare).

## Anti-Patterns

- ❌ **Shared mutable variables between tests**: Tests run in parallel — a variable written in one test may not be read by another.
- ❌ **Using `test.beforeAll()` for page navigation**: This runs once per worker, not per test. Use fixtures.
- ❌ **Hardcoding credentials in test code**: Use environment variables.
- ❌ **Depending on test execution order**: Tests should pass when run individually with `--grep`.
- ❌ **Storing state in global/module-level variables**: Each worker is a separate process — global state isn't shared.
- ❌ **Using `test.describe.serial()`** without a strong reason: It defeats parallelization and masks test coupling.

## References

- Playwright fixtures docs: https://playwright.dev/docs/test-fixtures
- Playwright auth docs: https://playwright.dev/docs/auth
- Playwright parallelism docs: https://playwright.dev/docs/test-parallel
- Test-authoring skill: `skills/test-authoring/SKILL.md` — how to extend fixtures
- Agents.md Section 7: Error Handling & Debugging
