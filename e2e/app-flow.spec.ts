import { test, expect } from '@playwright/test';

test.describe('Artist Funding Platform - E2E Tests', () => {
    test.beforeEach(async ({ page }) => {
        // �??�스???�에 ?�페?��?�??�동
        await page.goto('/');
    });

    test('?�페?��? 로딩 �?기본 ?�비게이??, async ({ page }) => {
        // ?�이지 ?�목 ?�인
        await expect(page).toHaveTitle(/Collaborium/);

        // 주요 ?�션?�이 ?�시?�는지 ?�인
        await expect(page.locator('h1')).toBeVisible();

        // ?�비게이??메뉴 ?�인
        await expect(page.locator('nav')).toBeVisible();

        // 커�??�티 링크 ?�인
        const communityLink = page.locator('a[href="/community"]');
        await expect(communityLink).toBeVisible();

        // ?�로?�트 링크 ?�인
        const projectsLink = page.locator('a[href="/projects"]');
        await expect(projectsLink).toBeVisible();
    });

    test('커�??�티 ?�이지 기능 ?�스??, async ({ page }) => {
        // 커�??�티 ?�이지�?직접 ?�동
        await page.goto('/community');
        await expect(page).toHaveURL(/.*community/);

        // 커�??�티 ?�이지 로딩 ?�인
        await expect(page.locator('h1')).toBeVisible();

        // 카테고리 ?�터 ?�인
        const categoryFilters = page.locator('[data-testid="category-filter"]');
        if (await categoryFilters.count() > 0) {
            await expect(categoryFilters.first()).toBeVisible();
        }

        // ??게시글 ?�성 버튼 ?�인
        const newPostButton = page.locator('a[href="/community/new"]');
        await expect(newPostButton).toBeVisible();
    });

    test('?�로?�트 ?�이지 기능 ?�스??, async ({ page }) => {
        // ?�로?�트 ?�이지�?직접 ?�동
        await page.goto('/projects');
        await expect(page).toHaveURL(/.*projects/);

        // ?�로?�트 ?�이지 로딩 ?�인
        await expect(page.locator('h1')).toBeVisible();

        // ?�로?�트 카드?�이 ?�시?�는지 ?�인
        const projectCards = page.locator('[data-testid="project-card"]');
        if (await projectCards.count() > 0) {
            await expect(projectCards.first()).toBeVisible();
        }
    });

    test('?�티?�트 ?�이지 기능 ?�스??, async ({ page }) => {
        // ?�티?�트 ?�이지�?직접 ?�동
        await page.goto('/artists');
        await expect(page).toHaveURL(/.*artists/);

        // ?�티?�트 ?�이지 로딩 ?�인
        await expect(page.locator('h1')).toBeVisible();

        // ?�티?�트 카드?�이 ?�시?�는지 ?�인
        const artistCards = page.locator('[data-testid="artist-card"]');
        if (await artistCards.count() > 0) {
            await expect(artistCards.first()).toBeVisible();
        }
    });

    test('?�증 ?�로???�스??, async ({ page }) => {
        // 로그???�이지�?직접 ?�동
        await page.goto('/auth/signin');
        await expect(page).toHaveURL(/.*signin/);

        // 로그?????�인
        await expect(page.locator('form')).toBeVisible();

        // ?�메???�력 ?�드 ?�인
        const emailInput = page.locator('input[type="email"]');
        await expect(emailInput).toBeVisible();

        // 비�?번호 ?�력 ?�드 ?�인
        const passwordInput = page.locator('input[type="password"]');
        await expect(passwordInput).toBeVisible();

        // 로그??버튼 ?�인
        const loginButton = page.locator('button[type="submit"]');
        await expect(loginButton).toBeVisible();

        // ?�원가??링크 ?�인
        const signupLink = page.locator('a[href="/auth/signup"]');
        await expect(signupLink).toBeVisible();
    });

    test('?�원가???�이지 기능 ?�스??, async ({ page }) => {
        // ?�원가???�이지�?직접 ?�동
        await page.goto('/auth/signup');
        await expect(page).toHaveURL(/.*signup/);

        // ?�원가?????�인
        await expect(page.locator('form')).toBeVisible();

        // ?�름 ?�력 ?�드 ?�인
        const nameInput = page.locator('input[name="name"]');
        await expect(nameInput).toBeVisible();

        // ?�메???�력 ?�드 ?�인
        const emailInput = page.locator('input[type="email"]');
        await expect(emailInput).toBeVisible();

        // 비�?번호 ?�력 ?�드 ?�인
        const passwordInput = page.locator('input[type="password"]');
        await expect(passwordInput).toBeVisible();

        // ?�원가??버튼 ?�인
        const signupButton = page.locator('button[type="submit"]');
        await expect(signupButton).toBeVisible();
    });

    test('?�로???�이지 ?�근 ?�스??, async ({ page }) => {
        // ?�로???�이지�?직접 ?�동
        await page.goto('/profile');
        await expect(page).toHaveURL(/.*profile/);

        // ?�로???�이지 로딩 ?�인
        await expect(page.locator('h1')).toBeVisible();
    });

    test('?�트???�이지 ?�근 ?�스??, async ({ page }) => {
        // ?�트???�이지�?직접 ?�동
        await page.goto('/partners');
        await expect(page).toHaveURL(/.*partners/);

        // ?�트???�이지 로딩 ?�인
        await expect(page.locator('h1')).toBeVisible();
    });

    test('?��?�??�이지 ?�근 ?�스??, async ({ page }) => {
        // ?��?�??�이지�?직접 ?�동
        await page.goto('/help');
        await expect(page).toHaveURL(/.*help/);

        // ?��?�??�이지 로딩 ?�인
        await expect(page.locator('h1')).toBeVisible();
    });

    test('반응???�자???�스??, async ({ page }) => {
        // 모바??뷰포?�로 변�?
        await page.setViewportSize({ width: 375, height: 667 });

        // 모바?�에???�비게이???�인
        await expect(page.locator('nav')).toBeVisible();

        // ?�블�?뷰포?�로 변�?
        await page.setViewportSize({ width: 768, height: 1024 });

        // ?�블릿에???�이?�웃 ?�인
        await expect(page.locator('main')).toBeVisible();

        // ?�스?�톱 뷰포?�로 변�?
        await page.setViewportSize({ width: 1920, height: 1080 });

        // ?�스?�톱?�서 ?�이?�웃 ?�인
        await expect(page.locator('main')).toBeVisible();
    });

    test('API ?�드?�인???�답 ?�스??, async ({ page }) => {
        // API ?�답 모니?�링
        const responses: any[] = [];

        page.on('response', response => {
            responses.push({
                url: response.url(),
                status: response.status(),
                method: response.request().method()
            });
        });

        // 커�??�티 API ?�출
        await page.goto('/community');
        await page.waitForLoadState('networkidle');

        // ?�로?�트 API ?�출
        await page.goto('/projects');
        await page.waitForLoadState('networkidle');

        // ?�티?�트 API ?�출
        await page.goto('/artists');
        await page.waitForLoadState('networkidle');

        // API ?�답 ?�인
        const apiResponses = responses.filter(r => r.url.includes('/api/'));
        console.log('API Responses:', apiResponses);

        // 500 ?�러가 ?�는지 ?�인
        const errorResponses = apiResponses.filter(r => r.status >= 500);
        expect(errorResponses).toHaveLength(0);
    });

    test('?�러 ?�이지 ?�스??, async ({ page }) => {
        // 존재?��? ?�는 ?�이지�??�동
        await page.goto('/non-existent-page');

        // 404 ?�이지 ?�는 ?�러 ?�이지가 ?�시?�는지 ?�인
        const errorContent = page.locator('text=404').or(page.locator('text=Not Found')).or(page.locator('text=Error'));
        await expect(errorContent).toBeVisible();
    });

    test('?�능 ?�스??, async ({ page }) => {
        // ?�능 메트�??�집
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

        // 로드 ?�간??5�??�내?��? ?�인
        expect(performanceMetrics.loadTime).toBeLessThan(5000);
    });
});
