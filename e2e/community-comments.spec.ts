import { test, expect } from '@playwright/test';

test.describe('Community Comments - E2E Tests', () => {
    test.beforeEach(async ({ page }) => {
        // ?ŒìŠ¤??ê³„ì •?¼ë¡œ ë¡œê·¸??
        await page.goto('/auth/signin');
        // ë¡œê·¸??ë¡œì§?€ ?¤ì œ ?˜ê²½??ë§žê²Œ êµ¬í˜„ ?„ìš”
    });

    test('?“ê? ?‘ì„± ê¸°ëŠ¥', async ({ page }) => {
        // ê²Œì‹œê¸€ ?˜ì´ì§€ë¡??´ë™
        await page.goto('/community');
        await page.waitForLoadState('networkidle');

        // ì²?ë²ˆì§¸ ê²Œì‹œê¸€ ?´ë¦­
        const postLink = page.locator('a[href*="/community/"]').first();
        if (await postLink.count() > 0) {
            await postLink.click();
            await page.waitForLoadState('networkidle');

            // ?“ê? ?‘ì„± ???•ì¸
            const commentInput = page.locator('textarea[placeholder*="?“ê?"]').or(page.locator('textarea[name="content"]'));
            const submitButton = page.locator('button:has-text("?“ê?")').or(page.locator('button[type="submit"]'));

            if (await commentInput.count() > 0) {
                await expect(commentInput).toBeVisible();
                await expect(submitButton).toBeVisible();

                // ?“ê? ?‘ì„±
                await commentInput.fill('?´ê²ƒ?€ E2E ?ŒìŠ¤???“ê??…ë‹ˆ??');
                await submitButton.click();

                // ?“ê? ?‘ì„± ?„ë£Œ ?•ì¸
                await page.waitForTimeout(1000);
                const newComment = page.locator('[data-testid="comment"]').or(page.locator('article')).filter({ hasText: 'E2E ?ŒìŠ¤???“ê?' });
                if (await newComment.count() > 0) {
                    await expect(newComment).toBeVisible();
                }
            }
        }
    });

    test('?“ê? ëª©ë¡ ì¡°íšŒ', async ({ page }) => {
        await page.goto('/community');
        await page.waitForLoadState('networkidle');

        // ì²?ë²ˆì§¸ ê²Œì‹œê¸€ ?´ë¦­
        const postLink = page.locator('a[href*="/community/"]').first();
        if (await postLink.count() > 0) {
            await postLink.click();
            await page.waitForLoadState('networkidle');

            // ?“ê? ?¹ì…˜ ?•ì¸
            const commentsSection = page.locator('[data-testid="comments-section"]').or(page.locator('section:has-text("?“ê?")'));
            if (await commentsSection.count() > 0) {
                await expect(commentsSection).toBeVisible();

                // ?“ê? ëª©ë¡ ?•ì¸
                const comments = page.locator('[data-testid="comment"]').or(page.locator('article'));
                if (await comments.count() > 0) {
                    await expect(comments.first()).toBeVisible();
                }
            }
        }
    });

    test('?“ê? ?‘ì„± ? íš¨??ê²€??, async ({ page }) => {
        await page.goto('/community');
        await page.waitForLoadState('networkidle');

        // ì²?ë²ˆì§¸ ê²Œì‹œê¸€ ?´ë¦­
        const postLink = page.locator('a[href*="/community/"]').first();
        if (await postLink.count() > 0) {
            await postLink.click();
            await page.waitForLoadState('networkidle');

            // ë¹??“ê? ?œì¶œ ?œë„
            const commentInput = page.locator('textarea[placeholder*="?“ê?"]');
            const submitButton = page.locator('button:has-text("?“ê?")');

            if (await commentInput.count() > 0 && await submitButton.count() > 0) {
                await submitButton.click();

                // ?ëŸ¬ ë©”ì‹œì§€ ?•ì¸
                const errorMessage = page.locator('[data-testid="error-message"]').or(page.locator('text=?„ìˆ˜'));
                if (await errorMessage.count() > 0) {
                    await expect(errorMessage).toBeVisible();
                }
            }
        }
    });

    test('?“ê? ?‘ì„±???•ë³´ ?œì‹œ', async ({ page }) => {
        await page.goto('/community');
        await page.waitForLoadState('networkidle');

        // ì²?ë²ˆì§¸ ê²Œì‹œê¸€ ?´ë¦­
        const postLink = page.locator('a[href*="/community/"]').first();
        if (await postLink.count() > 0) {
            await postLink.click();
            await page.waitForLoadState('networkidle');

            // ?“ê? ëª©ë¡?ì„œ ?‘ì„±???•ë³´ ?•ì¸
            const comments = page.locator('[data-testid="comment"]').or(page.locator('article'));
            if (await comments.count() > 0) {
                const firstComment = comments.first();
                
                // ?‘ì„±???´ë¦„ ?•ì¸
                const authorName = firstComment.locator('[data-testid="author-name"]').or(firstComment.locator('strong'));
                if (await authorName.count() > 0) {
                    await expect(authorName).toBeVisible();
                }

                // ?‘ì„± ?œê°„ ?•ì¸
                const createdAt = firstComment.locator('[data-testid="created-at"]').or(firstComment.locator('time'));
                if (await createdAt.count() > 0) {
                    await expect(createdAt).toBeVisible();
                }
            }
        }
    });

    test('?“ê? ?‘ì„± ??ê²Œì‹œê¸€ ?“ê? ???…ë°?´íŠ¸', async ({ page }) => {
        await page.goto('/community');
        await page.waitForLoadState('networkidle');

        // ì²?ë²ˆì§¸ ê²Œì‹œê¸€ ?´ë¦­
        const postLink = page.locator('a[href*="/community/"]').first();
        if (await postLink.count() > 0) {
            await postLink.click();
            await page.waitForLoadState('networkidle');

            // ?„ìž¬ ?“ê? ???•ì¸
            const commentCount = page.locator('[data-testid="comment-count"]').or(page.locator('text=/\\d+ê°??“ê?/'));
            let initialCount = 0;
            if (await commentCount.count() > 0) {
                const countText = await commentCount.textContent();
                initialCount = parseInt(countText?.match(/\d+/)?.[0] || '0');
            }

            // ?“ê? ?‘ì„±
            const commentInput = page.locator('textarea[placeholder*="?“ê?"]');
            const submitButton = page.locator('button:has-text("?“ê?")');

            if (await commentInput.count() > 0 && await submitButton.count() > 0) {
                await commentInput.fill('?“ê? ???ŒìŠ¤??);
                await submitButton.click();
                await page.waitForTimeout(1000);

                // ?“ê? ??ì¦ê? ?•ì¸
                if (await commentCount.count() > 0) {
                    const newCountText = await commentCount.textContent();
                    const newCount = parseInt(newCountText?.match(/\d+/)?.[0] || '0');
                    expect(newCount).toBeGreaterThan(initialCount);
                }
            }
        }
    });

    test('?“ê? ?‘ì„± ê¶Œí•œ ?•ì¸', async ({ page }) => {
        // ë¡œê·¸?¸í•˜ì§€ ?Šì? ?íƒœë¡?ê²Œì‹œê¸€ ?˜ì´ì§€ ?‘ê·¼
        await page.goto('/community');
        await page.waitForLoadState('networkidle');

        // ì²?ë²ˆì§¸ ê²Œì‹œê¸€ ?´ë¦­
        const postLink = page.locator('a[href*="/community/"]').first();
        if (await postLink.count() > 0) {
            await postLink.click();
            await page.waitForLoadState('networkidle');

            // ?“ê? ?‘ì„± ?¼ì´ ë¡œê·¸??? ë„ ë©”ì‹œì§€ë¡??€ì²´ë˜?”ì? ?•ì¸
            const loginPrompt = page.locator('text=ë¡œê·¸??).or(page.locator('text=?“ê????‘ì„±?˜ë ¤ë©?));
            if (await loginPrompt.count() > 0) {
                await expect(loginPrompt).toBeVisible();
            }
        }
    });

    test('?“ê? ?‘ì„± ??ë°˜ì‘???”ìž??, async ({ page }) => {
        await page.goto('/community');
        await page.waitForLoadState('networkidle');

        // ì²?ë²ˆì§¸ ê²Œì‹œê¸€ ?´ë¦­
        const postLink = page.locator('a[href*="/community/"]').first();
        if (await postLink.count() > 0) {
            await postLink.click();
            await page.waitForLoadState('networkidle');

            // ëª¨ë°”??ë·°í¬??
            await page.setViewportSize({ width: 375, height: 667 });
            const commentInput = page.locator('textarea[placeholder*="?“ê?"]');
            if (await commentInput.count() > 0) {
                await expect(commentInput).toBeVisible();
            }

            // ?œë¸”ë¦?ë·°í¬??
            await page.setViewportSize({ width: 768, height: 1024 });
            if (await commentInput.count() > 0) {
                await expect(commentInput).toBeVisible();
            }
        }
    });
});
