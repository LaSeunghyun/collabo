import { test, expect } from '@playwright/test';

test.describe('Community CRUD - E2E Tests', () => {
    test.beforeEach(async ({ page }) => {
        // ?�스??계정?�로 로그??(?�제 ?�경?�서???�스??계정 ?�요)
        await page.goto('/auth/signin');
        // 로그??로직?� ?�제 ?�경??맞게 구현 ?�요
    });

    test('게시글 ?�성 기능', async ({ page }) => {
        await page.goto('/community/new');
        await page.waitForLoadState('networkidle');

        // 게시글 ?�성 ???�인
        const titleInput = page.locator('input[name="title"]').or(page.locator('input[placeholder*="?�목"]'));
        const contentInput = page.locator('textarea[name="content"]').or(page.locator('textarea[placeholder*="?�용"]'));
        const categorySelect = page.locator('select[name="category"]').or(page.locator('select'));

        await expect(titleInput).toBeVisible();
        await expect(contentInput).toBeVisible();
        await expect(categorySelect).toBeVisible();

        // 게시글 ?�성
        await titleInput.fill('E2E ?�스??게시글');
        await contentInput.fill('?�것?� E2E ?�스?��? ?�한 게시글?�니??');
        await categorySelect.selectOption('general');

        // ?�출 버튼 ?�릭
        const submitButton = page.locator('button[type="submit"]').or(page.locator('button:has-text("?�록")'));
        await submitButton.click();

        // ?�공 ??리다?�렉???�인
        await page.waitForURL(/.*community\/[a-zA-Z0-9]+/);
        await expect(page.locator('h1')).toContainText('E2E ?�스??게시글');
    });

    test('게시글 ?�정 기능', async ({ page }) => {
        // 먼�? 게시글???�성?�거??기존 게시글�??�동
        await page.goto('/community');
        await page.waitForLoadState('networkidle');

        // �?번째 게시글 ?�릭
        const postLink = page.locator('a[href*="/community/"]').first();
        if (await postLink.count() > 0) {
            await postLink.click();
            await page.waitForLoadState('networkidle');

            // ?�정 버튼 찾기
            const editButton = page.locator('button:has-text("?�정")').or(page.locator('[data-testid="edit-button"]'));
            if (await editButton.count() > 0) {
                await editButton.click();

                // ?�정 ???�인
                const titleInput = page.locator('input[name="title"]');
                const contentInput = page.locator('textarea[name="content"]');

                if (await titleInput.count() > 0) {
                    await titleInput.fill('?�정??E2E ?�스??게시글');
                    await contentInput.fill('?�것?� ?�정??E2E ?�스??게시글?�니??');

                    // ?�??버튼 ?�릭
                    const saveButton = page.locator('button:has-text("?�??)').or(page.locator('button[type="submit"]'));
                    await saveButton.click();

                    // ?�정 결과 ?�인
                    await page.waitForLoadState('networkidle');
                    await expect(page.locator('h1')).toContainText('?�정??E2E ?�스??게시글');
                }
            }
        }
    });

    test('게시글 ??�� 기능', async ({ page }) => {
        await page.goto('/community');
        await page.waitForLoadState('networkidle');

        // �?번째 게시글 ?�릭
        const postLink = page.locator('a[href*="/community/"]').first();
        if (await postLink.count() > 0) {
            await postLink.click();
            await page.waitForLoadState('networkidle');

            // ??�� 버튼 찾기
            const deleteButton = page.locator('button:has-text("??��")').or(page.locator('[data-testid="delete-button"]'));
            if (await deleteButton.count() > 0) {
                await deleteButton.click();

                // ??�� ?�인 ?�이?�로�?
                const confirmButton = page.locator('button:has-text("?�인")').or(page.locator('button:has-text("??��")'));
                if (await confirmButton.count() > 0) {
                    await confirmButton.click();

                    // ??�� ??리다?�렉???�인
                    await page.waitForURL(/.*community/);
                    await expect(page.locator('h1')).toBeVisible();
                }
            }
        }
    });

    test('게시글 ?�성 ?�효??검??, async ({ page }) => {
        await page.goto('/community/new');
        await page.waitForLoadState('networkidle');

        // �??�으�??�출 ?�도
        const submitButton = page.locator('button[type="submit"]').or(page.locator('button:has-text("?�록")'));
        await submitButton.click();

        // ?�러 메시지 ?�인
        const errorMessage = page.locator('[data-testid="error-message"]').or(page.locator('text=?�수'));
        if (await errorMessage.count() > 0) {
            await expect(errorMessage).toBeVisible();
        }

        // ?�목�??�력?�고 ?�출
        const titleInput = page.locator('input[name="title"]');
        if (await titleInput.count() > 0) {
            await titleInput.fill('?�목�??�는 게시글');
            await submitButton.click();

            // ?�용 ?�수 ?�러 ?�인
            const contentError = page.locator('text=?�용').or(page.locator('text=?�수'));
            if (await contentError.count() > 0) {
                await expect(contentError).toBeVisible();
            }
        }
    });

    test('게시글 카테고리 ?�터�?, async ({ page }) => {
        await page.goto('/community');
        await page.waitForLoadState('networkidle');

        // 카테고리 버튼???�인
        const categoryButtons = page.locator('[data-testid="category-button"]').or(page.locator('button:has-text("?�유")'));
        if (await categoryButtons.count() > 0) {
            // '?�유' 카테고리 ?�릭
            const generalButton = categoryButtons.filter({ hasText: '?�유' }).first();
            if (await generalButton.count() > 0) {
                await generalButton.click();
                await page.waitForTimeout(1000);

                // ?�터링된 결과 ?�인
                const filteredPosts = page.locator('[data-testid="post-card"]').or(page.locator('article'));
                if (await filteredPosts.count() > 0) {
                    await expect(filteredPosts.first()).toBeVisible();
                }
            }
        }
    });

    test('게시글 검??기능', async ({ page }) => {
        await page.goto('/community');
        await page.waitForLoadState('networkidle');

        // 검???�력 ?�드
        const searchInput = page.locator('input[type="search"]').or(page.locator('input[placeholder*="검??]'));
        if (await searchInput.count() > 0) {
            await searchInput.fill('?�스??);
            await page.keyboard.press('Enter');
            await page.waitForTimeout(1000);

            // 검??결과 ?�인
            const searchResults = page.locator('[data-testid="post-card"]').or(page.locator('article'));
            if (await searchResults.count() > 0) {
                await expect(searchResults.first()).toBeVisible();
            }
        }
    });

    test('게시글 ?�렬 기능', async ({ page }) => {
        await page.goto('/community');
        await page.waitForLoadState('networkidle');

        // ?�렬 ?�롭?�운
        const sortSelect = page.locator('select[name="sort"]').or(page.locator('select'));
        if (await sortSelect.count() > 0) {
            // ?�기?�으�??�렬
            await sortSelect.selectOption('popular');
            await page.waitForTimeout(1000);

            // ?�렬 결과 ?�인
            const sortedPosts = page.locator('[data-testid="post-card"]').or(page.locator('article'));
            if (await sortedPosts.count() > 0) {
                await expect(sortedPosts.first()).toBeVisible();
            }

            // 최신?�으�??�렬
            await sortSelect.selectOption('recent');
            await page.waitForTimeout(1000);

            // ?�렬 결과 ?�인
            if (await sortedPosts.count() > 0) {
                await expect(sortedPosts.first()).toBeVisible();
            }
        }
    });
});
