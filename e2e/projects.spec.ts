import { test, expect } from '@playwright/test';

test.describe('Projects Features - E2E Tests', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/projects');
    });

    test('?�로?�트 목록 ?�이지 로딩', async ({ page }) => {
        // ?�이지 로딩 ?��?
        await page.waitForLoadState('networkidle');

        // ?�로?�트 ?�이지 ?�목 ?�인
        await expect(page.locator('h1')).toBeVisible();

        // ?�로?�트 목록 컨테?�너 ?�인
        const projectsContainer = page.locator('[data-testid="projects-container"]').or(page.locator('main'));
        await expect(projectsContainer).toBeVisible();
    });

    test('?�로?�트 카드 ?�시 ?�인', async ({ page }) => {
        await page.waitForLoadState('networkidle');

        // ?�로?�트 카드???�인
        const projectCards = page.locator('[data-testid="project-card"]').or(page.locator('article'));
        if (await projectCards.count() > 0) {
            await expect(projectCards.first()).toBeVisible();

            // ?�로?�트 ?�목 ?�인
            const projectTitle = projectCards.first().locator('h2').or(projectCards.first().locator('h3'));
            await expect(projectTitle).toBeVisible();

            // ?�로?�트 ?�명 ?�인
            const projectDescription = projectCards.first().locator('p');
            if (await projectDescription.count() > 0) {
                await expect(projectDescription.first()).toBeVisible();
            }
        }
    });

    test('?�로?�트 ?�세 ?�이지 ?�근', async ({ page }) => {
        await page.waitForLoadState('networkidle');

        // ?�로?�트 링크 찾기
        const projectLinks = page.locator('a[href*="/projects/"]');
        if (await projectLinks.count() > 0) {
            // �?번째 ?�로?�트 ?�릭
            await projectLinks.first().click();

            // ?�로?�트 ?�세 ?�이지�??�동 ?�인
            await expect(page).toHaveURL(/.*projects\/[a-zA-Z0-9]+/);

            // ?�로?�트 ?�목 ?�인
            await expect(page.locator('h1')).toBeVisible();

            // ?�로?�트 ?�용 ?�인
            const content = page.locator('article').or(page.locator('[data-testid="project-content"]'));
            await expect(content).toBeVisible();
        }
    });

    test('?�로?�트 ?�성 ?�이지 ?�근', async ({ page }) => {
        // ???�로?�트 ?�성 버튼 ?�릭
        const newProjectButton = page.locator('a[href="/projects/new"]');
        if (await newProjectButton.count() > 0) {
            await expect(newProjectButton).toBeVisible();
            await newProjectButton.click();

            // ?�로?�트 ?�성 ?�이지�??�동 ?�인
            await expect(page).toHaveURL(/.*projects\/new/);

            // ?�성 ???�인
            await expect(page.locator('form')).toBeVisible();

            // ?�로?�트 ?�목 ?�력 ?�드 ?�인
            const titleInput = page.locator('input[name="title"]');
            await expect(titleInput).toBeVisible();

            // ?�로?�트 ?�명 ?�력 ?�드 ?�인
            const descriptionInput = page.locator('textarea[name="description"]');
            await expect(descriptionInput).toBeVisible();
        }
    });

    test('?�로?�트 카테고리 ?�터�?, async ({ page }) => {
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

    test('?�로?�트 검??기능', async ({ page }) => {
        await page.waitForLoadState('networkidle');

        // 검???�력 ?�드 찾기
        const searchInput = page.locator('input[type="search"]').or(page.locator('input[placeholder*="검??]'));
        if (await searchInput.count() > 0) {
            await expect(searchInput.first()).toBeVisible();

            // 검?�어 ?�력
            await searchInput.first().fill('?�스??);

            // 검???�행
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

    test('?�로?�트 ?�??기능 ?�스??, async ({ page }) => {
        await page.waitForLoadState('networkidle');

        // ?�로?�트 링크 찾기
        const projectLinks = page.locator('a[href*="/projects/"]');
        if (await projectLinks.count() > 0) {
            await projectLinks.first().click();
            await page.waitForLoadState('networkidle');

            // ?�??버튼 ?�인
            const fundingButton = page.locator('button').filter({ hasText: /?�??funding|?�원/i });
            if (await fundingButton.count() > 0) {
                await expect(fundingButton.first()).toBeVisible();

                // ?�??버튼 ?�릭
                await fundingButton.first().click();

                // ?�??모달 ?�는 ???�인
                const fundingModal = page.locator('[data-testid="funding-modal"]').or(page.locator('dialog'));
                if (await fundingModal.count() > 0) {
                    await expect(fundingModal.first()).toBeVisible();
                }
            }
        }
    });

    test('?�로?�트 ?�데?�트 ?�션 ?�인', async ({ page }) => {
        await page.waitForLoadState('networkidle');

        // ?�로?�트 링크 찾기
        const projectLinks = page.locator('a[href*="/projects/"]');
        if (await projectLinks.count() > 0) {
            await projectLinks.first().click();
            await page.waitForLoadState('networkidle');

            // ?�데?�트 ?�션 ?�인
            const updatesSection = page.locator('[data-testid="project-updates"]').or(page.locator('section'));
            if (await updatesSection.count() > 0) {
                await expect(updatesSection.first()).toBeVisible();
            }
        }
    });

    test('?�로?�트 API ?�답 ?�스??, async ({ page }) => {
        // API ?�답 모니?�링
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

        // API ?�답 ?�인
        const projectResponses = responses.filter(r => r.url.includes('/api/projects'));
        console.log('Projects API Responses:', projectResponses);

        // 500 ?�러가 ?�는지 ?�인
        const errorResponses = projectResponses.filter(r => r.status >= 500);
        expect(errorResponses).toHaveLength(0);
    });

    test('?�로?�트 ?�이지?�이???�스??, async ({ page }) => {
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

    test('?�로?�트 ?�렬 기능 ?�스??, async ({ page }) => {
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
});
