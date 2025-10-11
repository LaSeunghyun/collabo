import { test, expect } from '@playwright/test';

test.describe('Community Features', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to community page
    await page.goto('/community');
  });

  test('커뮤니티 페이지 로딩', async ({ page }) => {
    await expect(page).toHaveTitle(/커뮤니티/);
    await expect(page.locator('h1')).toContainText('커뮤니티');
  });

  test('카테고리 탭 표시', async ({ page }) => {
    // 카테고리 탭들이 표시되는지 확인
    await expect(page.locator('[role="tablist"]')).toBeVisible();
    
    // 기본 카테고리들이 있는지 확인
    const tabs = page.locator('[role="tab"]');
    await expect(tabs).toHaveCount(8); // 전체 + 7개 카테고리
  });

  test('게시글 목록 표시', async ({ page }) => {
    // 게시글 목록이 로딩되는지 확인
    await page.waitForSelector('[data-testid="post-list"]', { timeout: 10000 });
    
    // 게시글 카드들이 있는지 확인
    const postCards = page.locator('[data-testid="post-card"]');
    await expect(postCards).toBeVisible();
  });

  test('검색 기능', async ({ page }) => {
    const searchInput = page.locator('input[placeholder="게시글 검색..."]');
    await searchInput.fill('테스트');
    await page.locator('button[type="submit"]').click();
    
    // 검색 결과가 표시되는지 확인
    await expect(page).toHaveURL(/search=테스트/);
  });

  test('정렬 기능', async ({ page }) => {
    const sortSelect = page.locator('[data-testid="sort-select"]');
    await sortSelect.selectOption('popular');
    
    // 정렬이 적용되는지 확인
    await expect(page).toHaveURL(/sort=popular/);
  });

  test('글쓰기 페이지 접근', async ({ page }) => {
    await page.click('text=글쓰기');
    await expect(page).toHaveURL('/community/new');
  });

  test('게시글 상세 페이지', async ({ page }) => {
    // 첫 번째 게시글 클릭
    const firstPost = page.locator('[data-testid="post-card"]').first();
    await firstPost.click();
    
    // 게시글 상세 페이지로 이동하는지 확인
    await expect(page).toHaveURL(/\/community\/[a-zA-Z0-9-]+/);
    
    // 게시글 내용이 표시되는지 확인
    await expect(page.locator('[data-testid="post-content"]')).toBeVisible();
  });
});

test.describe('Community Post Creation', () => {
  test.beforeEach(async ({ page }) => {
    // 로그인 (테스트 계정 사용)
    await page.goto('/auth/signin');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // 커뮤니티 글쓰기 페이지로 이동
    await page.goto('/community/new');
  });

  test('게시글 작성 폼 표시', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('글쓰기');
    await expect(page.locator('input[name="title"]')).toBeVisible();
    await expect(page.locator('textarea[name="content"]')).toBeVisible();
    await expect(page.locator('select[name="category"]')).toBeVisible();
  });

  test('게시글 작성', async ({ page }) => {
    // 폼 작성
    await page.fill('input[name="title"]', '테스트 게시글');
    await page.fill('textarea[name="content"]', '테스트 내용입니다.');
    await page.selectOption('select[name="category"]', 'free');
    
    // 제출
    await page.click('button[type="submit"]');
    
    // 게시글 상세 페이지로 이동하는지 확인
    await expect(page).toHaveURL(/\/community\/[a-zA-Z0-9-]+/);
    await expect(page.locator('h1')).toContainText('테스트 게시글');
  });

  test('필수 필드 검증', async ({ page }) => {
    // 제목 없이 제출
    await page.fill('textarea[name="content"]', '내용만 있음');
    await page.click('button[type="submit"]');
    
    // 에러 메시지 표시 확인
    await expect(page.locator('input[name="title"]:invalid')).toBeVisible();
  });
});

test.describe('Community Comments', () => {
  test.beforeEach(async ({ page }) => {
    // 로그인
    await page.goto('/auth/signin');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // 게시글 상세 페이지로 이동
    await page.goto('/community/test-post-id');
  });

  test('댓글 작성', async ({ page }) => {
    const commentTextarea = page.locator('textarea[placeholder="댓글을 작성하세요..."]');
    await commentTextarea.fill('테스트 댓글입니다.');
    await page.click('button[type="submit"]');
    
    // 댓글이 추가되는지 확인
    await expect(page.locator('text=테스트 댓글입니다.')).toBeVisible();
  });

  test('댓글 목록 표시', async ({ page }) => {
    // 댓글 섹션이 표시되는지 확인
    await expect(page.locator('[data-testid="comments-section"]')).toBeVisible();
  });
});

test.describe('Community User Activity', () => {
  test.beforeEach(async ({ page }) => {
    // 로그인
    await page.goto('/auth/signin');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
  });

  test('내활동 페이지 접근', async ({ page }) => {
    await page.goto('/me/activity');
    
    await expect(page.locator('h1')).toContainText('내 활동');
    await expect(page.locator('[role="tablist"]')).toBeVisible();
  });

  test('내활동 탭 전환', async ({ page }) => {
    await page.goto('/me/activity');
    
    // 각 탭 클릭하여 전환되는지 확인
    await page.click('text=내가 쓴 글');
    await expect(page.locator('[role="tabpanel"]')).toBeVisible();
    
    await page.click('text=댓글');
    await expect(page.locator('[role="tabpanel"]')).toBeVisible();
    
    await page.click('text=좋아요');
    await expect(page.locator('[role="tabpanel"]')).toBeVisible();
    
    await page.click('text=저장글');
    await expect(page.locator('[role="tabpanel"]')).toBeVisible();
    
    await page.click('text=신고 내역');
    await expect(page.locator('[role="tabpanel"]')).toBeVisible();
  });

  test('범위 필터', async ({ page }) => {
    await page.goto('/me/activity');
    
    const scopeSelect = page.locator('[data-testid="scope-select"]');
    await scopeSelect.selectOption('GLOBAL');
    
    // 필터가 적용되는지 확인
    await expect(page).toHaveURL(/scope=GLOBAL/);
  });
});
