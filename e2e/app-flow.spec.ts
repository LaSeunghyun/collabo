import { test, expect } from '@playwright/test';

test.describe('Artist Funding Platform - E2E Tests', () => {
    test.beforeEach(async ({ page }) => {
        // 각 테스트 전에 홈페이지로 이동
        await page.goto('/');
    });

    test('홈페이지 로딩 및 기본 네비게이션', async ({ page }) => {
        // 페이지 제목 확인
        await expect(page).toHaveTitle(/Collaborium/);

        // 주요 섹션들이 표시되는지 확인
        await expect(page.locator('h1')).toBeVisible();

        // 네비게이션 메뉴 확인
        await expect(page.locator('nav')).toBeVisible();

        // 커뮤니티 링크 확인
        const communityLink = page.locator('a[href="/community"]');
        await expect(communityLink).toBeVisible();

        // 프로젝트 링크 확인
        const projectsLink = page.locator('a[href="/projects"]');
        await expect(projectsLink).toBeVisible();
    });

    test('커뮤니티 페이지 기능 테스트', async ({ page }) => {
        // 커뮤니티 페이지로 직접 이동
        await page.goto('/community');
        await expect(page).toHaveURL(/.*community/);

        // 커뮤니티 페이지 로딩 확인
        await expect(page.locator('h1')).toBeVisible();

        // 카테고리 필터 확인
        const categoryFilters = page.locator('[data-testid="category-filter"]');
        if (await categoryFilters.count() > 0) {
            await expect(categoryFilters.first()).toBeVisible();
        }

        // 새 게시글 작성 버튼 확인
        const newPostButton = page.locator('a[href="/community/new"]');
        await expect(newPostButton).toBeVisible();
    });

    test('프로젝트 페이지 기능 테스트', async ({ page }) => {
        // 프로젝트 페이지로 직접 이동
        await page.goto('/projects');
        await expect(page).toHaveURL(/.*projects/);

        // 프로젝트 페이지 로딩 확인
        await expect(page.locator('h1')).toBeVisible();

        // 프로젝트 카드들이 표시되는지 확인
        const projectCards = page.locator('[data-testid="project-card"]');
        if (await projectCards.count() > 0) {
            await expect(projectCards.first()).toBeVisible();
        }
    });

    test('아티스트 페이지 기능 테스트', async ({ page }) => {
        // 아티스트 페이지로 직접 이동
        await page.goto('/artists');
        await expect(page).toHaveURL(/.*artists/);

        // 아티스트 페이지 로딩 확인
        await expect(page.locator('h1')).toBeVisible();

        // 아티스트 카드들이 표시되는지 확인
        const artistCards = page.locator('[data-testid="artist-card"]');
        if (await artistCards.count() > 0) {
            await expect(artistCards.first()).toBeVisible();
        }
    });

    test('인증 플로우 테스트', async ({ page }) => {
        // 로그인 페이지로 직접 이동
        await page.goto('/auth/signin');
        await expect(page).toHaveURL(/.*signin/);

        // 로그인 폼 확인
        await expect(page.locator('form')).toBeVisible();

        // 이메일 입력 필드 확인
        const emailInput = page.locator('input[type="email"]');
        await expect(emailInput).toBeVisible();

        // 비밀번호 입력 필드 확인
        const passwordInput = page.locator('input[type="password"]');
        await expect(passwordInput).toBeVisible();

        // 로그인 버튼 확인
        const loginButton = page.locator('button[type="submit"]');
        await expect(loginButton).toBeVisible();

        // 회원가입 링크 확인
        const signupLink = page.locator('a[href="/auth/signup"]');
        await expect(signupLink).toBeVisible();
    });

    test('회원가입 페이지 기능 테스트', async ({ page }) => {
        // 회원가입 페이지로 직접 이동
        await page.goto('/auth/signup');
        await expect(page).toHaveURL(/.*signup/);

        // 회원가입 폼 확인
        await expect(page.locator('form')).toBeVisible();

        // 이름 입력 필드 확인
        const nameInput = page.locator('input[name="name"]');
        await expect(nameInput).toBeVisible();

        // 이메일 입력 필드 확인
        const emailInput = page.locator('input[type="email"]');
        await expect(emailInput).toBeVisible();

        // 비밀번호 입력 필드 확인
        const passwordInput = page.locator('input[type="password"]');
        await expect(passwordInput).toBeVisible();

        // 회원가입 버튼 확인
        const signupButton = page.locator('button[type="submit"]');
        await expect(signupButton).toBeVisible();
    });

    test('프로필 페이지 접근 테스트', async ({ page }) => {
        // 프로필 페이지로 직접 이동
        await page.goto('/profile');
        await expect(page).toHaveURL(/.*profile/);

        // 프로필 페이지 로딩 확인
        await expect(page.locator('h1')).toBeVisible();
    });

    test('파트너 페이지 접근 테스트', async ({ page }) => {
        // 파트너 페이지로 직접 이동
        await page.goto('/partners');
        await expect(page).toHaveURL(/.*partners/);

        // 파트너 페이지 로딩 확인
        await expect(page.locator('h1')).toBeVisible();
    });

    test('도움말 페이지 접근 테스트', async ({ page }) => {
        // 도움말 페이지로 직접 이동
        await page.goto('/help');
        await expect(page).toHaveURL(/.*help/);

        // 도움말 페이지 로딩 확인
        await expect(page.locator('h1')).toBeVisible();
    });

    test('반응형 디자인 테스트', async ({ page }) => {
        // 모바일 뷰포트로 변경
        await page.setViewportSize({ width: 375, height: 667 });

        // 모바일에서 네비게이션 확인
        await expect(page.locator('nav')).toBeVisible();

        // 태블릿 뷰포트로 변경
        await page.setViewportSize({ width: 768, height: 1024 });

        // 태블릿에서 레이아웃 확인
        await expect(page.locator('main')).toBeVisible();

        // 데스크톱 뷰포트로 변경
        await page.setViewportSize({ width: 1920, height: 1080 });

        // 데스크톱에서 레이아웃 확인
        await expect(page.locator('main')).toBeVisible();
    });

    test('API 엔드포인트 응답 테스트', async ({ page }) => {
        // API 응답 모니터링
        const responses: any[] = [];

        page.on('response', response => {
            responses.push({
                url: response.url(),
                status: response.status(),
                method: response.request().method()
            });
        });

        // 커뮤니티 API 호출
        await page.goto('/community');
        await page.waitForLoadState('networkidle');

        // 프로젝트 API 호출
        await page.goto('/projects');
        await page.waitForLoadState('networkidle');

        // 아티스트 API 호출
        await page.goto('/artists');
        await page.waitForLoadState('networkidle');

        // API 응답 확인
        const apiResponses = responses.filter(r => r.url.includes('/api/'));
        console.log('API Responses:', apiResponses);

        // 500 에러가 없는지 확인
        const errorResponses = apiResponses.filter(r => r.status >= 500);
        expect(errorResponses).toHaveLength(0);
    });

    test('에러 페이지 테스트', async ({ page }) => {
        // 존재하지 않는 페이지로 이동
        await page.goto('/non-existent-page');

        // 404 페이지 또는 에러 페이지가 표시되는지 확인
        const errorContent = page.locator('text=404').or(page.locator('text=Not Found')).or(page.locator('text=Error'));
        await expect(errorContent).toBeVisible();
    });

    test('성능 테스트', async ({ page }) => {
        // 성능 메트릭 수집
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

        // 로드 시간이 5초 이내인지 확인
        expect(performanceMetrics.loadTime).toBeLessThan(5000);
    });
});
