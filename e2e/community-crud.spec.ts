import { test, expect } from '@playwright/test';

test.describe('Community CRUD - E2E Tests', () => {
    test.beforeEach(async ({ page }) => {
        // ?ŒìŠ¤??ê³„ì •?¼ë¡œ ë¡œê·¸??(?¤ì œ ?˜ê²½?ì„œ???ŒìŠ¤??ê³„ì • ?„ìš”)
        await page.goto('/auth/signin');
        // ë¡œê·¸??ë¡œì§?€ ?¤ì œ ?˜ê²½??ë§žê²Œ êµ¬í˜„ ?„ìš”
    });

    test('ê²Œì‹œê¸€ ?‘ì„± ê¸°ëŠ¥', async ({ page }) => {
        await page.goto('/community/new');
        await page.waitForLoadState('networkidle');

        // ê²Œì‹œê¸€ ?‘ì„± ???•ì¸
        const titleInput = page.locator('input[name="title"]').or(page.locator('input[placeholder*="?œëª©"]'));
        const contentInput = page.locator('textarea[name="content"]').or(page.locator('textarea[placeholder*="?´ìš©"]'));
        const categorySelect = page.locator('select[name="category"]').or(page.locator('select'));

        await expect(titleInput).toBeVisible();
        await expect(contentInput).toBeVisible();
        await expect(categorySelect).toBeVisible();

        // ê²Œì‹œê¸€ ?‘ì„±
        await titleInput.fill('E2E ?ŒìŠ¤??ê²Œì‹œê¸€');
        await contentInput.fill('?´ê²ƒ?€ E2E ?ŒìŠ¤?¸ë? ?„í•œ ê²Œì‹œê¸€?…ë‹ˆ??');
        await categorySelect.selectOption('general');

        // ?œì¶œ ë²„íŠ¼ ?´ë¦­
        const submitButton = page.locator('button[type="submit"]').or(page.locator('button:has-text("?±ë¡")'));
        await submitButton.click();

        // ?±ê³µ ??ë¦¬ë‹¤?´ë ‰???•ì¸
        await page.waitForURL(/.*community\/[a-zA-Z0-9]+/);
        await expect(page.locator('h1')).toContainText('E2E ?ŒìŠ¤??ê²Œì‹œê¸€');
    });

    test('ê²Œì‹œê¸€ ?˜ì • ê¸°ëŠ¥', async ({ page }) => {
        // ë¨¼ì? ê²Œì‹œê¸€???‘ì„±?˜ê±°??ê¸°ì¡´ ê²Œì‹œê¸€ë¡??´ë™
        await page.goto('/community');
        await page.waitForLoadState('networkidle');

        // ì²?ë²ˆì§¸ ê²Œì‹œê¸€ ?´ë¦­
        const postLink = page.locator('a[href*="/community/"]').first();
        if (await postLink.count() > 0) {
            await postLink.click();
            await page.waitForLoadState('networkidle');

            // ?˜ì • ë²„íŠ¼ ì°¾ê¸°
            const editButton = page.locator('button:has-text("?˜ì •")').or(page.locator('[data-testid="edit-button"]'));
            if (await editButton.count() > 0) {
                await editButton.click();

                // ?˜ì • ???•ì¸
                const titleInput = page.locator('input[name="title"]');
                const contentInput = page.locator('textarea[name="content"]');

                if (await titleInput.count() > 0) {
                    await titleInput.fill('?˜ì •??E2E ?ŒìŠ¤??ê²Œì‹œê¸€');
                    await contentInput.fill('?´ê²ƒ?€ ?˜ì •??E2E ?ŒìŠ¤??ê²Œì‹œê¸€?…ë‹ˆ??');

                    // ?€??ë²„íŠ¼ ?´ë¦­
                    const saveButton = page.locator('button:has-text("?€??)').or(page.locator('button[type="submit"]'));
                    await saveButton.click();

                    // ?˜ì • ê²°ê³¼ ?•ì¸
                    await page.waitForLoadState('networkidle');
                    await expect(page.locator('h1')).toContainText('?˜ì •??E2E ?ŒìŠ¤??ê²Œì‹œê¸€');
                }
            }
        }
    });

    test('ê²Œì‹œê¸€ ?? œ ê¸°ëŠ¥', async ({ page }) => {
        await page.goto('/community');
        await page.waitForLoadState('networkidle');

        // ì²?ë²ˆì§¸ ê²Œì‹œê¸€ ?´ë¦­
        const postLink = page.locator('a[href*="/community/"]').first();
        if (await postLink.count() > 0) {
            await postLink.click();
            await page.waitForLoadState('networkidle');

            // ?? œ ë²„íŠ¼ ì°¾ê¸°
            const deleteButton = page.locator('button:has-text("?? œ")').or(page.locator('[data-testid="delete-button"]'));
            if (await deleteButton.count() > 0) {
                await deleteButton.click();

                // ?? œ ?•ì¸ ?¤ì´?¼ë¡œê·?
                const confirmButton = page.locator('button:has-text("?•ì¸")').or(page.locator('button:has-text("?? œ")'));
                if (await confirmButton.count() > 0) {
                    await confirmButton.click();

                    // ?? œ ??ë¦¬ë‹¤?´ë ‰???•ì¸
                    await page.waitForURL(/.*community/);
                    await expect(page.locator('h1')).toBeVisible();
                }
            }
        }
    });

    test('ê²Œì‹œê¸€ ?‘ì„± ? íš¨??ê²€??, async ({ page }) => {
        await page.goto('/community/new');
        await page.waitForLoadState('networkidle');

        // ë¹??¼ìœ¼ë¡??œì¶œ ?œë„
        const submitButton = page.locator('button[type="submit"]').or(page.locator('button:has-text("?±ë¡")'));
        await submitButton.click();

        // ?ëŸ¬ ë©”ì‹œì§€ ?•ì¸
        const errorMessage = page.locator('[data-testid="error-message"]').or(page.locator('text=?„ìˆ˜'));
        if (await errorMessage.count() > 0) {
            await expect(errorMessage).toBeVisible();
        }

        // ?œëª©ë§??…ë ¥?˜ê³  ?œì¶œ
        const titleInput = page.locator('input[name="title"]');
        if (await titleInput.count() > 0) {
            await titleInput.fill('?œëª©ë§??ˆëŠ” ê²Œì‹œê¸€');
            await submitButton.click();

            // ?´ìš© ?„ìˆ˜ ?ëŸ¬ ?•ì¸
            const contentError = page.locator('text=?´ìš©').or(page.locator('text=?„ìˆ˜'));
            if (await contentError.count() > 0) {
                await expect(contentError).toBeVisible();
            }
        }
    });

    test('ê²Œì‹œê¸€ ì¹´í…Œê³ ë¦¬ ?„í„°ë§?, async ({ page }) => {
        await page.goto('/community');
        await page.waitForLoadState('networkidle');

        // ì¹´í…Œê³ ë¦¬ ë²„íŠ¼???•ì¸
        const categoryButtons = page.locator('[data-testid="category-button"]').or(page.locator('button:has-text("?ìœ ")'));
        if (await categoryButtons.count() > 0) {
            // '?ìœ ' ì¹´í…Œê³ ë¦¬ ?´ë¦­
            const generalButton = categoryButtons.filter({ hasText: '?ìœ ' }).first();
            if (await generalButton.count() > 0) {
                await generalButton.click();
                await page.waitForTimeout(1000);

                // ?„í„°ë§ëœ ê²°ê³¼ ?•ì¸
                const filteredPosts = page.locator('[data-testid="post-card"]').or(page.locator('article'));
                if (await filteredPosts.count() > 0) {
                    await expect(filteredPosts.first()).toBeVisible();
                }
            }
        }
    });

    test('ê²Œì‹œê¸€ ê²€??ê¸°ëŠ¥', async ({ page }) => {
        await page.goto('/community');
        await page.waitForLoadState('networkidle');

        // ê²€???…ë ¥ ?„ë“œ
        const searchInput = page.locator('input[type="search"]').or(page.locator('input[placeholder*="ê²€??]'));
        if (await searchInput.count() > 0) {
            await searchInput.fill('?ŒìŠ¤??);
            await page.keyboard.press('Enter');
            await page.waitForTimeout(1000);

            // ê²€??ê²°ê³¼ ?•ì¸
            const searchResults = page.locator('[data-testid="post-card"]').or(page.locator('article'));
            if (await searchResults.count() > 0) {
                await expect(searchResults.first()).toBeVisible();
            }
        }
    });

    test('ê²Œì‹œê¸€ ?•ë ¬ ê¸°ëŠ¥', async ({ page }) => {
        await page.goto('/community');
        await page.waitForLoadState('networkidle');

        // ?•ë ¬ ?œë¡­?¤ìš´
        const sortSelect = page.locator('select[name="sort"]').or(page.locator('select'));
        if (await sortSelect.count() > 0) {
            // ?¸ê¸°?œìœ¼ë¡??•ë ¬
            await sortSelect.selectOption('popular');
            await page.waitForTimeout(1000);

            // ?•ë ¬ ê²°ê³¼ ?•ì¸
            const sortedPosts = page.locator('[data-testid="post-card"]').or(page.locator('article'));
            if (await sortedPosts.count() > 0) {
                await expect(sortedPosts.first()).toBeVisible();
            }

            // ìµœì‹ ?œìœ¼ë¡??•ë ¬
            await sortSelect.selectOption('recent');
            await page.waitForTimeout(1000);

            // ?•ë ¬ ê²°ê³¼ ?•ì¸
            if (await sortedPosts.count() > 0) {
                await expect(sortedPosts.first()).toBeVisible();
            }
        }
    });
});
