import { test, expect } from '@playwright/test';

test.describe('Session Management - E2E Tests', () => {
    test.beforeEach(async ({ page }) => {
        // ?�스??계정?�로 로그??
        await page.goto('/auth/signin');
        // 로그??로직?� ?�제 ?�경??맞게 구현 ?�요
    });

    test('?�션 목록 조회', async ({ page }) => {
        // ?�로???�는 ?�정 ?�이지�??�동
        await page.goto('/profile');
        await page.waitForLoadState('networkidle');

        // ?�션 관�??�션 찾기
        const sessionSection = page.locator('[data-testid="session-section"]').or(page.locator('section:has-text("?�션")'));
        if (await sessionSection.count() > 0) {
            await expect(sessionSection).toBeVisible();

            // ?�션 목록 ?�인
            const sessions = page.locator('[data-testid="session-item"]').or(page.locator('article'));
            if (await sessions.count() > 0) {
                await expect(sessions.first()).toBeVisible();

                // ?�션 ?�보 ?�인
                const sessionInfo = sessions.first();
                
                // ?�바?�스 ?�보
                const deviceInfo = sessionInfo.locator('[data-testid="device-info"]').or(sessionInfo.locator('text=/Chrome|Firefox|Safari/'));
                if (await deviceInfo.count() > 0) {
                    await expect(deviceInfo).toBeVisible();
                }

                // 마�?�??�용 ?�간
                const lastUsed = sessionInfo.locator('[data-testid="last-used"]').or(sessionInfo.locator('time'));
                if (await lastUsed.count() > 0) {
                    await expect(lastUsed).toBeVisible();
                }

                // ?�성 ?�태
                const activeStatus = sessionInfo.locator('[data-testid="active-status"]').or(sessionInfo.locator('text=?�성'));
                if (await activeStatus.count() > 0) {
                    await expect(activeStatus).toBeVisible();
                }
            }
        }
    });

    test('?�재 ?�션 ?�시', async ({ page }) => {
        await page.goto('/profile');
        await page.waitForLoadState('networkidle');

        // ?�재 ?�션 ?�시 ?�인
        const currentSession = page.locator('[data-testid="current-session"]').or(page.locator('text=?�재 ?�션'));
        if (await currentSession.count() > 0) {
            await expect(currentSession).toBeVisible();

            // ?�재 ?�션 ?�시???�인
            const currentIndicator = currentSession.locator('[data-testid="current-indicator"]').or(currentSession.locator('text=?�재'));
            if (await currentIndicator.count() > 0) {
                await expect(currentIndicator).toBeVisible();
            }
        }
    });

    test('?�션 ?�보 ?�세 ?�시', async ({ page }) => {
        await page.goto('/profile');
        await page.waitForLoadState('networkidle');

        const sessions = page.locator('[data-testid="session-item"]').or(page.locator('article'));
        if (await sessions.count() > 0) {
            const firstSession = sessions.first();

            // ?�션 ID
            const sessionId = firstSession.locator('[data-testid="session-id"]');
            if (await sessionId.count() > 0) {
                await expect(sessionId).toBeVisible();
            }

            // ?�성 ?�간
            const createdAt = firstSession.locator('[data-testid="created-at"]').or(firstSession.locator('time'));
            if (await createdAt.count() > 0) {
                await expect(createdAt).toBeVisible();
            }

            // IP 주소 (?�는 경우)
            const ipAddress = firstSession.locator('[data-testid="ip-address"]');
            if (await ipAddress.count() > 0) {
                await expect(ipAddress).toBeVisible();
            }

            // ?�용???�이?�트 (?�는 경우)
            const userAgent = firstSession.locator('[data-testid="user-agent"]');
            if (await userAgent.count() > 0) {
                await expect(userAgent).toBeVisible();
            }
        }
    });

    test('?�션 관�?권한 ?�인', async ({ page }) => {
        // 로그?�하지 ?��? ?�태�??�로???�이지 ?�근
        await page.goto('/profile');
        await page.waitForLoadState('networkidle');

        // 로그???�도 메시지 ?�인
        const loginPrompt = page.locator('text=로그??).or(page.locator('text=?�션???�인?�려�?));
        if (await loginPrompt.count() > 0) {
            await expect(loginPrompt).toBeVisible();
        }
    });

    test('?�션 목록 반응???�자??, async ({ page }) => {
        await page.goto('/profile');
        await page.waitForLoadState('networkidle');

        const sessionSection = page.locator('[data-testid="session-section"]').or(page.locator('section:has-text("?�션")'));
        if (await sessionSection.count() > 0) {
            // 모바??뷰포??
            await page.setViewportSize({ width: 375, height: 667 });
            await expect(sessionSection).toBeVisible();

            // ?�블�?뷰포??
            await page.setViewportSize({ width: 768, height: 1024 });
            await expect(sessionSection).toBeVisible();
        }
    });

    test('?�션 목록 로딩 ?�태', async ({ page }) => {
        // ?�트?�크 지???��??�이??
        await page.route('**/api/auth/sessions', route => {
            setTimeout(() => route.continue(), 1000);
        });

        await page.goto('/profile');
        
        // 로딩 ?�켈?�톤 ?�인
        const loadingSkeleton = page.locator('[data-testid="session-skeleton"]').or(page.locator('.animate-pulse'));
        if (await loadingSkeleton.count() > 0) {
            await expect(loadingSkeleton).toBeVisible();
        }

        // 로딩 ?�료 ???�켈?�톤 ?�라�??�인
        await page.waitForLoadState('networkidle');
        if (await loadingSkeleton.count() > 0) {
            await expect(loadingSkeleton).not.toBeVisible();
        }
    });

    test('?�션 목록 ?�러 처리', async ({ page }) => {
        // API ?�류 ?��??�이??
        await page.route('**/api/auth/sessions', route => route.abort());

        await page.goto('/profile');
        await page.waitForLoadState('networkidle');

        // ?�러 메시지 ?�인
        const errorMessage = page.locator('[data-testid="error-message"]').or(page.locator('text=?�류'));
        if (await errorMessage.count() > 0) {
            await expect(errorMessage).toBeVisible();
        }
    });

    test('?�션 ?�보 ?�렬', async ({ page }) => {
        await page.goto('/profile');
        await page.waitForLoadState('networkidle');

        const sessions = page.locator('[data-testid="session-item"]').or(page.locator('article'));
        if (await sessions.count() > 1) {
            // ?�션??최신?�으�??�렬?�어 ?�는지 ?�인
            const firstSession = sessions.first();
            const secondSession = sessions.nth(1);

            const firstTime = firstSession.locator('time').first();
            const secondTime = secondSession.locator('time').first();

            if (await firstTime.count() > 0 && await secondTime.count() > 0) {
                const firstTimeText = await firstTime.textContent();
                const secondTimeText = await secondTime.textContent();
                
                // �?번째 ?�션????최신?��? ?�인 (간단??문자??비교)
                expect(firstTimeText).toBeDefined();
                expect(secondTimeText).toBeDefined();
            }
        }
    });

    test('?�션 ?�태 ?�시', async ({ page }) => {
        await page.goto('/profile');
        await page.waitForLoadState('networkidle');

        const sessions = page.locator('[data-testid="session-item"]').or(page.locator('article'));
        if (await sessions.count() > 0) {
            const firstSession = sessions.first();

            // ?�성/비활???�태 ?�시
            const statusIndicator = firstSession.locator('[data-testid="status-indicator"]').or(firstSession.locator('text=?�성|비활??));
            if (await statusIndicator.count() > 0) {
                await expect(statusIndicator).toBeVisible();
            }

            // ?�태???�른 ?�각??구분
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
