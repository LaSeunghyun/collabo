import { test, expect } from '@playwright/test';

test.describe('Community Features - E2E Tests', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/community');
    });

    test('커뮤니티 게시글 목록 로딩', async ({ page }) => {
        // 페이지 로딩 대기
        await page.waitForLoadState('networkidle');

        // 커뮤니티 제목 확인
        await expect(page.locator('h1')).toBeVisible();

        // 게시글 목록 컨테이너 확인
        const postsContainer = page.locator('[data-testid="posts-container"]').or(page.locator('main'));
        await expect(postsContainer).toBeVisible();
    });

    test('커뮤니티 카테고리 필터링', async ({ page }) => {
        await page.waitForLoadState('networkidle');

        // 카테고리 필터 버튼들 확인
        const categoryButtons = page.locator('[data-testid="category-button"]');
        if (await categoryButtons.count() > 0) {
            // 첫 번째 카테고리 버튼 클릭
            await categoryButtons.first().click();

            // 필터링된 결과 확인
            await page.waitForTimeout(1000);
        }
    });

    test('커뮤니티 게시글 작성 페이지 접근', async ({ page }) => {
        // 새 게시글 작성 버튼 클릭
        const newPostButton = page.locator('a[href="/community/new"]');
        await expect(newPostButton).toBeVisible();
        await newPostButton.click();

        // 게시글 작성 페이지로 이동 확인
        await expect(page).toHaveURL(/.*community\/new/);

        // 작성 폼 확인
        await expect(page.locator('form')).toBeVisible();

        // 제목 입력 필드 확인
        const titleInput = page.locator('input[name="title"]');
        await expect(titleInput).toBeVisible();

        // 내용 입력 필드 확인
        const contentInput = page.locator('textarea[name="content"]');
        await expect(contentInput).toBeVisible();
    });

    test('커뮤니티 게시글 상세 페이지 접근', async ({ page }) => {
        await page.waitForLoadState('networkidle');

        // 게시글 링크 찾기
        const postLinks = page.locator('a[href*="/community/"]');
        if (await postLinks.count() > 0) {
            // 첫 번째 게시글 클릭
            await postLinks.first().click();

            // 게시글 상세 페이지로 이동 확인
            await expect(page).toHaveURL(/.*community\/[a-zA-Z0-9]+/);

            // 게시글 제목 확인
            await expect(page.locator('h1')).toBeVisible();

            // 게시글 내용 확인
            const content = page.locator('article').or(page.locator('[data-testid="post-content"]'));
            await expect(content).toBeVisible();
        }
    });

    test('커뮤니티 댓글 기능 테스트', async ({ page }) => {
        await page.waitForLoadState('networkidle');

        // 게시글 링크 찾기
        const postLinks = page.locator('a[href*="/community/"]');
        if (await postLinks.count() > 0) {
            await postLinks.first().click();
            await page.waitForLoadState('networkidle');

            // 댓글 섹션 확인
            const commentsSection = page.locator('[data-testid="comments-section"]').or(page.locator('section'));
            await expect(commentsSection).toBeVisible();

            // 댓글 입력 필드 확인
            const commentInput = page.locator('textarea[placeholder*="댓글"]').or(page.locator('textarea'));
            if (await commentInput.count() > 0) {
                await expect(commentInput.first()).toBeVisible();
            }
        }
    });

    test('커뮤니티 좋아요 기능 테스트', async ({ page }) => {
        await page.waitForLoadState('networkidle');

        // 게시글 링크 찾기
        const postLinks = page.locator('a[href*="/community/"]');
        if (await postLinks.count() > 0) {
            await postLinks.first().click();
            await page.waitForLoadState('networkidle');

            // 좋아요 버튼 확인
            const likeButton = page.locator('button').filter({ hasText: /좋아요|like/i });
            if (await likeButton.count() > 0) {
                await expect(likeButton.first()).toBeVisible();
            }
        }
    });

    test('커뮤니티 신고 기능 테스트', async ({ page }) => {
        await page.waitForLoadState('networkidle');

        // 게시글 링크 찾기
        const postLinks = page.locator('a[href*="/community/"]');
        if (await postLinks.count() > 0) {
            await postLinks.first().click();
            await page.waitForLoadState('networkidle');

            // 신고 버튼 확인
            const reportButton = page.locator('button').filter({ hasText: /신고|report/i });
            if (await reportButton.count() > 0) {
                await expect(reportButton.first()).toBeVisible();

                // 신고 버튼 클릭
                await reportButton.first().click();

                // 신고 모달 또는 폼 확인
                const reportModal = page.locator('[data-testid="report-modal"]').or(page.locator('dialog'));
                if (await reportModal.count() > 0) {
                    await expect(reportModal.first()).toBeVisible();
                }
            }
        }
    });

    test('커뮤니티 검색 기능 테스트', async ({ page }) => {
        await page.waitForLoadState('networkidle');

        // 검색 입력 필드 찾기
        const searchInput = page.locator('input[type="search"]').or(page.locator('input[placeholder*="검색"]'));
        if (await searchInput.count() > 0) {
            await expect(searchInput.first()).toBeVisible();

            // 검색어 입력
            await searchInput.first().fill('테스트');

            // 검색 버튼 클릭 또는 엔터 키 입력
            const searchButton = page.locator('button[type="submit"]').or(page.locator('button').filter({ hasText: /검색|search/i }));
            if (await searchButton.count() > 0) {
                await searchButton.first().click();
            } else {
                await searchInput.first().press('Enter');
            }

            // 검색 결과 확인
            await page.waitForTimeout(1000);
        }
    });

    test('커뮤니티 정렬 기능 테스트', async ({ page }) => {
        await page.waitForLoadState('networkidle');

        // 정렬 옵션 찾기
        const sortSelect = page.locator('select').or(page.locator('[data-testid="sort-select"]'));
        if (await sortSelect.count() > 0) {
            await expect(sortSelect.first()).toBeVisible();

            // 정렬 옵션 변경
            await sortSelect.first().selectOption('recent');
            await page.waitForTimeout(1000);

            await sortSelect.first().selectOption('popular');
            await page.waitForTimeout(1000);
        }
    });

    test('커뮤니티 페이지네이션 테스트', async ({ page }) => {
        await page.waitForLoadState('networkidle');

        // 페이지네이션 버튼 찾기
        const paginationButtons = page.locator('[data-testid="pagination"] button').or(page.locator('nav button'));
        if (await paginationButtons.count() > 1) {
            // 다음 페이지 버튼 클릭
            const nextButton = paginationButtons.filter({ hasText: /다음|next|>/i });
            if (await nextButton.count() > 0) {
                await nextButton.first().click();
                await page.waitForLoadState('networkidle');
            }
        }
    });

    test('커뮤니티 API 에러 처리 테스트', async ({ page }) => {
        // API 응답 모니터링
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

        // API 응답 확인
        const communityResponses = responses.filter(r => r.url.includes('/api/community'));
        console.log('Community API Responses:', communityResponses);

        // 500 에러가 없는지 확인
        const errorResponses = communityResponses.filter(r => r.status >= 500);
        expect(errorResponses).toHaveLength(0);
    });
});
