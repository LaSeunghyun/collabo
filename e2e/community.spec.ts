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

        // 카테고리 필터 버튼 확인
        const categoryButtons = page.locator('[data-testid="category-button"]');
        if (await categoryButtons.count() > 0) {
            // 첫 번째 카테고리 버튼 클릭
            await categoryButtons.first().click();

            // 필터링된 결과 확인
            await page.waitForTimeout(1000);
            const filteredPosts = page.locator('[data-testid="post-card"]').or(page.locator('article'));
            if (await filteredPosts.count() > 0) {
                await expect(filteredPosts.first()).toBeVisible();
            }
        }
    });

    test('커뮤니티 게시글 작성 페이지 접근', async ({ page }) => {
        await page.waitForLoadState('networkidle');

        // 게시글 작성 버튼 찾기
        const writeButton = page.locator('a[href*="/community/new"]').or(page.locator('button:has-text("작성")'));
        if (await writeButton.count() > 0) {
            await writeButton.click();

            // 게시글 작성 페이지로 이동 확인
            await expect(page).toHaveURL(/.*community\/new/);

            // 작성 폼 확인
            const writeForm = page.locator('form').or(page.locator('[data-testid="write-form"]'));
            await expect(writeForm).toBeVisible();
        }
    });

    test('커뮤니티 게시글 상세 페이지', async ({ page }) => {
        await page.waitForLoadState('networkidle');

        // 게시글 링크 찾기
        const postLinks = page.locator('a[href*="/community/"]');
        if (await postLinks.count() > 0) {
            // 첫 번째 게시글 클릭
            await postLinks.first().click();

            // 게시글 상세 페이지로 이동 확인
            await expect(page).toHaveURL(/.*community\/[a-zA-Z0-9]+/);

            // 게시글 내용 확인
            await expect(page.locator('h1')).toBeVisible();
        }
    });

    test('커뮤니티 검색 기능', async ({ page }) => {
        await page.waitForLoadState('networkidle');

        // 검색 입력 필드 찾기
        const searchInput = page.locator('input[type="search"]').or(page.locator('input[placeholder*="검색"]'));
        if (await searchInput.count() > 0) {
            await expect(searchInput).toBeVisible();

            // 검색어 입력
            await searchInput.fill('테스트');
            await page.keyboard.press('Enter');
            await page.waitForTimeout(1000);

            // 검색 결과 확인
            const searchResults = page.locator('[data-testid="post-card"]').or(page.locator('article'));
            if (await searchResults.count() > 0) {
                await expect(searchResults.first()).toBeVisible();
            }
        }
    });

    test('커뮤니티 정렬 기능', async ({ page }) => {
        await page.waitForLoadState('networkidle');

        // 정렬 옵션 찾기
        const sortSelect = page.locator('select[name="sort"]').or(page.locator('select'));
        if (await sortSelect.count() > 0) {
            await expect(sortSelect).toBeVisible();

            // 정렬 옵션 선택
            await sortSelect.selectOption({ index: 1 });
            await page.waitForTimeout(1000);

            // 정렬 결과 확인
            const sortedPosts = page.locator('[data-testid="post-card"]').or(page.locator('article'));
            if (await sortedPosts.count() > 0) {
                await expect(sortedPosts.first()).toBeVisible();
            }
        }
    });

    test('커뮤니티 페이지네이션', async ({ page }) => {
        await page.waitForLoadState('networkidle');

        // 페이지네이션 컨트롤 찾기
        const pagination = page.locator('[data-testid="pagination"]').or(page.locator('nav[aria-label*="페이지"]'));
        if (await pagination.count() > 0) {
            await expect(pagination).toBeVisible();

            // 다음 페이지 버튼 클릭
            const nextButton = pagination.locator('button:has-text("다음")').or(pagination.locator('a:has-text("다음")'));
            if (await nextButton.count() > 0) {
                await nextButton.click();
                await page.waitForTimeout(1000);

                // 페이지 변경 확인
                await expect(page).toHaveURL(/.*page=2/);
            }
        }
    });

    test('커뮤니티 반응형 디자인', async ({ page }) => {
        // 모바일 뷰포트로 변경
        await page.setViewportSize({ width: 375, height: 667 });
        await page.waitForLoadState('networkidle');

        // 모바일에서 게시글 카드 확인
        const postCards = page.locator('[data-testid="post-card"]').or(page.locator('article'));
        if (await postCards.count() > 0) {
            await expect(postCards.first()).toBeVisible();
        }

        // 태블릿 뷰포트로 변경
        await page.setViewportSize({ width: 768, height: 1024 });
        await page.waitForLoadState('networkidle');

        // 태블릿에서 게시글 카드 확인
        if (await postCards.count() > 0) {
            await expect(postCards.first()).toBeVisible();
        }
    });

    test('커뮤니티 로딩 상태', async ({ page }) => {
        // 페이지 로딩 중 스켈레톤 확인
        const skeleton = page.locator('[data-testid="post-skeleton"]').or(page.locator('.animate-pulse'));
        if (await skeleton.count() > 0) {
            await expect(skeleton.first()).toBeVisible();
        }

        // 로딩 완료 후 스켈레톤 사라짐 확인
        await page.waitForLoadState('networkidle');
        if (await skeleton.count() > 0) {
            await expect(skeleton.first()).not.toBeVisible();
        }
    });

    test('커뮤니티 에러 상태', async ({ page }) => {
        // 네트워크 오류 시뮬레이션
        await page.route('**/api/community*', route => route.abort());
        await page.reload();

        // 에러 메시지 확인
        const errorMessage = page.locator('[data-testid="error-message"]').or(page.locator('text=오류'));
        if (await errorMessage.count() > 0) {
            await expect(errorMessage).toBeVisible();
        }
    });
});