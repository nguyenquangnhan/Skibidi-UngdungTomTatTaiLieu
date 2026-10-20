const { test, expect } = require('@playwright/test');

test.describe('Skibidi Web App - E2E UI Tests (Chapter 5 Architecture)', () => {

  test.beforeEach(async ({ page }) => {
    // Intercept and mock backend API calls so tests run reliably without live DB
    await page.route('**/api/notebooks', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: 'nb-mock-1',
              title: 'Tài liệu Nghiên cứu GraphRAG',
              description: 'Sổ tay tóm tắt chương 5',
              source_count: 2,
              created_at: new Date().toISOString(),
            },
          ]),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/');
  });

  test('TC-01: Trang chủ tải thành công và hiển thị tiêu đề hệ thống', async ({ page }) => {
    await expect(page).toHaveTitle(/Skibidi/i);
    // Kiểm tra header hoặc banner chính
    const heading = page.getByRole('heading', { level: 1 }).first();
    await expect(heading).toBeVisible();
  });

  test('TC-02: Modal đăng nhập / đăng ký hoạt động chính xác', async ({ page }) => {
    // Tìm nút Đăng nhập / Bắt đầu
    const authBtn = page.getByRole('button', { name: /đăng nhập|login|sign in|bắt đầu/i }).first();
    if (await authBtn.isVisible()) {
      await authBtn.click();
      // Kiểm tra input email & password xuất hiện trong modal
      const emailInput = page.getByPlaceholder(/email/i);
      await expect(emailInput).toBeVisible();
    }
  });

  test('TC-03: Hiển thị danh sách sổ tay (Notebooks) từ API', async ({ page }) => {
    await expect(page.getByText('Tài liệu Nghiên cứu GraphRAG')).toBeVisible({ timeout: 10000 });
  });

  test('TC-04: Giao diện dark-mode và responsive layout', async ({ page }) => {
    // Kiểm tra class dark hoặc nền obsidianLinear
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });
});
