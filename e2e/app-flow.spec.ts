import { test, expect } from '@playwright/test';

test.describe('Artist Funding Platform - E2E Tests', () => {
    test.beforeEach(async ({ page }) => {
        // Í∞??åÏä§???ÑÏóê ?àÌéò?¥Ï?Î°??¥Îèô
        await page.goto('/');
    });

    test('?àÌéò?¥Ï? Î°úÎî© Î∞?Í∏∞Î≥∏ ?§ÎπÑÍ≤åÏù¥??, async ({ page }) => {
        // ?òÏù¥ÏßÄ ?úÎ™© ?ïÏù∏
        await expect(page).toHaveTitle(/Collaborium/);

        // Ï£ºÏöî ?πÏÖò?§Ïù¥ ?úÏãú?òÎäîÏßÄ ?ïÏù∏
        await expect(page.locator('h1')).toBeVisible();

        // ?§ÎπÑÍ≤åÏù¥??Î©îÎâ¥ ?ïÏù∏
        await expect(page.locator('nav')).toBeVisible();

        // Ïª§Î??àÌã∞ ÎßÅÌÅ¨ ?ïÏù∏
        const communityLink = page.locator('a[href="/community"]');
        await expect(communityLink).toBeVisible();

        // ?ÑÎ°ú?ùÌä∏ ÎßÅÌÅ¨ ?ïÏù∏
        const projectsLink = page.locator('a[href="/projects"]');
        await expect(projectsLink).toBeVisible();
    });

    test('Ïª§Î??àÌã∞ ?òÏù¥ÏßÄ Í∏∞Îä• ?åÏä§??, async ({ page }) => {
        // Ïª§Î??àÌã∞ ?òÏù¥ÏßÄÎ°?ÏßÅÏ†ë ?¥Îèô
        await page.goto('/community');
        await expect(page).toHaveURL(/.*community/);

        // Ïª§Î??àÌã∞ ?òÏù¥ÏßÄ Î°úÎî© ?ïÏù∏
        await expect(page.locator('h1')).toBeVisible();

        // Ïπ¥ÌÖåÍ≥†Î¶¨ ?ÑÌÑ∞ ?ïÏù∏
        const categoryFilters = page.locator('[data-testid="category-filter"]');
        if (await categoryFilters.count() > 0) {
            await expect(categoryFilters.first()).toBeVisible();
        }

        // ??Í≤åÏãúÍ∏Ä ?ëÏÑ± Î≤ÑÌäº ?ïÏù∏
        const newPostButton = page.locator('a[href="/community/new"]');
        await expect(newPostButton).toBeVisible();
    });

    test('?ÑÎ°ú?ùÌä∏ ?òÏù¥ÏßÄ Í∏∞Îä• ?åÏä§??, async ({ page }) => {
        // ?ÑÎ°ú?ùÌä∏ ?òÏù¥ÏßÄÎ°?ÏßÅÏ†ë ?¥Îèô
        await page.goto('/projects');
        await expect(page).toHaveURL(/.*projects/);

        // ?ÑÎ°ú?ùÌä∏ ?òÏù¥ÏßÄ Î°úÎî© ?ïÏù∏
        await expect(page.locator('h1')).toBeVisible();

        // ?ÑÎ°ú?ùÌä∏ Ïπ¥Îìú?§Ïù¥ ?úÏãú?òÎäîÏßÄ ?ïÏù∏
        const projectCards = page.locator('[data-testid="project-card"]');
        if (await projectCards.count() > 0) {
            await expect(projectCards.first()).toBeVisible();
        }
    });

    test('?ÑÌã∞?§Ìä∏ ?òÏù¥ÏßÄ Í∏∞Îä• ?åÏä§??, async ({ page }) => {
        // ?ÑÌã∞?§Ìä∏ ?òÏù¥ÏßÄÎ°?ÏßÅÏ†ë ?¥Îèô
        await page.goto('/artists');
        await expect(page).toHaveURL(/.*artists/);

        // ?ÑÌã∞?§Ìä∏ ?òÏù¥ÏßÄ Î°úÎî© ?ïÏù∏
        await expect(page.locator('h1')).toBeVisible();

        // ?ÑÌã∞?§Ìä∏ Ïπ¥Îìú?§Ïù¥ ?úÏãú?òÎäîÏßÄ ?ïÏù∏
        const artistCards = page.locator('[data-testid="artist-card"]');
        if (await artistCards.count() > 0) {
            await expect(artistCards.first()).toBeVisible();
        }
    });

    test('?∏Ï¶ù ?åÎ°ú???åÏä§??, async ({ page }) => {
        // Î°úÍ∑∏???òÏù¥ÏßÄÎ°?ÏßÅÏ†ë ?¥Îèô
        await page.goto('/auth/signin');
        await expect(page).toHaveURL(/.*signin/);

        // Î°úÍ∑∏?????ïÏù∏
        await expect(page.locator('form')).toBeVisible();

        // ?¥Î©î???ÖÎ†• ?ÑÎìú ?ïÏù∏
        const emailInput = page.locator('input[type="email"]');
        await expect(emailInput).toBeVisible();

        // ÎπÑÎ?Î≤àÌò∏ ?ÖÎ†• ?ÑÎìú ?ïÏù∏
        const passwordInput = page.locator('input[type="password"]');
        await expect(passwordInput).toBeVisible();

        // Î°úÍ∑∏??Î≤ÑÌäº ?ïÏù∏
        const loginButton = page.locator('button[type="submit"]');
        await expect(loginButton).toBeVisible();

        // ?åÏõêÍ∞Ä??ÎßÅÌÅ¨ ?ïÏù∏
        const signupLink = page.locator('a[href="/auth/signup"]');
        await expect(signupLink).toBeVisible();
    });

    test('?åÏõêÍ∞Ä???òÏù¥ÏßÄ Í∏∞Îä• ?åÏä§??, async ({ page }) => {
        // ?åÏõêÍ∞Ä???òÏù¥ÏßÄÎ°?ÏßÅÏ†ë ?¥Îèô
        await page.goto('/auth/signup');
        await expect(page).toHaveURL(/.*signup/);

        // ?åÏõêÍ∞Ä?????ïÏù∏
        await expect(page.locator('form')).toBeVisible();

        // ?¥Î¶Ñ ?ÖÎ†• ?ÑÎìú ?ïÏù∏
        const nameInput = page.locator('input[name="name"]');
        await expect(nameInput).toBeVisible();

        // ?¥Î©î???ÖÎ†• ?ÑÎìú ?ïÏù∏
        const emailInput = page.locator('input[type="email"]');
        await expect(emailInput).toBeVisible();

        // ÎπÑÎ?Î≤àÌò∏ ?ÖÎ†• ?ÑÎìú ?ïÏù∏
        const passwordInput = page.locator('input[type="password"]');
        await expect(passwordInput).toBeVisible();

        // ?åÏõêÍ∞Ä??Î≤ÑÌäº ?ïÏù∏
        const signupButton = page.locator('button[type="submit"]');
        await expect(signupButton).toBeVisible();
    });

    test('?ÑÎ°ú???òÏù¥ÏßÄ ?ëÍ∑º ?åÏä§??, async ({ page }) => {
        // ?ÑÎ°ú???òÏù¥ÏßÄÎ°?ÏßÅÏ†ë ?¥Îèô
        await page.goto('/profile');
        await expect(page).toHaveURL(/.*profile/);

        // ?ÑÎ°ú???òÏù¥ÏßÄ Î°úÎî© ?ïÏù∏
        await expect(page.locator('h1')).toBeVisible();
    });

    test('?åÌä∏???òÏù¥ÏßÄ ?ëÍ∑º ?åÏä§??, async ({ page }) => {
        // ?åÌä∏???òÏù¥ÏßÄÎ°?ÏßÅÏ†ë ?¥Îèô
        await page.goto('/partners');
        await expect(page).toHaveURL(/.*partners/);

        // ?åÌä∏???òÏù¥ÏßÄ Î°úÎî© ?ïÏù∏
        await expect(page.locator('h1')).toBeVisible();
    });

    test('?ÑÏ?Îß??òÏù¥ÏßÄ ?ëÍ∑º ?åÏä§??, async ({ page }) => {
        // ?ÑÏ?Îß??òÏù¥ÏßÄÎ°?ÏßÅÏ†ë ?¥Îèô
        await page.goto('/help');
        await expect(page).toHaveURL(/.*help/);

        // ?ÑÏ?Îß??òÏù¥ÏßÄ Î°úÎî© ?ïÏù∏
        await expect(page.locator('h1')).toBeVisible();
    });

    test('Î∞òÏùë???îÏûê???åÏä§??, async ({ page }) => {
        // Î™®Î∞î??Î∑∞Ìè¨?∏Î°ú Î≥ÄÍ≤?
        await page.setViewportSize({ width: 375, height: 667 });

        // Î™®Î∞î?ºÏóê???§ÎπÑÍ≤åÏù¥???ïÏù∏
        await expect(page.locator('nav')).toBeVisible();

        // ?úÎ∏îÎ¶?Î∑∞Ìè¨?∏Î°ú Î≥ÄÍ≤?
        await page.setViewportSize({ width: 768, height: 1024 });

        // ?úÎ∏îÎ¶øÏóê???àÏù¥?ÑÏõÉ ?ïÏù∏
        await expect(page.locator('main')).toBeVisible();

        // ?∞Ïä§?¨ÌÜ± Î∑∞Ìè¨?∏Î°ú Î≥ÄÍ≤?
        await page.setViewportSize({ width: 1920, height: 1080 });

        // ?∞Ïä§?¨ÌÜ±?êÏÑú ?àÏù¥?ÑÏõÉ ?ïÏù∏
        await expect(page.locator('main')).toBeVisible();
    });

    test('API ?îÎìú?¨Ïù∏???ëÎãµ ?åÏä§??, async ({ page }) => {
        // API ?ëÎãµ Î™®Îãà?∞ÎßÅ
        const responses: any[] = [];

        page.on('response', response => {
            responses.push({
                url: response.url(),
                status: response.status(),
                method: response.request().method()
            });
        });

        // Ïª§Î??àÌã∞ API ?∏Ï∂ú
        await page.goto('/community');
        await page.waitForLoadState('networkidle');

        // ?ÑÎ°ú?ùÌä∏ API ?∏Ï∂ú
        await page.goto('/projects');
        await page.waitForLoadState('networkidle');

        // ?ÑÌã∞?§Ìä∏ API ?∏Ï∂ú
        await page.goto('/artists');
        await page.waitForLoadState('networkidle');

        // API ?ëÎãµ ?ïÏù∏
        const apiResponses = responses.filter(r => r.url.includes('/api/'));
        console.log('API Responses:', apiResponses);

        // 500 ?êÎü¨Í∞Ä ?ÜÎäîÏßÄ ?ïÏù∏
        const errorResponses = apiResponses.filter(r => r.status >= 500);
        expect(errorResponses).toHaveLength(0);
    });

    test('?êÎü¨ ?òÏù¥ÏßÄ ?åÏä§??, async ({ page }) => {
        // Ï°¥Ïû¨?òÏ? ?äÎäî ?òÏù¥ÏßÄÎ°??¥Îèô
        await page.goto('/non-existent-page');

        // 404 ?òÏù¥ÏßÄ ?êÎäî ?êÎü¨ ?òÏù¥ÏßÄÍ∞Ä ?úÏãú?òÎäîÏßÄ ?ïÏù∏
        const errorContent = page.locator('text=404').or(page.locator('text=Not Found')).or(page.locator('text=Error'));
        await expect(errorContent).toBeVisible();
    });

    test('?±Îä• ?åÏä§??, async ({ page }) => {
        // ?±Îä• Î©îÌä∏Î¶??òÏßë
        const performanceMetrics = await page.evaluate(() => {
            const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
            return {
                loadTime: navigation.loadEventEnd - navigation.loadEventStart,
                domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
                firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
                firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0
            };
        });

        console.log('Performance Metrics:', performanceMetrics);

        // Î°úÎìú ?úÍ∞Ñ??5Ï¥??¥ÎÇ¥?∏Ï? ?ïÏù∏
        expect(performanceMetrics.loadTime).toBeLessThan(5000);
    });
});
