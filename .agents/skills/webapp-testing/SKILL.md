---
name: webapp-testing
description: Test the TextRP Consultant Network web app using Playwright via the built-in runTest() callback. Use when asked to test features, verify UI behavior, check a user flow, debug visual issues, or run end-to-end tests. The app runs on port 5000.
---

# Web App Testing

Test the TextRP Consultant Network app using Playwright. Adapted from Anthropic's webapp-testing skill for this Node.js/React project.

## App Details

- **URL**: `http://localhost:5000`
- **Server**: Single Express server serves both API and Vite-built frontend on port 5000
- **Workflow**: "Start application" must be running before tests

## Using the Built-in Test Runner

The Replit environment provides a `runTest()` callback in the `code_execution` tool. Always use this first — it handles browser launch, screenshots, and cleanup automatically.

```javascript
const result = await runTest(`
  Test plan description here. Be specific:
  1. Navigate to /c/asinaci
  2. Verify the tweet section is visible
  3. Click the "Contact" button
  4. Check the chat widget opens
`);
console.log(result);
```

## When to Write Custom Playwright Scripts

Only write raw Playwright if `runTest()` cannot cover the scenario (e.g., testing WebSocket behavior, file uploads, multi-tab flows).

```javascript
const { chromium } = await import('playwright');
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

await page.goto('http://localhost:5000');
await page.waitForLoadState('networkidle'); // CRITICAL: wait for React to hydrate

// Reconnaissance first — take a screenshot before interacting
await page.screenshot({ path: '/tmp/inspect.png', fullPage: true });

// Then interact using discovered selectors
await page.click('[data-testid="button-submit"]');
await page.waitForSelector('[data-testid="text-success"]');

await browser.close();
```

## Decision Tree

```
Task → Static content check?
  Yes → Read the component file directly
  No  → App already running?
    No  → Restart "Start application" workflow first
    Yes → Use runTest() with a clear test plan
            → Complex multi-step / WebSocket? → Write raw Playwright script
```

## Reconnaissance-Then-Action Pattern

1. Navigate and wait for `networkidle`
2. Take screenshot or inspect DOM
3. Identify selectors from rendered state (prefer `data-testid` attributes)
4. Execute actions with discovered selectors

## Selectors — Project Convention

All interactive and meaningful elements in this project have `data-testid` attributes:
- Buttons: `data-testid="button-{action}-{target}"`
- Inputs: `data-testid="input-{field}"`
- Cards: `data-testid="card-{type}-{id}"`
- Status/display: `data-testid="text-{content}"`

Prefer `data-testid` selectors over CSS classes or text content for stability.

## Key Pages to Test

| Route | Purpose |
|-------|---------|
| `/` | Landing page — consultant directory |
| `/c/:slug` | Consultant profile (e.g., `/c/asinaci`) |
| `/login` | Matrix + Xumm SSO |
| `/dashboard` | Role-adaptive dashboard (visitor/consultant/admin) |
| `/admin` | Admin-only management panel |

## Common Pitfalls

- Don't inspect DOM before `waitForLoadState('networkidle')` on dynamic pages
- The Matrix rain canvas renders on top — use `z-index` aware selectors
- Chat widget loads async — wait for `data-testid="chat-widget"` to appear
- Stories expire after 24h — don't rely on specific story content in tests
- `staleTime: Infinity` is set globally — data won't auto-refetch; test with fresh page loads

## Best Practices

- Use `sync` Playwright for simple scripts, async for complex flows
- Always close the browser when done
- Add `page.waitForSelector()` before asserting on dynamic content
- Capture screenshots on failure for debugging
- Test both dark mode (default) and day mode (`data-theme="day"` on `<html>`)
