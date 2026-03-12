---
name: assertion-building
description: How to write reliable, non-flaky assertions in Playwright tests. Covers web-first assertions, soft assertions, custom timeouts, and common anti-patterns that lead to intermittent failures.
---

# Assertion Building

## When to Use

- Adding `expect()` assertions to a test
- Choosing the right assertion matcher for a scenario
- Debugging flaky or timing-related test failures
- Deciding between hard and soft assertions
- Grouping assertions with `test.step()`

## Instructions

### 1. Always Use Web-First Assertions

Playwright's web-first assertions **auto-wait and auto-retry** until the condition is met or the timeout expires. This is the single most important rule for reliable tests.

```typescript
// ✅ Web-first: auto-waits for element to be visible
await expect(page.getByRole("heading")).toBeVisible();

// ✅ Web-first: auto-waits for title to match
await expect(page).toHaveTitle(/Wikipedia/);

// ✅ Web-first: auto-waits for URL to match
await expect(page).toHaveURL(/wiki\/Main_Page/);

// ✅ Web-first: auto-waits for text content
await expect(page.getByRole("heading", { level: 1 })).toHaveText("Wikipedia");
```

### 2. Available Web-First Assertions

#### Page-level

| Assertion                                 | Purpose            |
| ----------------------------------------- | ------------------ |
| `expect(page).toHaveTitle(titleOrRegExp)` | Page title matches |
| `expect(page).toHaveURL(urlOrRegExp)`     | Page URL matches   |

#### Locator-level

| Assertion                                      | Purpose                           |
| ---------------------------------------------- | --------------------------------- |
| `expect(locator).toBeVisible()`                | Element is visible                |
| `expect(locator).toBeHidden()`                 | Element is hidden or detached     |
| `expect(locator).toBeEnabled()`                | Element is enabled (not disabled) |
| `expect(locator).toBeDisabled()`               | Element is disabled               |
| `expect(locator).toBeChecked()`                | Checkbox/radio is checked         |
| `expect(locator).toHaveText(text)`             | Element's text content matches    |
| `expect(locator).toContainText(text)`          | Element's text contains substring |
| `expect(locator).toHaveValue(value)`           | Input value matches               |
| `expect(locator).toHaveAttribute(name, value)` | Attribute matches                 |
| `expect(locator).toHaveCount(count)`           | Number of matching elements       |
| `expect(locator).toHaveClass(className)`       | CSS class matches                 |
| `expect(locator).toHaveCSS(property, value)`   | CSS property matches              |

### 3. Negation

Prefix with `.not` for inverse assertions:

```typescript
await expect(page.getByRole("dialog")).not.toBeVisible();
await expect(page.getByRole("button", { name: "Submit" })).not.toBeDisabled();
```

### 4. Custom Timeouts

Override the default assertion timeout for specific cases:

```typescript
// Wait up to 10 seconds for a slow-loading element
await expect(page.getByRole("table")).toBeVisible({ timeout: 10_000 });
```

Use this sparingly — if you need long timeouts often, the application or test setup may have a problem.

### 5. Soft Assertions

Soft assertions **don't stop the test** on failure — they collect all failures and report them at the end:

```typescript
await expect.soft(page.getByRole("heading")).toHaveText("Wikipedia");
await expect.soft(page.getByRole("searchbox")).toBeVisible();
await expect.soft(page.getByRole("link", { name: "English" })).toBeVisible();
// Test continues even if one of the above fails; all failures reported together
```

**When to use soft assertions**:

- Verifying multiple independent UI elements on a page
- Smoke tests that check many properties at once

**When NOT to use soft assertions**:

- When a failure means subsequent steps are invalid (use hard assertions)
- For critical flow-blocking conditions (login success, navigation complete)

### 6. Structuring Assertions with `test.step()`

Group related assertions into logical steps for better readability and trace output:

```typescript
test("should display homepage elements", async ({ homePage }) => {
  await test.step("verify page metadata", async () => {
    await expect(homePage.page).toHaveTitle(/Wikipedia/);
    await expect(homePage.page).toHaveURL(/Main_Page/);
  });

  await test.step("verify search functionality is available", async () => {
    await expect(homePage.searchInput).toBeVisible();
    await expect(homePage.searchInput).toBeEnabled();
    await expect(homePage.searchButton).toBeVisible();
  });
});
```

### 7. Regex vs String Matching

```typescript
// Exact string match
await expect(locator).toHaveText("Wikipedia, the free encyclopedia");

// Regex match — more resilient to minor text changes
await expect(locator).toHaveText(/Wikipedia/);

// Case-insensitive
await expect(locator).toHaveText(/wikipedia/i);
```

Prefer regex when the exact wording might change but the key content won't.

## Anti-Patterns

- ❌ **Manual waits before assertions**:

  ```typescript
  await page.waitForTimeout(2000); // ❌ Never do this
  await expect(locator).toBeVisible(); // Web-first assertions already wait
  ```

- ❌ **Using ElementHandle APIs**:

  ```typescript
  const el = await page.$(".heading"); // ❌ Returns ElementHandle, not auto-waiting
  expect(el).not.toBeNull(); // ❌ Not a web-first assertion
  ```

- ❌ **`toBeTruthy()` on locator count**:

  ```typescript
  const count = await page.locator("li").count(); // ❌ Point-in-time snapshot
  expect(count).toBeGreaterThan(0); // ❌ Not auto-waiting
  // ✅ Instead:
  await expect(page.locator("li")).toHaveCount(5);
  // or: await expect(page.locator('li').first()).toBeVisible();
  ```

- ❌ **Asserting on extracted text instead of using web-first**:

  ```typescript
  const text = await locator.textContent(); // ❌ Point-in-time snapshot
  expect(text).toContain("Wikipedia"); // ❌ No auto-retry
  // ✅ Instead:
  await expect(locator).toContainText("Wikipedia");
  ```

- ❌ **Overly broad assertions** that pass even when the feature is broken:
  ```typescript
  await expect(page.locator("body")).toBeVisible(); // ❌ Always passes
  ```

## References

- Playwright assertions docs: https://playwright.dev/docs/test-assertions
- Test-authoring skill: `skills/test-authoring/SKILL.md` — test structure and `test.step()`
- Agents.md Section 6: Playwright Test-Writing Standards
