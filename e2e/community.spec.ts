import { test, expect } from '@playwright/test';

test.describe('Community Features - E2E Tests', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/community');
    });

    test('커�??�티 게시글 목록 로딩', async ({ page }) => {
        // ?�이지 로딩 ?��?
        await page.waitForLoadState('networkidle');

        // 커�??�티 ?�목 ?�인
        await expect(page.locator('h1')).toBeVisible();

        // 게시글 목록 컨테?�너 ?�인
        const postsContainer = page.locator('[data-testid="posts-container"]').or(page.locator('main'));
        await expect(postsContainer).toBeVisible();
    });

    test('커�??�티 카테고리 ?�터�?, async ({ page }) => {
        await page.waitForLoadState('networkidle');

        // 카테고리 ?�터 버튼 ?�인
        const categoryButtons = page.locator('[data-testid="category-button"]');
        if (await categoryButtons.count() > 0) {
            // �?번째 카테고리 버튼 ?�릭
            await categoryButtons.first().click();

            // ?�터링된 결과 ?�인
            await page.waitForTimeout(1000);
            const filteredPosts = page.locator('[data-testid="post-card"]').or(page.locator('article'));
            if (await filteredPosts.count() > 0) {
                await expect(filteredPosts.first()).toBeVisible();
            }
        }
    });

    test('커�??�티 게시글 ?�성 ?�이지 ?�근', async ({ page }) => {
        await page.waitForLoadState('networkidle');

        // 게시글 ?�성 버튼 찾기
        const writeButton = page.locator('a[href*="/community/new"]').or(page.locator('button:has-text("?�성")'));
        if (await writeButton.count() > 0) {
            await writeButton.click();

            // 게시글 ?�성 ?�이지�??�동 ?�인
            await expect(page).toHaveURL(/.*community\/new/);

            // ?�성 ???�인
            const writeForm = page.locator('form').or(page.locator('[data-testid="write-form"]'));
            await expect(writeForm).toBeVisible();
        }
    });

    test('커�??�티 게시글 ?�세 ?�이지', async ({ page }) => {
        await page.waitForLoadState('networkidle');

        // 게시글 링크 찾기
        const postLinks = page.locator('a[href*="/community/"]');
        if (await postLinks.count() > 0) {
            // �?번째 게시글 ?�릭
            await postLinks.first().click();

            // 게시글 ?�세 ?�이지�??�동 ?�인
            await expect(page).toHaveURL(/.*community\/[a-zA-Z0-9]+/);

            // 게시글 ?�용 ?�인
            await expect(page.locator('h1')).toBeVisible();
        }
    });

    test('커�??�티 검??기능', async ({ page }) => {
        await page.waitForLoadState('networkidle');

        // 검???�력 ?�드 찾기
        const searchInput = page.locator('input[type="search"]').or(page.locator('input[placeholder*="검??]'));
        if (await searchInput.count() > 0) {
            await expect(searchInput).toBeVisible();

            // 검?�어 ?�력
            await searchInput.fill('?�스??);
            await page.keyboard.press('Enter');
            await page.waitForTimeout(1000);

            // 검??결과 ?�인
            const searchResults = page.locator('[data-testid="post-card"]').or(page.locator('article'));
            if (await searchResults.count() > 0) {
                await expect(searchResults.first()).toBeVisible();
            }
        }
    });

    test('커�??�티 ?�렬 기능', async ({ page }) => {
        await page.waitForLoadState('networkidle');

        // ?�렬 ?�션 찾기
        const sortSelect = page.locator('select[name="sort"]').or(page.locator('select'));
        if (await sortSelect.count() > 0) {
            await expect(sortSelect).toBeVisible();

            // ?�렬 ?�션 ?�택
            await sortSelect.selectOption({ index: 1 });
            await page.waitForTimeout(1000);

            // ?�렬 결과 ?�인
            const sortedPosts = page.locator('[data-testid="post-card"]').or(page.locator('article'));
            if (await sortedPosts.count() > 0) {
                await expect(sortedPosts.first()).toBeVisible();
            }
        }
    });

    test('커�??�티 ?�이지?�이??, async ({ page }) => {
        await page.waitForLoadState('networkidle');

        // ?�이지?�이??컨트�?찾기
        const pagination = page.locator('[data-testid="pagination"]').or(page.locator('nav[aria-label*="?�이지"]'));
        if (await pagination.count() > 0) {
            await expect(pagination).toBeVisible();

            // ?�음 ?�이지 버튼 ?�릭
            const nextButton = pagination.locator('button:has-text("?�음")').or(pagination.locator('a:has-text("?�음")'));
            if (await nextButton.count() > 0) {
                await nextButton.click();
                await page.waitForTimeout(1000);

                // ?�이지 변�??�인
                await expect(page).toHaveURL(/.*page=2/);
            }
        }
    });

    test('커�??�티 반응???�자??, async ({ page }) => {
        // 모바??뷰포?�로 변�?
        await page.setViewportSize({ width: 375, height: 667 });
        await page.waitForLoadState('networkidle');

        // 모바?�에??게시글 카드 ?�인
        const postCards = page.locator('[data-testid="post-card"]').or(page.locator('article'));
        if (await postCards.count() > 0) {
            await expect(postCards.first()).toBeVisible();
        }

        // ?�블�?뷰포?�로 변�?
        await page.setViewportSize({ width: 768, height: 1024 });
        await page.waitForLoadState('networkidle');

        // ?�블릿에??게시글 카드 ?�인
        if (await postCards.count() > 0) {
            await expect(postCards.first()).toBeVisible();
        }
    });

    test('커�??�티 로딩 ?�태', async ({ page }) => {
        // ?�이지 로딩 �??�켈?�톤 ?�인
        const skeleton = page.locator('[data-testid="post-skeleton"]').or(page.locator('.animate-pulse'));
        if (await skeleton.count() > 0) {
            await expect(skeleton.first()).toBeVisible();
        }

        // 로딩 ?�료 ???�켈?�톤 ?�라�??�인
        await page.waitForLoadState('networkidle');
        if (await skeleton.count() > 0) {
            await expect(skeleton.first()).not.toBeVisible();
        }
    });

    test('커�??�티 ?�러 ?�태', async ({ page }) => {
        // ?�트?�크 ?�류 ?��??�이??
        await page.route('**/api/community*', route => route.abort());
        await page.reload();

        // ?�러 메시지 ?�인
        const errorMessage = page.locator('[data-testid="error-message"]').or(page.locator('text=?�류'));
        if (await errorMessage.count() > 0) {
            await expect(errorMessage).toBeVisible();
        }
    });
});
