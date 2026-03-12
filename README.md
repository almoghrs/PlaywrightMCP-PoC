# PlaywrightMCP-PoC

A template for building E2E tests using **Playwright**, **TypeScript**, and the **Model Context Protocol (MCP)**. Designed as an agent-agnostic foundation — any AI agent can read the [Agents.md](Agents.md) file and immediately start writing, running, and debugging tests.

## Quick Start

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install chromium

# Run tests
npm test

# Run tests in headed mode (see the browser)
npm run test:headed

# Run tests with Playwright UI
npm run test:ui

# Open the HTML report
npm run report
```

## MCP Integration

Start the Playwright MCP server so an AI agent can interact with the browser:

```bash
npm run mcp:start
```

This launches the official `@playwright/mcp` server, exposing tools like `browser_navigate`, `browser_snapshot`, `browser_click`, `browser_type`, and more. See [Agents.md](Agents.md) for the full integration guide.

## Project Structure

```
├── Agents.md                  # Master guide for AI agents
├── skills/                          # Modular skill definitions for agents
│   ├── test-creation-and-editing/   # How to create and edit tests (MCP-first workflow)
│   ├── assertion-building/          # How to build assertions
│   └── state-management/            # How to manage test state & fixtures
├── tests/
│   ├── fixtures/              # Shared test fixtures
│   └── wikipedia/             # Test specs grouped by feature
├── pages/                     # Page Object Model classes
├── playwright.config.ts       # Playwright configuration
└── tsconfig.json              # TypeScript configuration
```

## For AI Agents

**Start here → [Agents.md](Agents.md)**

This file is the master orchestrator. It explains the project purpose, coding standards, test-writing rules, MCP integration, and indexes all available skills.
