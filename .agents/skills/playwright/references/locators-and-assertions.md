# Playwright Locators, Assertions, and Recipes Reference

Quick-reference cheat sheet for Playwright test authoring.

## 1. Locator Quick Reference

| Locator | Purpose | Example |
| :--- | :--- | :--- |
| `page.getByRole(role, { name })` | Elements with ARIA role (button, link, heading, textbox, checkbox) | `page.getByRole('button', { name: 'Gửi' })` |
| `page.getByLabel(text)` | Form fields associated with `<label>` | `page.getByLabel('Mật khẩu')` |
| `page.getByPlaceholder(text)` | Inputs with placeholder attribute | `page.getByPlaceholder('Tìm kiếm tài liệu...')` |
| `page.getByText(text, { exact })` | Elements containing visible text | `page.getByText('Tải lên hoàn tất', { exact: true })` |
| `page.getByAltText(text)` | Images with alt attribute | `page.getByAltText('Logo Skibidi')` |
| `page.getByTitle(text)` | Elements with title attribute | `page.getByTitle('Đóng cửa sổ')` |
| `page.getByTestId(id)` | Elements with `data-testid` attribute | `page.getByTestId('chat-bubble-stream')` |

## 2. Web-First Assertions

Unlike manual condition checks, web-first assertions poll until the assertion passes or the timeout expires.

```javascript
// Visibility & State
await expect(locator).toBeVisible();
await expect(locator).toBeHidden();
await expect(locator).toBeEnabled();
await expect(locator).toBeDisabled();
await expect(locator).toBeChecked();

// Text & Value
await expect(locator).toHaveText('Xin chào!');
await expect(locator).toContainText('Token tóm tắt:');
await expect(locator).toHaveValue('admin@domain.com');

// Count & Hierarchy
await expect(locator).toHaveCount(5);

// Page & Navigation
await expect(page).toHaveTitle(/Skibidi/);
await expect(page).toHaveURL(/.*\/dashboard/);

// Custom timeout for heavy AI generation
await expect(locator).toHaveText(/Hoàn tất/, { timeout: 45000 });
```

## 3. Network Mocking & Interception

```javascript
// Mock REST response
await page.route('**/api/notebooks', async (route) => {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify([{ id: 'nb-1', name: 'Chuyên đề 4' }]),
  });
});

// Simulate backend error
await page.route('**/api/upload', (route) => route.abort('failed'));
```

## 4. Reusing Authentication State

```javascript
// auth.setup.js
import { test as setup, expect } from '@playwright/test';

const authFile = 'playwright/.auth/user.json';

setup('authenticate', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('test@example.com');
  await page.getByLabel('Mật khẩu').fill('password123');
  await page.getByRole('button', { name: 'Đăng nhập' }).click();
  await page.waitForURL('/notebooks');

  await page.context().storageState({ path: authFile });
});
```
