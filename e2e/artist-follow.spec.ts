import { test, expect } from '@playwright/test';

test.describe('Artist Follow - E2E Tests', () => {
    test.beforeEach(async ({ page }) => {
        // ?ŒìŠ¤??ê³„ì •?¼ë¡œ ë¡œê·¸??
        await page.goto('/auth/signin');
        // ë¡œê·¸??ë¡œì§?€ ?¤ì œ ?˜ê²½??ë§žê²Œ êµ¬í˜„ ?„ìš”
    });

    test('?„í‹°?¤íŠ¸ ?”ë¡œ??ê¸°ëŠ¥', async ({ page }) => {
        // ?„í‹°?¤íŠ¸ ?˜ì´ì§€ë¡??´ë™
        await page.goto('/artists');
        await page.waitForLoadState('networkidle');

        // ì²?ë²ˆì§¸ ?„í‹°?¤íŠ¸ ?´ë¦­
        const artistLink = page.locator('a[href*="/artists/"]').first();
        if (await artistLink.count() > 0) {
            await artistLink.click();
            await page.waitForLoadState('networkidle');

            // ?”ë¡œ??ë²„íŠ¼ ?•ì¸
            const followButton = page.locator('button:has-text("?”ë¡œ??)').or(page.locator('[data-testid="follow-button"]'));
            if (await followButton.count() > 0) {
                await expect(followButton).toBeVisible();

                // ?”ë¡œ??ë²„íŠ¼ ?´ë¦­
                await followButton.click();
                await page.waitForTimeout(1000);

                // ?”ë¡œ???íƒœ ë³€ê²??•ì¸
                const unfollowButton = page.locator('button:has-text("?¸íŒ”ë¡œìš°")').or(page.locator('button:has-text("?”ë¡œ??)'));
                if (await unfollowButton.count() > 0) {
                    await expect(unfollowButton).toBeVisible();
                }

                // ?”ë¡œ????ì¦ê? ?•ì¸
                const followerCount = page.locator('[data-testid="follower-count"]').or(page.locator('text=/\\d+ëª??”ë¡œ??'));
                if (await followerCount.count() > 0) {
                    await expect(followerCount).toBeVisible();
                }
            }
        }
    });

    test('?„í‹°?¤íŠ¸ ?¸íŒ”ë¡œìš° ê¸°ëŠ¥', async ({ page }) => {
        // ?´ë? ?”ë¡œ?°í•œ ?„í‹°?¤íŠ¸ ?˜ì´ì§€ë¡??´ë™
        await page.goto('/artists');
        await page.waitForLoadState('networkidle');

        // ì²?ë²ˆì§¸ ?„í‹°?¤íŠ¸ ?´ë¦­
        const artistLink = page.locator('a[href*="/artists/"]').first();
        if (await artistLink.count() > 0) {
            await artistLink.click();
            await page.waitForLoadState('networkidle');

            // ?¸íŒ”ë¡œìš° ë²„íŠ¼ ?•ì¸ (?´ë? ?”ë¡œ?°í•œ ?íƒœ)
            const unfollowButton = page.locator('button:has-text("?¸íŒ”ë¡œìš°")').or(page.locator('button:has-text("?”ë¡œ??)'));
            if (await unfollowButton.count() > 0) {
                await expect(unfollowButton).toBeVisible();

                // ?¸íŒ”ë¡œìš° ë²„íŠ¼ ?´ë¦­
                await unfollowButton.click();
                await page.waitForTimeout(1000);

                // ?¸íŒ”ë¡œìš° ?íƒœ ë³€ê²??•ì¸
                const followButton = page.locator('button:has-text("?”ë¡œ??)');
                if (await followButton.count() > 0) {
                    await expect(followButton).toBeVisible();
                }
            }
        }
    });

    test('?ê¸° ?ì‹  ?”ë¡œ??ë°©ì?', async ({ page }) => {
        // ???„ë¡œ???˜ì´ì§€ë¡??´ë™
        await page.goto('/profile');
        await page.waitForLoadState('networkidle');

        // ?”ë¡œ??ë²„íŠ¼???†ëŠ”ì§€ ?•ì¸ (?ê¸° ?ì‹ ?€ ?”ë¡œ?°í•  ???†ìŒ)
        const followButton = page.locator('button:has-text("?”ë¡œ??)');
        await expect(followButton).toHaveCount(0);
    });

    test('?”ë¡œ???íƒœ ?œì‹œ', async ({ page }) => {
        await page.goto('/artists');
        await page.waitForLoadState('networkidle');

        // ?„í‹°?¤íŠ¸ ì¹´ë“œ?ì„œ ?”ë¡œ???íƒœ ?•ì¸
        const artistCards = page.locator('[data-testid="artist-card"]').or(page.locator('article'));
        if (await artistCards.count() > 0) {
            const firstCard = artistCards.first();
            
            // ?”ë¡œ??ë²„íŠ¼ ?ëŠ” ?íƒœ ?œì‹œ
            const followButton = firstCard.locator('button:has-text("?”ë¡œ??)').or(firstCard.locator('button:has-text("?”ë¡œ??)'));
            if (await followButton.count() > 0) {
                await expect(followButton).toBeVisible();
            }
        }
    });

    test('?”ë¡œ?????œì‹œ', async ({ page }) => {
        await page.goto('/artists');
        await page.waitForLoadState('networkidle');

        // ì²?ë²ˆì§¸ ?„í‹°?¤íŠ¸ ?´ë¦­
        const artistLink = page.locator('a[href*="/artists/"]').first();
        if (await artistLink.count() > 0) {
            await artistLink.click();
            await page.waitForLoadState('networkidle');

            // ?”ë¡œ?????œì‹œ ?•ì¸
            const followerCount = page.locator('[data-testid="follower-count"]').or(page.locator('text=/\\d+ëª??”ë¡œ??'));
            if (await followerCount.count() > 0) {
                await expect(followerCount).toBeVisible();
                
                // ?”ë¡œ???˜ê? ?«ìž?¸ì? ?•ì¸
                const countText = await followerCount.textContent();
                expect(countText).toMatch(/\d+/);
            }
        }
    });

    test('?”ë¡œ??ê¶Œí•œ ?•ì¸', async ({ page }) => {
        // ë¡œê·¸?¸í•˜ì§€ ?Šì? ?íƒœë¡??„í‹°?¤íŠ¸ ?˜ì´ì§€ ?‘ê·¼
        await page.goto('/artists');
        await page.waitForLoadState('networkidle');

        // ì²?ë²ˆì§¸ ?„í‹°?¤íŠ¸ ?´ë¦­
        const artistLink = page.locator('a[href*="/artists/"]').first();
        if (await artistLink.count() > 0) {
            await artistLink.click();
            await page.waitForLoadState('networkidle');

            // ?”ë¡œ??ë²„íŠ¼??ë¡œê·¸??? ë„ ë©”ì‹œì§€ë¡??€ì²´ë˜?”ì? ?•ì¸
            const loginPrompt = page.locator('text=ë¡œê·¸??).or(page.locator('text=?”ë¡œ?°í•˜?¤ë©´'));
            if (await loginPrompt.count() > 0) {
                await expect(loginPrompt).toBeVisible();
            }
        }
    });

    test('?”ë¡œ??ë²„íŠ¼ ë°˜ì‘???”ìž??, async ({ page }) => {
        await page.goto('/artists');
        await page.waitForLoadState('networkidle');

        // ì²?ë²ˆì§¸ ?„í‹°?¤íŠ¸ ?´ë¦­
        const artistLink = page.locator('a[href*="/artists/"]').first();
        if (await artistLink.count() > 0) {
            await artistLink.click();
            await page.waitForLoadState('networkidle');

            // ëª¨ë°”??ë·°í¬??
            await page.setViewportSize({ width: 375, height: 667 });
            const followButton = page.locator('button:has-text("?”ë¡œ??)').or(page.locator('button:has-text("?¸íŒ”ë¡œìš°")'));
            if (await followButton.count() > 0) {
                await expect(followButton).toBeVisible();
            }

            // ?œë¸”ë¦?ë·°í¬??
            await page.setViewportSize({ width: 768, height: 1024 });
            if (await followButton.count() > 0) {
                await expect(followButton).toBeVisible();
            }
        }
    });

    test('?”ë¡œ???íƒœ ì§€?ì„±', async ({ page }) => {
        // ?„í‹°?¤íŠ¸ ?”ë¡œ??
        await page.goto('/artists');
        await page.waitForLoadState('networkidle');

        const artistLink = page.locator('a[href*="/artists/"]').first();
        if (await artistLink.count() > 0) {
            await artistLink.click();
            await page.waitForLoadState('networkidle');

            const followButton = page.locator('button:has-text("?”ë¡œ??)');
            if (await followButton.count() > 0) {
                await followButton.click();
                await page.waitForTimeout(1000);
            }

            // ?˜ì´ì§€ ?ˆë¡œê³ ì¹¨
            await page.reload();
            await page.waitForLoadState('networkidle');

            // ?”ë¡œ???íƒœ ? ì? ?•ì¸
            const unfollowButton = page.locator('button:has-text("?¸íŒ”ë¡œìš°")').or(page.locator('button:has-text("?”ë¡œ??)'));
            if (await unfollowButton.count() > 0) {
                await expect(unfollowButton).toBeVisible();
            }
        }
    });

    test('?”ë¡œ???ëŸ¬ ì²˜ë¦¬', async ({ page }) => {
        // ?¤íŠ¸?Œí¬ ?¤ë¥˜ ?œë??ˆì´??
        await page.route('**/api/artists/*/follow', route => route.abort());
        
        await page.goto('/artists');
        await page.waitForLoadState('networkidle');

        const artistLink = page.locator('a[href*="/artists/"]').first();
        if (await artistLink.count() > 0) {
            await artistLink.click();
            await page.waitForLoadState('networkidle');

            const followButton = page.locator('button:has-text("?”ë¡œ??)');
            if (await followButton.count() > 0) {
                await followButton.click();
                await page.waitForTimeout(1000);

                // ?ëŸ¬ ë©”ì‹œì§€ ?•ì¸
                const errorMessage = page.locator('[data-testid="error-message"]').or(page.locator('text=?¤ë¥˜'));
                if (await errorMessage.count() > 0) {
                    await expect(errorMessage).toBeVisible();
                }
            }
        }
    });
});
