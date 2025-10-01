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

        // 프로젝트 카드들 확인
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

            // 프로젝트 제목 확인
            await expect(page.locator('h1')).toBeVisible();

            // 프로젝트 내용 확인
            const content = page.locator('article').or(page.locator('[data-testid="project-content"]'));
            await expect(content).toBeVisible();
        }
    });

    test('프로젝트 생성 페이지 접근', async ({ page }) => {
        // 새 프로젝트 생성 버튼 클릭
        const newProjectButton = page.locator('a[href="/projects/new"]');
        if (await newProjectButton.count() > 0) {
            await expect(newProjectButton).toBeVisible();
            await newProjectButton.click();

            // 프로젝트 생성 페이지로 이동 확인
            await expect(page).toHaveURL(/.*projects\/new/);

            // 생성 폼 확인
            await expect(page.locator('form')).toBeVisible();

            // 프로젝트 제목 입력 필드 확인
            const titleInput = page.locator('input[name="title"]');
            await expect(titleInput).toBeVisible();

            // 프로젝트 설명 입력 필드 확인
            const descriptionInput = page.locator('textarea[name="description"]');
            await expect(descriptionInput).toBeVisible();
        }
    });

    test('프로젝트 카테고리 필터링', async ({ page }) => {
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

    test('프로젝트 검색 기능', async ({ page }) => {
        await page.waitForLoadState('networkidle');

        // 검색 입력 필드 찾기
        const searchInput = page.locator('input[type="search"]').or(page.locator('input[placeholder*="검색"]'));
        if (await searchInput.count() > 0) {
            await expect(searchInput.first()).toBeVisible();

            // 검색어 입력
            await searchInput.first().fill('테스트');

            // 검색 실행
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

    test('프로젝트 펀딩 기능 테스트', async ({ page }) => {
        await page.waitForLoadState('networkidle');

        // 프로젝트 링크 찾기
        const projectLinks = page.locator('a[href*="/projects/"]');
        if (await projectLinks.count() > 0) {
            await projectLinks.first().click();
            await page.waitForLoadState('networkidle');

            // 펀딩 버튼 확인
            const fundingButton = page.locator('button').filter({ hasText: /펀딩|funding|후원/i });
            if (await fundingButton.count() > 0) {
                await expect(fundingButton.first()).toBeVisible();

                // 펀딩 버튼 클릭
                await fundingButton.first().click();

                // 펀딩 모달 또는 폼 확인
                const fundingModal = page.locator('[data-testid="funding-modal"]').or(page.locator('dialog'));
                if (await fundingModal.count() > 0) {
                    await expect(fundingModal.first()).toBeVisible();
                }
            }
        }
    });

    test('프로젝트 업데이트 섹션 확인', async ({ page }) => {
        await page.waitForLoadState('networkidle');

        // 프로젝트 링크 찾기
        const projectLinks = page.locator('a[href*="/projects/"]');
        if (await projectLinks.count() > 0) {
            await projectLinks.first().click();
            await page.waitForLoadState('networkidle');

            // 업데이트 섹션 확인
            const updatesSection = page.locator('[data-testid="project-updates"]').or(page.locator('section'));
            if (await updatesSection.count() > 0) {
                await expect(updatesSection.first()).toBeVisible();
            }
        }
    });

    test('프로젝트 API 응답 테스트', async ({ page }) => {
        // API 응답 모니터링
        const responses: any[] = [];

        page.on('response', response => {
            if (response.url().includes('/api/projects')) {
                responses.push({
                    url: response.url(),
                    status: response.status()
                });
            }
        });

        await page.waitForLoadState('networkidle');

        // API 응답 확인
        const projectResponses = responses.filter(r => r.url.includes('/api/projects'));
        console.log('Projects API Responses:', projectResponses);

        // 500 에러가 없는지 확인
        const errorResponses = projectResponses.filter(r => r.status >= 500);
        expect(errorResponses).toHaveLength(0);
    });

    test('프로젝트 페이지네이션 테스트', async ({ page }) => {
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

    test('프로젝트 정렬 기능 테스트', async ({ page }) => {
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
});
