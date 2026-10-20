---
name: playwright
description: >-
  End-to-end (E2E) testing, integration testing, and browser automation for web applications
  (Next.js, React) using Microsoft Playwright (microsoft/playwright). Use when writing, executing,
  or debugging Playwright tests, automating browser actions across Chromium/Firefox/WebKit, inspecting DOM locators,
  testing API endpoints, mocking network requests, and capturing traces/screenshots.
triggers:
  - "playwright"
  - "e2e test"
  - "browser test"
  - "web test"
  - "kiểm thử web"
  - "kiểm thử e2e"
  - "playwright test"
  - "web automation"
---

# Playwright — Modern E2E & Browser Automation Skill

This skill provides comprehensive standards, runbooks, and recipes for authoring, running, and debugging browser automation and end-to-end tests using [Microsoft Playwright](https://github.com/microsoft/playwright).

## 1. When to Use
- Implementing E2E test suites for the web application (`frontend/`).
- Verifying critical user journeys (Authentication, Document Upload, SSE Chat Streaming, Knowledge Graph visualization).
- Cross-browser validation across Chromium, Firefox, and WebKit (Safari).
- Intercepting and mocking backend API responses (FastAPI) during frontend UI testing.
- Diagnosing flaky UI interactions using Playwright Traces, Video recordings, and Network HAR files.

## 2. Prerequisites & Setup in Next.js Project

### 2.1 Installation
In the `frontend/` directory:

```bash
cd frontend
npm install -D @playwright/test
npx playwright install --with-deps chromium
```

### 2.2 Recommended Playwright Configuration
Save in `frontend/playwright.config.js` or `frontend/playwright.config.ts`:

```javascript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
```

---

## 3. Directory Structure
```text
frontend/
├── e2e/
│   ├── auth.setup.js             # Authentication state setup (storageState)
│   ├── auth/
│   │   ├── login.spec.js
│   │   └── register.spec.js
│   ├── notebooks/
│   │   ├── create-notebook.spec.js
│   │   └── upload-document.spec.js
│   └── chat/
│       └── sse-chat.spec.js      # Testing streaming responses
├── playwright.config.js
└── package.json
```

---

## 4. Test Authoring Best Practices

### 4.1 Prioritize User-Facing Locators
Always use Playwright's role and label locators instead of fragile CSS selectors:

```javascript
// Preferred (Resilient to design changes)
page.getByRole('button', { name: 'Tạo sổ tay mới' });
page.getByLabel('Địa chỉ Email');
page.getByPlaceholder('Nhập câu hỏi cho tài liệu...');
page.getByTestId('chat-stream-message');

// Avoid (Brittle)
page.locator('div.flex > button.px-4');
```

### 4.2 Web-First Assertions
Always use `expect(locator)...` which automatically polls and waits until the condition is met:

```javascript
// Automatically waits up to 5000ms
await expect(page.getByRole('heading', { level: 1 })).toHaveText('Trang chủ Skibidi');
await expect(page.getByTestId('loading-spinner')).toBeHidden();
await expect(page).toHaveURL(/\/notebooks\/[a-zA-Z0-9-]+/);
```

### 4.3 Handling SSE & Streaming AI Responses
For streaming chat responses:
```javascript
test('should stream LLM response tokens', async ({ page }) => {
  await page.goto('/notebooks/test-nb/chat');
  
  const input = page.getByPlaceholder('Nhập câu hỏi...');
  await input.fill('Tóm tắt tài liệu này');
  await input.press('Enter');

  // Verify message bubble appears
  const responseBubble = page.getByTestId('chat-ai-response').last();
  await expect(responseBubble).toBeVisible();

  // Wait for the full summary completion indicator
  await expect(responseBubble).toContainText('Tóm tắt tổng quan', { timeout: 30000 });
});
```

### 4.4 Mocking Backend REST & Graph APIs
```javascript
test('mock notebook list API', async ({ page }) => {
  await page.route('**/api/notebooks', async (route) => {
    const json = [
      { id: '1', title: 'Tài liệu kiến trúc', source_count: 3 }
    ];
    await route.fulfill({ json });
  });

  await page.goto('/');
  await expect(page.getByText('Tài liệu kiến trúc')).toBeVisible();
});
```

For comprehensive locators and assertion reference, see [`references/locators-and-assertions.md`](./references/locators-and-assertions.md).

---

## 5. CLI Execution & Debugging Workflow

### Run all tests
```bash
npx playwright test
```

### Run specific file in UI mode (Interactive visual runner)
```bash
npx playwright test e2e/auth/login.spec.js --ui
```

### Run with headed browser (Watch execution live)
```bash
npx playwright test --headed
```

### Record new tests visually (Codegen)
```bash
npx playwright codegen http://localhost:3000
```

### Inspect Test Reports & Traces
```bash
npx playwright show-report
npx playwright show-trace test-results/trace.zip
```
