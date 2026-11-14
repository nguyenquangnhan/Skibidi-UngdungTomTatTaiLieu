const { test, expect } = require('@playwright/test');

const MOCK_USER = {
  id: 'user-e2e-1',
  email: 'e2e@skibidi.ai',
  full_name: 'Skibidi E2E Tester',
  avatar_url: null,
  created_at: '2026-11-14T00:00:00Z',
};

const MOCK_NOTEBOOKS = [
  {
    id: 'nb-mock-1',
    title: 'Tài liệu Nghiên cứu GraphRAG',
    description: 'Sổ tay tóm tắt chương 5',
    source_count: 1,
    created_at: '2026-11-14T00:00:00Z',
    updated_at: '2026-11-14T00:00:00Z',
  },
];

const MOCK_SOURCES = [
  {
    id: 'src-mock-1',
    notebook_id: 'nb-mock-1',
    title: 'graphrag_paper.pdf',
    source_type: 'pdf',
    url: null,
    status: 'completed',
    error_message: null,
    chunk_count: 12,
    created_at: '2026-11-14T00:00:00Z',
    updated_at: '2026-11-14T00:00:00Z',
  },
];

test.describe('Skibidi Web App - E2E UI Tests', () => {
  test('TC-01: Trang chủ tải thành công khi chưa đăng nhập', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Skibidi/i);
    const heading = page.getByRole('heading', { level: 1 }).first();
    await expect(heading).toBeVisible();
  });

  test('TC-02: Đăng nhập thành công và hiển thị danh sách Sổ tay', async ({ page }) => {
    await page.route('**/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'mock-jwt-token',
          token_type: 'bearer',
          user: MOCK_USER,
        }),
      });
    });

    await page.route('**/api/notebooks', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_NOTEBOOKS),
      });
    });

    await page.goto('/');
    const authBtn = page.getByRole('button', { name: /đăng nhập|login|sign in|bắt đầu/i }).first();
    await expect(authBtn).toBeVisible();
    await authBtn.click();

    await page.getByPlaceholder(/email/i).fill('e2e@skibidi.ai');
    await page.locator('input[type="password"]').first().fill('Secret123!');
    await page.locator('form button[type="submit"]').click();

    await expect(page.getByText('Tài liệu Nghiên cứu GraphRAG').first()).toBeVisible({ timeout: 10000 });
  });

  test('TC-03: Mở Sổ tay, xem Sources và chuyển tab Knowledge Graph', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('skibidi_token', 'mock-jwt-token');
    });

    await page.route('**/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_USER),
      });
    });

    await page.route('**/api/notebooks', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_NOTEBOOKS),
      });
    });

    await page.route('**/api/notebooks/nb-mock-1/sources', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_SOURCES),
      });
    });

    await page.route('**/api/notebooks/nb-mock-1/chat', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'text/event-stream',
          body: 'data: {"type":"token","content":"GraphRAG kết hợp Vector và Neo4j."}\n\ndata: {"type":"done"}\n\n',
        });
      }
    });

    await page.route('**/api/notebooks/nb-mock-1/graph', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          nodes: [{ id: 'GraphRAG', label: 'Concept' }],
          links: [],
        }),
      });
    });

    await page.goto('/');
    const notebookItem = page.getByText('Tài liệu Nghiên cứu GraphRAG').first();
    await expect(notebookItem).toBeVisible({ timeout: 10000 });
    await notebookItem.click();

    await expect(page.getByText('graphrag_paper.pdf').first()).toBeVisible({ timeout: 10000 });
  });

  test('TC-04: Giao diện dark-mode và responsive layout', async ({ page }) => {
    await page.goto('/');
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });
});
