import { test, expect } from '@playwright/test';

test.describe('Projects Features - E2E Tests', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/projects');
    });

    test('프로젝트 목록 페이지 로딩', async ({ page }) => {
        // 페이지 로딩 대기
        await page.waitForLoadState('networkidle');

        // 프로젝트 페이지 제목 확인
        await expect(page.locator('h1')).toBeVisible();

        // 프로젝트 목록 컨테이너 확인
        const projectsContainer = page.locator('[data-testid="projects-container"]').or(page.locator('main'));
        await expect(projectsContainer).toBeVisible();
    });

    test('프로젝트 카드 표시 확인', async ({ page }) => {
        await page.waitForLoadState('networkidle');

        // 프로젝트 카드 확인
        const projectCards = page.locator('[data-testid="project-card"]').or(page.locator('article'));
        if (await projectCards.count() > 0) {
            await expect(projectCards.first()).toBeVisible();

            // 프로젝트 제목 확인
            const projectTitle = projectCards.first().locator('h2').or(projectCards.first().locator('h3'));
            await expect(projectTitle).toBeVisible();

            // 프로젝트 설명 확인
            const projectDescription = projectCards.first().locator('p');
            if (await projectDescription.count() > 0) {
                await expect(projectDescription.first()).toBeVisible();
            }
        }
    });

    test('프로젝트 상세 페이지 접근', async ({ page }) => {
        await page.waitForLoadState('networkidle');

        // 프로젝트 링크 찾기
        const projectLinks = page.locator('a[href*="/projects/"]');
        if (await projectLinks.count() > 0) {
            // 첫 번째 프로젝트 클릭
            await projectLinks.first().click();

            // 프로젝트 상세 페이지로 이동 확인
            await expect(page).toHaveURL(/.*projects\/[a-zA-Z0-9]+/);

            // 프로젝트 상세 정보 확인
            await expect(page.locator('h1')).toBeVisible();
        }
    });

    test('프로젝트 필터링 기능', async ({ page }) => {
        await page.waitForLoadState('networkidle');

        // 카테고리 필터 확인
        const categoryFilter = page.locator('[data-testid="category-filter"]').or(page.locator('select'));
        if (await categoryFilter.count() > 0) {
            await expect(categoryFilter).toBeVisible();

            // 카테고리 선택
            await categoryFilter.selectOption({ index: 1 });
            await page.waitForTimeout(1000);

            // 필터링 결과 확인
            const filteredCards = page.locator('[data-testid="project-card"]').or(page.locator('article'));
            await expect(filteredCards.first()).toBeVisible();
        }
    });

    test('프로젝트 검색 기능', async ({ page }) => {
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
            const searchResults = page.locator('[data-testid="project-card"]').or(page.locator('article'));
            if (await searchResults.count() > 0) {
                await expect(searchResults.first()).toBeVisible();
            }
        }
    });

    test('프로젝트 정렬 기능', async ({ page }) => {
        await page.waitForLoadState('networkidle');

        // 정렬 옵션 찾기
        const sortSelect = page.locator('select[name="sort"]').or(page.locator('select'));
        if (await sortSelect.count() > 0) {
            await expect(sortSelect).toBeVisible();

            // 정렬 옵션 선택
            await sortSelect.selectOption({ index: 1 });
            await page.waitForTimeout(1000);

            // 정렬 결과 확인
            const sortedCards = page.locator('[data-testid="project-card"]').or(page.locator('article'));
            if (await sortedCards.count() > 0) {
                await expect(sortedCards.first()).toBeVisible();
            }
        }
    });

    test('프로젝트 페이지네이션', async ({ page }) => {
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

    test('프로젝트 반응형 디자인', async ({ page }) => {
        // 모바일 뷰포트로 변경
        await page.setViewportSize({ width: 375, height: 667 });
        await page.waitForLoadState('networkidle');

        // 모바일에서 프로젝트 카드 확인
        const projectCards = page.locator('[data-testid="project-card"]').or(page.locator('article'));
        if (await projectCards.count() > 0) {
            await expect(projectCards.first()).toBeVisible();
        }

        // 태블릿 뷰포트로 변경
        await page.setViewportSize({ width: 768, height: 1024 });
        await page.waitForLoadState('networkidle');

        // 태블릿에서 프로젝트 카드 확인
        if (await projectCards.count() > 0) {
            await expect(projectCards.first()).toBeVisible();
        }
    });

    test('프로젝트 로딩 상태', async ({ page }) => {
        // 페이지 로딩 중 스켈레톤 확인
        const skeleton = page.locator('[data-testid="project-skeleton"]').or(page.locator('.animate-pulse'));
        if (await skeleton.count() > 0) {
            await expect(skeleton.first()).toBeVisible();
        }

        // 로딩 완료 후 스켈레톤 사라짐 확인
        await page.waitForLoadState('networkidle');
        if (await skeleton.count() > 0) {
            await expect(skeleton.first()).not.toBeVisible();
        }
    });

    test('프로젝트 에러 상태', async ({ page }) => {
        // 네트워크 오류 시뮬레이션
        await page.route('**/api/projects*', route => route.abort());
        await page.reload();

        // 에러 메시지 확인
        const errorMessage = page.locator('[data-testid="error-message"]').or(page.locator('text=오류'));
        if (await errorMessage.count() > 0) {
            await expect(errorMessage).toBeVisible();
        }
    });
});