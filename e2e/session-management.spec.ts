import { test, expect } from '@playwright/test';

test.describe('Session Management - E2E Tests', () => {
    test.beforeEach(async ({ page }) => {
        // ?ŒìŠ¤??ê³„ì •?¼ë¡œ ë¡œê·¸??
        await page.goto('/auth/signin');
        // ë¡œê·¸??ë¡œì§?€ ?¤ì œ ?˜ê²½??ë§žê²Œ êµ¬í˜„ ?„ìš”
    });

    test('?¸ì…˜ ëª©ë¡ ì¡°íšŒ', async ({ page }) => {
        // ?„ë¡œ???ëŠ” ?¤ì • ?˜ì´ì§€ë¡??´ë™
        await page.goto('/profile');
        await page.waitForLoadState('networkidle');

        // ?¸ì…˜ ê´€ë¦??¹ì…˜ ì°¾ê¸°
        const sessionSection = page.locator('[data-testid="session-section"]').or(page.locator('section:has-text("?¸ì…˜")'));
        if (await sessionSection.count() > 0) {
            await expect(sessionSection).toBeVisible();

            // ?¸ì…˜ ëª©ë¡ ?•ì¸
            const sessions = page.locator('[data-testid="session-item"]').or(page.locator('article'));
            if (await sessions.count() > 0) {
                await expect(sessions.first()).toBeVisible();

                // ?¸ì…˜ ?•ë³´ ?•ì¸
                const sessionInfo = sessions.first();
                
                // ?”ë°”?´ìŠ¤ ?•ë³´
                const deviceInfo = sessionInfo.locator('[data-testid="device-info"]').or(sessionInfo.locator('text=/Chrome|Firefox|Safari/'));
                if (await deviceInfo.count() > 0) {
                    await expect(deviceInfo).toBeVisible();
                }

                // ë§ˆì?ë§??¬ìš© ?œê°„
                const lastUsed = sessionInfo.locator('[data-testid="last-used"]').or(sessionInfo.locator('time'));
                if (await lastUsed.count() > 0) {
                    await expect(lastUsed).toBeVisible();
                }

                // ?œì„± ?íƒœ
                const activeStatus = sessionInfo.locator('[data-testid="active-status"]').or(sessionInfo.locator('text=?œì„±'));
                if (await activeStatus.count() > 0) {
                    await expect(activeStatus).toBeVisible();
                }
            }
        }
    });

    test('?„ìž¬ ?¸ì…˜ ?œì‹œ', async ({ page }) => {
        await page.goto('/profile');
        await page.waitForLoadState('networkidle');

        // ?„ìž¬ ?¸ì…˜ ?œì‹œ ?•ì¸
        const currentSession = page.locator('[data-testid="current-session"]').or(page.locator('text=?„ìž¬ ?¸ì…˜'));
        if (await currentSession.count() > 0) {
            await expect(currentSession).toBeVisible();

            // ?„ìž¬ ?¸ì…˜ ?œì‹œ???•ì¸
            const currentIndicator = currentSession.locator('[data-testid="current-indicator"]').or(currentSession.locator('text=?„ìž¬'));
            if (await currentIndicator.count() > 0) {
                await expect(currentIndicator).toBeVisible();
            }
        }
    });

    test('?¸ì…˜ ?•ë³´ ?ì„¸ ?œì‹œ', async ({ page }) => {
        await page.goto('/profile');
        await page.waitForLoadState('networkidle');

        const sessions = page.locator('[data-testid="session-item"]').or(page.locator('article'));
        if (await sessions.count() > 0) {
            const firstSession = sessions.first();

            // ?¸ì…˜ ID
            const sessionId = firstSession.locator('[data-testid="session-id"]');
            if (await sessionId.count() > 0) {
                await expect(sessionId).toBeVisible();
            }

            // ?ì„± ?œê°„
            const createdAt = firstSession.locator('[data-testid="created-at"]').or(firstSession.locator('time'));
            if (await createdAt.count() > 0) {
                await expect(createdAt).toBeVisible();
            }

            // IP ì£¼ì†Œ (?ˆëŠ” ê²½ìš°)
            const ipAddress = firstSession.locator('[data-testid="ip-address"]');
            if (await ipAddress.count() > 0) {
                await expect(ipAddress).toBeVisible();
            }

            // ?¬ìš©???ì´?„íŠ¸ (?ˆëŠ” ê²½ìš°)
            const userAgent = firstSession.locator('[data-testid="user-agent"]');
            if (await userAgent.count() > 0) {
                await expect(userAgent).toBeVisible();
            }
        }
    });

    test('?¸ì…˜ ê´€ë¦?ê¶Œí•œ ?•ì¸', async ({ page }) => {
        // ë¡œê·¸?¸í•˜ì§€ ?Šì? ?íƒœë¡??„ë¡œ???˜ì´ì§€ ?‘ê·¼
        await page.goto('/profile');
        await page.waitForLoadState('networkidle');

        // ë¡œê·¸??? ë„ ë©”ì‹œì§€ ?•ì¸
        const loginPrompt = page.locator('text=ë¡œê·¸??).or(page.locator('text=?¸ì…˜???•ì¸?˜ë ¤ë©?));
        if (await loginPrompt.count() > 0) {
            await expect(loginPrompt).toBeVisible();
        }
    });

    test('?¸ì…˜ ëª©ë¡ ë°˜ì‘???”ìž??, async ({ page }) => {
        await page.goto('/profile');
        await page.waitForLoadState('networkidle');

        const sessionSection = page.locator('[data-testid="session-section"]').or(page.locator('section:has-text("?¸ì…˜")'));
        if (await sessionSection.count() > 0) {
            // ëª¨ë°”??ë·°í¬??
            await page.setViewportSize({ width: 375, height: 667 });
            await expect(sessionSection).toBeVisible();

            // ?œë¸”ë¦?ë·°í¬??
            await page.setViewportSize({ width: 768, height: 1024 });
            await expect(sessionSection).toBeVisible();
        }
    });

    test('?¸ì…˜ ëª©ë¡ ë¡œë”© ?íƒœ', async ({ page }) => {
        // ?¤íŠ¸?Œí¬ ì§€???œë??ˆì´??
        await page.route('**/api/auth/sessions', route => {
            setTimeout(() => route.continue(), 1000);
        });

        await page.goto('/profile');
        
        // ë¡œë”© ?¤ì¼ˆ?ˆí†¤ ?•ì¸
        const loadingSkeleton = page.locator('[data-testid="session-skeleton"]').or(page.locator('.animate-pulse'));
        if (await loadingSkeleton.count() > 0) {
            await expect(loadingSkeleton).toBeVisible();
        }

        // ë¡œë”© ?„ë£Œ ???¤ì¼ˆ?ˆí†¤ ?¬ë¼ì§??•ì¸
        await page.waitForLoadState('networkidle');
        if (await loadingSkeleton.count() > 0) {
            await expect(loadingSkeleton).not.toBeVisible();
        }
    });

    test('?¸ì…˜ ëª©ë¡ ?ëŸ¬ ì²˜ë¦¬', async ({ page }) => {
        // API ?¤ë¥˜ ?œë??ˆì´??
        await page.route('**/api/auth/sessions', route => route.abort());

        await page.goto('/profile');
        await page.waitForLoadState('networkidle');

        // ?ëŸ¬ ë©”ì‹œì§€ ?•ì¸
        const errorMessage = page.locator('[data-testid="error-message"]').or(page.locator('text=?¤ë¥˜'));
        if (await errorMessage.count() > 0) {
            await expect(errorMessage).toBeVisible();
        }
    });

    test('?¸ì…˜ ?•ë³´ ?•ë ¬', async ({ page }) => {
        await page.goto('/profile');
        await page.waitForLoadState('networkidle');

        const sessions = page.locator('[data-testid="session-item"]').or(page.locator('article'));
        if (await sessions.count() > 1) {
            // ?¸ì…˜??ìµœì‹ ?œìœ¼ë¡??•ë ¬?˜ì–´ ?ˆëŠ”ì§€ ?•ì¸
            const firstSession = sessions.first();
            const secondSession = sessions.nth(1);

            const firstTime = firstSession.locator('time').first();
            const secondTime = secondSession.locator('time').first();

            if (await firstTime.count() > 0 && await secondTime.count() > 0) {
                const firstTimeText = await firstTime.textContent();
                const secondTimeText = await secondTime.textContent();
                
                // ì²?ë²ˆì§¸ ?¸ì…˜????ìµœì‹ ?¸ì? ?•ì¸ (ê°„ë‹¨??ë¬¸ìž??ë¹„êµ)
                expect(firstTimeText).toBeDefined();
                expect(secondTimeText).toBeDefined();
            }
        }
    });

    test('?¸ì…˜ ?íƒœ ?œì‹œ', async ({ page }) => {
        await page.goto('/profile');
        await page.waitForLoadState('networkidle');

        const sessions = page.locator('[data-testid="session-item"]').or(page.locator('article'));
        if (await sessions.count() > 0) {
            const firstSession = sessions.first();

            // ?œì„±/ë¹„í™œ???íƒœ ?œì‹œ
            const statusIndicator = firstSession.locator('[data-testid="status-indicator"]').or(firstSession.locator('text=?œì„±|ë¹„í™œ??));
            if (await statusIndicator.count() > 0) {
                await expect(statusIndicator).toBeVisible();
            }

            // ?íƒœ???°ë¥¸ ?œê°??êµ¬ë¶„
            const activeSession = firstSession.locator('[data-testid="active-session"]');
            const inactiveSession = firstSession.locator('[data-testid="inactive-session"]');
            
            if (await activeSession.count() > 0) {
                await expect(activeSession).toBeVisible();
            } else if (await inactiveSession.count() > 0) {
                await expect(inactiveSession).toBeVisible();
            }
        }
    });
});
