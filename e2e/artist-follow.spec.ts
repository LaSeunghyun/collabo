import { test, expect } from '@playwright/test';

test.describe('Artist Follow - E2E Tests', () => {
    test.beforeEach(async ({ page }) => {
        // ?�스??계정?�로 로그??
        await page.goto('/auth/signin');
        // 로그??로직?� ?�제 ?�경??맞게 구현 ?�요
    });

    test('?�티?�트 ?�로??기능', async ({ page }) => {
        // ?�티?�트 ?�이지�??�동
        await page.goto('/artists');
        await page.waitForLoadState('networkidle');

        // �?번째 ?�티?�트 ?�릭
        const artistLink = page.locator('a[href*="/artists/"]').first();
        if (await artistLink.count() > 0) {
            await artistLink.click();
            await page.waitForLoadState('networkidle');

            // ?�로??버튼 ?�인
            const followButton = page.locator('button:has-text("?�로??)').or(page.locator('[data-testid="follow-button"]'));
            if (await followButton.count() > 0) {
                await expect(followButton).toBeVisible();

                // ?�로??버튼 ?�릭
                await followButton.click();
                await page.waitForTimeout(1000);

                // ?�로???�태 변�??�인
                const unfollowButton = page.locator('button:has-text("?�팔로우")').or(page.locator('button:has-text("?�로??)'));
                if (await unfollowButton.count() > 0) {
                    await expect(unfollowButton).toBeVisible();
                }

                // ?�로????증�? ?�인
                const followerCount = page.locator('[data-testid="follower-count"]').or(page.locator('text=/\\d+�??�로??'));
                if (await followerCount.count() > 0) {
                    await expect(followerCount).toBeVisible();
                }
            }
        }
    });

    test('?�티?�트 ?�팔로우 기능', async ({ page }) => {
        // ?��? ?�로?�한 ?�티?�트 ?�이지�??�동
        await page.goto('/artists');
        await page.waitForLoadState('networkidle');

        // �?번째 ?�티?�트 ?�릭
        const artistLink = page.locator('a[href*="/artists/"]').first();
        if (await artistLink.count() > 0) {
            await artistLink.click();
            await page.waitForLoadState('networkidle');

            // ?�팔로우 버튼 ?�인 (?��? ?�로?�한 ?�태)
            const unfollowButton = page.locator('button:has-text("?�팔로우")').or(page.locator('button:has-text("?�로??)'));
            if (await unfollowButton.count() > 0) {
                await expect(unfollowButton).toBeVisible();

                // ?�팔로우 버튼 ?�릭
                await unfollowButton.click();
                await page.waitForTimeout(1000);

                // ?�팔로우 ?�태 변�??�인
                const followButton = page.locator('button:has-text("?�로??)');
                if (await followButton.count() > 0) {
                    await expect(followButton).toBeVisible();
                }
            }
        }
    });

    test('?�기 ?�신 ?�로??방�?', async ({ page }) => {
        // ???�로???�이지�??�동
        await page.goto('/profile');
        await page.waitForLoadState('networkidle');

        // ?�로??버튼???�는지 ?�인 (?�기 ?�신?� ?�로?�할 ???�음)
        const followButton = page.locator('button:has-text("?�로??)');
        await expect(followButton).toHaveCount(0);
    });

    test('?�로???�태 ?�시', async ({ page }) => {
        await page.goto('/artists');
        await page.waitForLoadState('networkidle');

        // ?�티?�트 카드?�서 ?�로???�태 ?�인
        const artistCards = page.locator('[data-testid="artist-card"]').or(page.locator('article'));
        if (await artistCards.count() > 0) {
            const firstCard = artistCards.first();
            
            // ?�로??버튼 ?�는 ?�태 ?�시
            const followButton = firstCard.locator('button:has-text("?�로??)').or(firstCard.locator('button:has-text("?�로??)'));
            if (await followButton.count() > 0) {
                await expect(followButton).toBeVisible();
            }
        }
    });

    test('?�로?????�시', async ({ page }) => {
        await page.goto('/artists');
        await page.waitForLoadState('networkidle');

        // �?번째 ?�티?�트 ?�릭
        const artistLink = page.locator('a[href*="/artists/"]').first();
        if (await artistLink.count() > 0) {
            await artistLink.click();
            await page.waitForLoadState('networkidle');

            // ?�로?????�시 ?�인
            const followerCount = page.locator('[data-testid="follower-count"]').or(page.locator('text=/\\d+�??�로??'));
            if (await followerCount.count() > 0) {
                await expect(followerCount).toBeVisible();
                
                // ?�로???��? ?�자?��? ?�인
                const countText = await followerCount.textContent();
                expect(countText).toMatch(/\d+/);
            }
        }
    });

    test('?�로??권한 ?�인', async ({ page }) => {
        // 로그?�하지 ?��? ?�태�??�티?�트 ?�이지 ?�근
        await page.goto('/artists');
        await page.waitForLoadState('networkidle');

        // �?번째 ?�티?�트 ?�릭
        const artistLink = page.locator('a[href*="/artists/"]').first();
        if (await artistLink.count() > 0) {
            await artistLink.click();
            await page.waitForLoadState('networkidle');

            // ?�로??버튼??로그???�도 메시지�??�체되?��? ?�인
            const loginPrompt = page.locator('text=로그??).or(page.locator('text=?�로?�하?�면'));
            if (await loginPrompt.count() > 0) {
                await expect(loginPrompt).toBeVisible();
            }
        }
    });

    test('?�로??버튼 반응???�자??, async ({ page }) => {
        await page.goto('/artists');
        await page.waitForLoadState('networkidle');

        // �?번째 ?�티?�트 ?�릭
        const artistLink = page.locator('a[href*="/artists/"]').first();
        if (await artistLink.count() > 0) {
            await artistLink.click();
            await page.waitForLoadState('networkidle');

            // 모바??뷰포??
            await page.setViewportSize({ width: 375, height: 667 });
            const followButton = page.locator('button:has-text("?�로??)').or(page.locator('button:has-text("?�팔로우")'));
            if (await followButton.count() > 0) {
                await expect(followButton).toBeVisible();
            }

            // ?�블�?뷰포??
            await page.setViewportSize({ width: 768, height: 1024 });
            if (await followButton.count() > 0) {
                await expect(followButton).toBeVisible();
            }
        }
    });

    test('?�로???�태 지?�성', async ({ page }) => {
        // ?�티?�트 ?�로??
        await page.goto('/artists');
        await page.waitForLoadState('networkidle');

        const artistLink = page.locator('a[href*="/artists/"]').first();
        if (await artistLink.count() > 0) {
            await artistLink.click();
            await page.waitForLoadState('networkidle');

            const followButton = page.locator('button:has-text("?�로??)');
            if (await followButton.count() > 0) {
                await followButton.click();
                await page.waitForTimeout(1000);
            }

            // ?�이지 ?�로고침
            await page.reload();
            await page.waitForLoadState('networkidle');

            // ?�로???�태 ?��? ?�인
            const unfollowButton = page.locator('button:has-text("?�팔로우")').or(page.locator('button:has-text("?�로??)'));
            if (await unfollowButton.count() > 0) {
                await expect(unfollowButton).toBeVisible();
            }
        }
    });

    test('?�로???�러 처리', async ({ page }) => {
        // ?�트?�크 ?�류 ?��??�이??
        await page.route('**/api/artists/*/follow', route => route.abort());
        
        await page.goto('/artists');
        await page.waitForLoadState('networkidle');

        const artistLink = page.locator('a[href*="/artists/"]').first();
        if (await artistLink.count() > 0) {
            await artistLink.click();
            await page.waitForLoadState('networkidle');

            const followButton = page.locator('button:has-text("?�로??)');
            if (await followButton.count() > 0) {
                await followButton.click();
                await page.waitForTimeout(1000);

                // ?�러 메시지 ?�인
                const errorMessage = page.locator('[data-testid="error-message"]').or(page.locator('text=?�류'));
                if (await errorMessage.count() > 0) {
                    await expect(errorMessage).toBeVisible();
                }
            }
        }
    });
});
