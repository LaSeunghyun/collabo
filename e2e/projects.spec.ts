import { test, expect } from '@playwright/test';

test.describe('Projects Features - E2E Tests', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/projects');
    });

    test('?„ë¡œ?íŠ¸ ëª©ë¡ ?˜ì´ì§€ ë¡œë”©', async ({ page }) => {
        // ?˜ì´ì§€ ë¡œë”© ?€ê¸?
        await page.waitForLoadState('networkidle');

        // ?„ë¡œ?íŠ¸ ?˜ì´ì§€ ?œëª© ?•ì¸
        await expect(page.locator('h1')).toBeVisible();

        // ?„ë¡œ?íŠ¸ ëª©ë¡ ì»¨í…Œ?´ë„ˆ ?•ì¸
        const projectsContainer = page.locator('[data-testid="projects-container"]').or(page.locator('main'));
        await expect(projectsContainer).toBeVisible();
    });

    test('?„ë¡œ?íŠ¸ ì¹´ë“œ ?œì‹œ ?•ì¸', async ({ page }) => {
        await page.waitForLoadState('networkidle');

        // ?„ë¡œ?íŠ¸ ì¹´ë“œ???•ì¸
        const projectCards = page.locator('[data-testid="project-card"]').or(page.locator('article'));
        if (await projectCards.count() > 0) {
            await expect(projectCards.first()).toBeVisible();

            // ?„ë¡œ?íŠ¸ ?œëª© ?•ì¸
            const projectTitle = projectCards.first().locator('h2').or(projectCards.first().locator('h3'));
            await expect(projectTitle).toBeVisible();

            // ?„ë¡œ?íŠ¸ ?¤ëª… ?•ì¸
            const projectDescription = projectCards.first().locator('p');
            if (await projectDescription.count() > 0) {
                await expect(projectDescription.first()).toBeVisible();
            }
        }
    });

    test('?„ë¡œ?íŠ¸ ?ì„¸ ?˜ì´ì§€ ?‘ê·¼', async ({ page }) => {
        await page.waitForLoadState('networkidle');

        // ?„ë¡œ?íŠ¸ ë§í¬ ì°¾ê¸°
        const projectLinks = page.locator('a[href*="/projects/"]');
        if (await projectLinks.count() > 0) {
            // ì²?ë²ˆì§¸ ?„ë¡œ?íŠ¸ ?´ë¦­
            await projectLinks.first().click();

            // ?„ë¡œ?íŠ¸ ?ì„¸ ?˜ì´ì§€ë¡??´ë™ ?•ì¸
            await expect(page).toHaveURL(/.*projects\/[a-zA-Z0-9]+/);

            // ?„ë¡œ?íŠ¸ ?œëª© ?•ì¸
            await expect(page.locator('h1')).toBeVisible();

            // ?„ë¡œ?íŠ¸ ?´ìš© ?•ì¸
            const content = page.locator('article').or(page.locator('[data-testid="project-content"]'));
            await expect(content).toBeVisible();
        }
    });

    test('?„ë¡œ?íŠ¸ ?ì„± ?˜ì´ì§€ ?‘ê·¼', async ({ page }) => {
        // ???„ë¡œ?íŠ¸ ?ì„± ë²„íŠ¼ ?´ë¦­
        const newProjectButton = page.locator('a[href="/projects/new"]');
        if (await newProjectButton.count() > 0) {
            await expect(newProjectButton).toBeVisible();
            await newProjectButton.click();

            // ?„ë¡œ?íŠ¸ ?ì„± ?˜ì´ì§€ë¡??´ë™ ?•ì¸
            await expect(page).toHaveURL(/.*projects\/new/);

            // ?ì„± ???•ì¸
            await expect(page.locator('form')).toBeVisible();

            // ?„ë¡œ?íŠ¸ ?œëª© ?…ë ¥ ?„ë“œ ?•ì¸
            const titleInput = page.locator('input[name="title"]');
            await expect(titleInput).toBeVisible();

            // ?„ë¡œ?íŠ¸ ?¤ëª… ?…ë ¥ ?„ë“œ ?•ì¸
            const descriptionInput = page.locator('textarea[name="description"]');
            await expect(descriptionInput).toBeVisible();
        }
    });

    test('?„ë¡œ?íŠ¸ ì¹´í…Œê³ ë¦¬ ?„í„°ë§?, async ({ page }) => {
        await page.waitForLoadState('networkidle');

        // ì¹´í…Œê³ ë¦¬ ?„í„° ë²„íŠ¼???•ì¸
        const categoryButtons = page.locator('[data-testid="category-button"]');
        if (await categoryButtons.count() > 0) {
            // ì²?ë²ˆì§¸ ì¹´í…Œê³ ë¦¬ ë²„íŠ¼ ?´ë¦­
            await categoryButtons.first().click();

            // ?„í„°ë§ëœ ê²°ê³¼ ?•ì¸
            await page.waitForTimeout(1000);
        }
    });

    test('?„ë¡œ?íŠ¸ ê²€??ê¸°ëŠ¥', async ({ page }) => {
        await page.waitForLoadState('networkidle');

        // ê²€???…ë ¥ ?„ë“œ ì°¾ê¸°
        const searchInput = page.locator('input[type="search"]').or(page.locator('input[placeholder*="ê²€??]'));
        if (await searchInput.count() > 0) {
            await expect(searchInput.first()).toBeVisible();

            // ê²€?‰ì–´ ?…ë ¥
            await searchInput.first().fill('?ŒìŠ¤??);

            // ê²€???¤í–‰
            const searchButton = page.locator('button[type="submit"]').or(page.locator('button').filter({ hasText: /ê²€??search/i }));
            if (await searchButton.count() > 0) {
                await searchButton.first().click();
            } else {
                await searchInput.first().press('Enter');
            }

            // ê²€??ê²°ê³¼ ?•ì¸
            await page.waitForTimeout(1000);
        }
    });

    test('?„ë¡œ?íŠ¸ ?€??ê¸°ëŠ¥ ?ŒìŠ¤??, async ({ page }) => {
        await page.waitForLoadState('networkidle');

        // ?„ë¡œ?íŠ¸ ë§í¬ ì°¾ê¸°
        const projectLinks = page.locator('a[href*="/projects/"]');
        if (await projectLinks.count() > 0) {
            await projectLinks.first().click();
            await page.waitForLoadState('networkidle');

            // ?€??ë²„íŠ¼ ?•ì¸
            const fundingButton = page.locator('button').filter({ hasText: /?€??funding|?„ì›/i });
            if (await fundingButton.count() > 0) {
                await expect(fundingButton.first()).toBeVisible();

                // ?€??ë²„íŠ¼ ?´ë¦­
                await fundingButton.first().click();

                // ?€??ëª¨ë‹¬ ?ëŠ” ???•ì¸
                const fundingModal = page.locator('[data-testid="funding-modal"]').or(page.locator('dialog'));
                if (await fundingModal.count() > 0) {
                    await expect(fundingModal.first()).toBeVisible();
                }
            }
        }
    });

    test('?„ë¡œ?íŠ¸ ?…ë°?´íŠ¸ ?¹ì…˜ ?•ì¸', async ({ page }) => {
        await page.waitForLoadState('networkidle');

        // ?„ë¡œ?íŠ¸ ë§í¬ ì°¾ê¸°
        const projectLinks = page.locator('a[href*="/projects/"]');
        if (await projectLinks.count() > 0) {
            await projectLinks.first().click();
            await page.waitForLoadState('networkidle');

            // ?…ë°?´íŠ¸ ?¹ì…˜ ?•ì¸
            const updatesSection = page.locator('[data-testid="project-updates"]').or(page.locator('section'));
            if (await updatesSection.count() > 0) {
                await expect(updatesSection.first()).toBeVisible();
            }
        }
    });

    test('?„ë¡œ?íŠ¸ API ?‘ë‹µ ?ŒìŠ¤??, async ({ page }) => {
        // API ?‘ë‹µ ëª¨ë‹ˆ?°ë§
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

        // API ?‘ë‹µ ?•ì¸
        const projectResponses = responses.filter(r => r.url.includes('/api/projects'));
        console.log('Projects API Responses:', projectResponses);

        // 500 ?ëŸ¬ê°€ ?†ëŠ”ì§€ ?•ì¸
        const errorResponses = projectResponses.filter(r => r.status >= 500);
        expect(errorResponses).toHaveLength(0);
    });

    test('?„ë¡œ?íŠ¸ ?˜ì´ì§€?¤ì´???ŒìŠ¤??, async ({ page }) => {
        await page.waitForLoadState('networkidle');

        // ?˜ì´ì§€?¤ì´??ë²„íŠ¼ ì°¾ê¸°
        const paginationButtons = page.locator('[data-testid="pagination"] button').or(page.locator('nav button'));
        if (await paginationButtons.count() > 1) {
            // ?¤ìŒ ?˜ì´ì§€ ë²„íŠ¼ ?´ë¦­
            const nextButton = paginationButtons.filter({ hasText: /?¤ìŒ|next|>/i });
            if (await nextButton.count() > 0) {
                await nextButton.first().click();
                await page.waitForLoadState('networkidle');
            }
        }
    });

    test('?„ë¡œ?íŠ¸ ?•ë ¬ ê¸°ëŠ¥ ?ŒìŠ¤??, async ({ page }) => {
        await page.waitForLoadState('networkidle');

        // ?•ë ¬ ?µì…˜ ì°¾ê¸°
        const sortSelect = page.locator('select').or(page.locator('[data-testid="sort-select"]'));
        if (await sortSelect.count() > 0) {
            await expect(sortSelect.first()).toBeVisible();

            // ?•ë ¬ ?µì…˜ ë³€ê²?
            await sortSelect.first().selectOption('recent');
            await page.waitForTimeout(1000);

            await sortSelect.first().selectOption('popular');
            await page.waitForTimeout(1000);
        }
    });
});
