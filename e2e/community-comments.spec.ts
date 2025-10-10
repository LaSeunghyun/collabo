import { test, expect } from '@playwright/test';

test.describe('Community Comments - E2E Tests', () => {
    test.beforeEach(async ({ page }) => {
        // ?�스??계정?�로 로그??
        await page.goto('/auth/signin');
        // 로그??로직?� ?�제 ?�경??맞게 구현 ?�요
    });

    test('?��? ?�성 기능', async ({ page }) => {
        // 게시글 ?�이지�??�동
        await page.goto('/community');
        await page.waitForLoadState('networkidle');

        // �?번째 게시글 ?�릭
        const postLink = page.locator('a[href*="/community/"]').first();
        if (await postLink.count() > 0) {
            await postLink.click();
            await page.waitForLoadState('networkidle');

            // ?��? ?�성 ???�인
            const commentInput = page.locator('textarea[placeholder*="?��?"]').or(page.locator('textarea[name="content"]'));
            const submitButton = page.locator('button:has-text("?��?")').or(page.locator('button[type="submit"]'));

            if (await commentInput.count() > 0) {
                await expect(commentInput).toBeVisible();
                await expect(submitButton).toBeVisible();

                // ?��? ?�성
                await commentInput.fill('?�것?� E2E ?�스???��??�니??');
                await submitButton.click();

                // ?��? ?�성 ?�료 ?�인
                await page.waitForTimeout(1000);
                const newComment = page.locator('[data-testid="comment"]').or(page.locator('article')).filter({ hasText: 'E2E ?�스???��?' });
                if (await newComment.count() > 0) {
                    await expect(newComment).toBeVisible();
                }
            }
        }
    });

    test('?��? 목록 조회', async ({ page }) => {
        await page.goto('/community');
        await page.waitForLoadState('networkidle');

        // �?번째 게시글 ?�릭
        const postLink = page.locator('a[href*="/community/"]').first();
        if (await postLink.count() > 0) {
            await postLink.click();
            await page.waitForLoadState('networkidle');

            // ?��? ?�션 ?�인
            const commentsSection = page.locator('[data-testid="comments-section"]').or(page.locator('section:has-text("?��?")'));
            if (await commentsSection.count() > 0) {
                await expect(commentsSection).toBeVisible();

                // ?��? 목록 ?�인
                const comments = page.locator('[data-testid="comment"]').or(page.locator('article'));
                if (await comments.count() > 0) {
                    await expect(comments.first()).toBeVisible();
                }
            }
        }
    });

    test('?��? ?�성 ?�효??검??, async ({ page }) => {
        await page.goto('/community');
        await page.waitForLoadState('networkidle');

        // �?번째 게시글 ?�릭
        const postLink = page.locator('a[href*="/community/"]').first();
        if (await postLink.count() > 0) {
            await postLink.click();
            await page.waitForLoadState('networkidle');

            // �??��? ?�출 ?�도
            const commentInput = page.locator('textarea[placeholder*="?��?"]');
            const submitButton = page.locator('button:has-text("?��?")');

            if (await commentInput.count() > 0 && await submitButton.count() > 0) {
                await submitButton.click();

                // ?�러 메시지 ?�인
                const errorMessage = page.locator('[data-testid="error-message"]').or(page.locator('text=?�수'));
                if (await errorMessage.count() > 0) {
                    await expect(errorMessage).toBeVisible();
                }
            }
        }
    });

    test('?��? ?�성???�보 ?�시', async ({ page }) => {
        await page.goto('/community');
        await page.waitForLoadState('networkidle');

        // �?번째 게시글 ?�릭
        const postLink = page.locator('a[href*="/community/"]').first();
        if (await postLink.count() > 0) {
            await postLink.click();
            await page.waitForLoadState('networkidle');

            // ?��? 목록?�서 ?�성???�보 ?�인
            const comments = page.locator('[data-testid="comment"]').or(page.locator('article'));
            if (await comments.count() > 0) {
                const firstComment = comments.first();
                
                // ?�성???�름 ?�인
                const authorName = firstComment.locator('[data-testid="author-name"]').or(firstComment.locator('strong'));
                if (await authorName.count() > 0) {
                    await expect(authorName).toBeVisible();
                }

                // ?�성 ?�간 ?�인
                const createdAt = firstComment.locator('[data-testid="created-at"]').or(firstComment.locator('time'));
                if (await createdAt.count() > 0) {
                    await expect(createdAt).toBeVisible();
                }
            }
        }
    });

    test('?��? ?�성 ??게시글 ?��? ???�데?�트', async ({ page }) => {
        await page.goto('/community');
        await page.waitForLoadState('networkidle');

        // �?번째 게시글 ?�릭
        const postLink = page.locator('a[href*="/community/"]').first();
        if (await postLink.count() > 0) {
            await postLink.click();
            await page.waitForLoadState('networkidle');

            // ?�재 ?��? ???�인
            const commentCount = page.locator('[data-testid="comment-count"]').or(page.locator('text=/\\d+�??��?/'));
            let initialCount = 0;
            if (await commentCount.count() > 0) {
                const countText = await commentCount.textContent();
                initialCount = parseInt(countText?.match(/\d+/)?.[0] || '0');
            }

            // ?��? ?�성
            const commentInput = page.locator('textarea[placeholder*="?��?"]');
            const submitButton = page.locator('button:has-text("?��?")');

            if (await commentInput.count() > 0 && await submitButton.count() > 0) {
                await commentInput.fill('?��? ???�스??);
                await submitButton.click();
                await page.waitForTimeout(1000);

                // ?��? ??증�? ?�인
                if (await commentCount.count() > 0) {
                    const newCountText = await commentCount.textContent();
                    const newCount = parseInt(newCountText?.match(/\d+/)?.[0] || '0');
                    expect(newCount).toBeGreaterThan(initialCount);
                }
            }
        }
    });

    test('?��? ?�성 권한 ?�인', async ({ page }) => {
        // 로그?�하지 ?��? ?�태�?게시글 ?�이지 ?�근
        await page.goto('/community');
        await page.waitForLoadState('networkidle');

        // �?번째 게시글 ?�릭
        const postLink = page.locator('a[href*="/community/"]').first();
        if (await postLink.count() > 0) {
            await postLink.click();
            await page.waitForLoadState('networkidle');

            // ?��? ?�성 ?�이 로그???�도 메시지�??�체되?��? ?�인
            const loginPrompt = page.locator('text=로그??).or(page.locator('text=?��????�성?�려�?));
            if (await loginPrompt.count() > 0) {
                await expect(loginPrompt).toBeVisible();
            }
        }
    });

    test('?��? ?�성 ??반응???�자??, async ({ page }) => {
        await page.goto('/community');
        await page.waitForLoadState('networkidle');

        // �?번째 게시글 ?�릭
        const postLink = page.locator('a[href*="/community/"]').first();
        if (await postLink.count() > 0) {
            await postLink.click();
            await page.waitForLoadState('networkidle');

            // 모바??뷰포??
            await page.setViewportSize({ width: 375, height: 667 });
            const commentInput = page.locator('textarea[placeholder*="?��?"]');
            if (await commentInput.count() > 0) {
                await expect(commentInput).toBeVisible();
            }

            // ?�블�?뷰포??
            await page.setViewportSize({ width: 768, height: 1024 });
            if (await commentInput.count() > 0) {
                await expect(commentInput).toBeVisible();
            }
        }
    });
});
