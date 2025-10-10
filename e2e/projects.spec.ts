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

        // ?„ë¡œ?íŠ¸ ì¹´ë“œ ?•ì¸
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

            // ?„ë¡œ?íŠ¸ ?ì„¸ ?•ë³´ ?•ì¸
            await expect(page.locator('h1')).toBeVisible();
        }
    });

    test('?„ë¡œ?íŠ¸ ?„í„°ë§?ê¸°ëŠ¥', async ({ page }) => {
        await page.waitForLoadState('networkidle');

        // ì¹´í…Œê³ ë¦¬ ?„í„° ?•ì¸
        const categoryFilter = page.locator('[data-testid="category-filter"]').or(page.locator('select'));
        if (await categoryFilter.count() > 0) {
            await expect(categoryFilter).toBeVisible();

            // ì¹´í…Œê³ ë¦¬ ? íƒ
            await categoryFilter.selectOption({ index: 1 });
            await page.waitForTimeout(1000);

            // ?„í„°ë§?ê²°ê³¼ ?•ì¸
            const filteredCards = page.locator('[data-testid="project-card"]').or(page.locator('article'));
            await expect(filteredCards.first()).toBeVisible();
        }
    });

    test('?„ë¡œ?íŠ¸ ê²€??ê¸°ëŠ¥', async ({ page }) => {
        await page.waitForLoadState('networkidle');

        // ê²€???…ë ¥ ?„ë“œ ì°¾ê¸°
        const searchInput = page.locator('input[type="search"]').or(page.locator('input[placeholder*="ê²€??]'));
        if (await searchInput.count() > 0) {
            await expect(searchInput).toBeVisible();

            // ê²€?‰ì–´ ?…ë ¥
            await searchInput.fill('?ŒìŠ¤??);
            await page.keyboard.press('Enter');
            await page.waitForTimeout(1000);

            // ê²€??ê²°ê³¼ ?•ì¸
            const searchResults = page.locator('[data-testid="project-card"]').or(page.locator('article'));
            if (await searchResults.count() > 0) {
                await expect(searchResults.first()).toBeVisible();
            }
        }
    });

    test('?„ë¡œ?íŠ¸ ?•ë ¬ ê¸°ëŠ¥', async ({ page }) => {
        await page.waitForLoadState('networkidle');

        // ?•ë ¬ ?µì…˜ ì°¾ê¸°
        const sortSelect = page.locator('select[name="sort"]').or(page.locator('select'));
        if (await sortSelect.count() > 0) {
            await expect(sortSelect).toBeVisible();

            // ?•ë ¬ ?µì…˜ ? íƒ
            await sortSelect.selectOption({ index: 1 });
            await page.waitForTimeout(1000);

            // ?•ë ¬ ê²°ê³¼ ?•ì¸
            const sortedCards = page.locator('[data-testid="project-card"]').or(page.locator('article'));
            if (await sortedCards.count() > 0) {
                await expect(sortedCards.first()).toBeVisible();
            }
        }
    });

    test('?„ë¡œ?íŠ¸ ?˜ì´ì§€?¤ì´??, async ({ page }) => {
        await page.waitForLoadState('networkidle');

        // ?˜ì´ì§€?¤ì´??ì»¨íŠ¸ë¡?ì°¾ê¸°
        const pagination = page.locator('[data-testid="pagination"]').or(page.locator('nav[aria-label*="?˜ì´ì§€"]'));
        if (await pagination.count() > 0) {
            await expect(pagination).toBeVisible();

            // ?¤ìŒ ?˜ì´ì§€ ë²„íŠ¼ ?´ë¦­
            const nextButton = pagination.locator('button:has-text("?¤ìŒ")').or(pagination.locator('a:has-text("?¤ìŒ")'));
            if (await nextButton.count() > 0) {
                await nextButton.click();
                await page.waitForTimeout(1000);

                // ?˜ì´ì§€ ë³€ê²??•ì¸
                await expect(page).toHaveURL(/.*page=2/);
            }
        }
    });

    test('?„ë¡œ?íŠ¸ ë°˜ì‘???”ìž??, async ({ page }) => {
        // ëª¨ë°”??ë·°í¬?¸ë¡œ ë³€ê²?
        await page.setViewportSize({ width: 375, height: 667 });
        await page.waitForLoadState('networkidle');

        // ëª¨ë°”?¼ì—???„ë¡œ?íŠ¸ ì¹´ë“œ ?•ì¸
        const projectCards = page.locator('[data-testid="project-card"]').or(page.locator('article'));
        if (await projectCards.count() > 0) {
            await expect(projectCards.first()).toBeVisible();
        }

        // ?œë¸”ë¦?ë·°í¬?¸ë¡œ ë³€ê²?
        await page.setViewportSize({ width: 768, height: 1024 });
        await page.waitForLoadState('networkidle');

        // ?œë¸”ë¦¿ì—???„ë¡œ?íŠ¸ ì¹´ë“œ ?•ì¸
        if (await projectCards.count() > 0) {
            await expect(projectCards.first()).toBeVisible();
        }
    });

    test('?„ë¡œ?íŠ¸ ë¡œë”© ?íƒœ', async ({ page }) => {
        // ?˜ì´ì§€ ë¡œë”© ì¤??¤ì¼ˆ?ˆí†¤ ?•ì¸
        const skeleton = page.locator('[data-testid="project-skeleton"]').or(page.locator('.animate-pulse'));
        if (await skeleton.count() > 0) {
            await expect(skeleton.first()).toBeVisible();
        }

        // ë¡œë”© ?„ë£Œ ???¤ì¼ˆ?ˆí†¤ ?¬ë¼ì§??•ì¸
        await page.waitForLoadState('networkidle');
        if (await skeleton.count() > 0) {
            await expect(skeleton.first()).not.toBeVisible();
        }
    });

    test('?„ë¡œ?íŠ¸ ?ëŸ¬ ?íƒœ', async ({ page }) => {
        // ?¤íŠ¸?Œí¬ ?¤ë¥˜ ?œë??ˆì´??
        await page.route('**/api/projects*', route => route.abort());
        await page.reload();

        // ?ëŸ¬ ë©”ì‹œì§€ ?•ì¸
        const errorMessage = page.locator('[data-testid="error-message"]').or(page.locator('text=?¤ë¥˜'));
        if (await errorMessage.count() > 0) {
            await expect(errorMessage).toBeVisible();
        }
    });
});
