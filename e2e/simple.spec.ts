import { test, expect } from '@playwright/test';

test('simple page loads', async ({ page }) => {
  await page.goto('/simple');
  await expect(page).toHaveTitle(/Simple Test Page/);
  await expect(page.locator('h1')).toContainText('Simple Test Page');
});

test('database connection test', async ({ page }) => {
  await page.goto('/api/test-db');
  const response = await page.waitForResponse('/api/test-db');
  expect(response.status()).toBe(200);
  
  const data = await response.json();
  expect(data.success).toBe(true);
  expect(data.message).toContain('Drizzle 데이터베이스 연결 테스트 성공');
});
