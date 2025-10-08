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

        // 카테고리 ?�터 버튼???�인
        const categoryButtons = page.locator('[data-testid="category-button"]');
        if (await categoryButtons.count() > 0) {
            // �?번째 카테고리 버튼 ?�릭
            await categoryButtons.first().click();

            // ?�터링된 결과 ?�인
            await page.waitForTimeout(1000);
        }
    });

    test('커�??�티 게시글 ?�성 ?�이지 ?�근', async ({ page }) => {
        // ??게시글 ?�성 버튼 ?�릭
        const newPostButton = page.locator('a[href="/community/new"]');
        await expect(newPostButton).toBeVisible();
        await newPostButton.click();

        // 게시글 ?�성 ?�이지�??�동 ?�인
        await expect(page).toHaveURL(/.*community\/new/);

        // ?�성 ???�인
        await expect(page.locator('form')).toBeVisible();

        // ?�목 ?�력 ?�드 ?�인
        const titleInput = page.locator('input[name="title"]');
        await expect(titleInput).toBeVisible();

        // ?�용 ?�력 ?�드 ?�인
        const contentInput = page.locator('textarea[name="content"]');
        await expect(contentInput).toBeVisible();
    });

    test('커�??�티 게시글 ?�세 ?�이지 ?�근', async ({ page }) => {
        await page.waitForLoadState('networkidle');

        // 게시글 링크 찾기
        const postLinks = page.locator('a[href*="/community/"]');
        if (await postLinks.count() > 0) {
            // �?번째 게시글 ?�릭
            await postLinks.first().click();

            // 게시글 ?�세 ?�이지�??�동 ?�인
            await expect(page).toHaveURL(/.*community\/[a-zA-Z0-9]+/);

            // 게시글 ?�목 ?�인
            await expect(page.locator('h1')).toBeVisible();

            // 게시글 ?�용 ?�인
            const content = page.locator('article').or(page.locator('[data-testid="post-content"]'));
            await expect(content).toBeVisible();
        }
    });

    test('커�??�티 ?��? 기능 ?�스??, async ({ page }) => {
        await page.waitForLoadState('networkidle');

        // 게시글 링크 찾기
        const postLinks = page.locator('a[href*="/community/"]');
        if (await postLinks.count() > 0) {
            await postLinks.first().click();
            await page.waitForLoadState('networkidle');

            // ?��? ?�션 ?�인
            const commentsSection = page.locator('[data-testid="comments-section"]').or(page.locator('section'));
            await expect(commentsSection).toBeVisible();

            // ?��? ?�력 ?�드 ?�인
            const commentInput = page.locator('textarea[placeholder*="?��?"]').or(page.locator('textarea'));
            if (await commentInput.count() > 0) {
                await expect(commentInput.first()).toBeVisible();
            }
        }
    });

    test('커�??�티 좋아??기능 ?�스??, async ({ page }) => {
        await page.waitForLoadState('networkidle');

        // 게시글 링크 찾기
        const postLinks = page.locator('a[href*="/community/"]');
        if (await postLinks.count() > 0) {
            await postLinks.first().click();
            await page.waitForLoadState('networkidle');

            // 좋아??버튼 ?�인
            const likeButton = page.locator('button').filter({ hasText: /좋아??like/i });
            if (await likeButton.count() > 0) {
                await expect(likeButton.first()).toBeVisible();
            }
        }
    });

    test('커�??�티 ?�고 기능 ?�스??, async ({ page }) => {
        await page.waitForLoadState('networkidle');

        // 게시글 링크 찾기
        const postLinks = page.locator('a[href*="/community/"]');
        if (await postLinks.count() > 0) {
            await postLinks.first().click();
            await page.waitForLoadState('networkidle');

            // ?�고 버튼 ?�인
            const reportButton = page.locator('button').filter({ hasText: /?�고|report/i });
            if (await reportButton.count() > 0) {
                await expect(reportButton.first()).toBeVisible();

                // ?�고 버튼 ?�릭
                await reportButton.first().click();

                // ?�고 모달 ?�는 ???�인
                const reportModal = page.locator('[data-testid="report-modal"]').or(page.locator('dialog'));
                if (await reportModal.count() > 0) {
                    await expect(reportModal.first()).toBeVisible();
                }
            }
        }
    });

    test('커�??�티 검??기능 ?�스??, async ({ page }) => {
        await page.waitForLoadState('networkidle');

        // 검???�력 ?�드 찾기
        const searchInput = page.locator('input[type="search"]').or(page.locator('input[placeholder*="검??]'));
        if (await searchInput.count() > 0) {
            await expect(searchInput.first()).toBeVisible();

            // 검?�어 ?�력
            await searchInput.first().fill('?�스??);

            // 검??버튼 ?�릭 ?�는 ?�터 ???�력
            const searchButton = page.locator('button[type="submit"]').or(page.locator('button').filter({ hasText: /검??search/i }));
            if (await searchButton.count() > 0) {
                await searchButton.first().click();
            } else {
                await searchInput.first().press('Enter');
            }

            // 검??결과 ?�인
            await page.waitForTimeout(1000);
        }
    });

    test('커�??�티 ?�렬 기능 ?�스??, async ({ page }) => {
        await page.waitForLoadState('networkidle');

        // ?�렬 ?�션 찾기
        const sortSelect = page.locator('select').or(page.locator('[data-testid="sort-select"]'));
        if (await sortSelect.count() > 0) {
            await expect(sortSelect.first()).toBeVisible();

            // ?�렬 ?�션 변�?
            await sortSelect.first().selectOption('recent');
            await page.waitForTimeout(1000);

            await sortSelect.first().selectOption('popular');
            await page.waitForTimeout(1000);
        }
    });

    test('커�??�티 ?�이지?�이???�스??, async ({ page }) => {
        await page.waitForLoadState('networkidle');

        // ?�이지?�이??버튼 찾기
        const paginationButtons = page.locator('[data-testid="pagination"] button').or(page.locator('nav button'));
        if (await paginationButtons.count() > 1) {
            // ?�음 ?�이지 버튼 ?�릭
            const nextButton = paginationButtons.filter({ hasText: /?�음|next|>/i });
            if (await nextButton.count() > 0) {
                await nextButton.first().click();
                await page.waitForLoadState('networkidle');
            }
        }
    });

    test('커�??�티 API ?�러 처리 ?�스??, async ({ page }) => {
        // API ?�답 모니?�링
        const responses: any[] = [];

        page.on('response', response => {
            if (response.url().includes('/api/community')) {
                responses.push({
                    url: response.url(),
                    status: response.status()
                });
            }
        });

        await page.waitForLoadState('networkidle');

        // API ?�답 ?�인
        const communityResponses = responses.filter(r => r.url.includes('/api/community'));
        console.log('Community API Responses:', communityResponses);

        // 500 ?�러가 ?�는지 ?�인
        const errorResponses = communityResponses.filter(r => r.status >= 500);
        expect(errorResponses).toHaveLength(0);
    });
});
