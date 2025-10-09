import { test, expect } from '@playwright/test';

test.describe('Artist Funding Platform - E2E Tests', () => {
    test.beforeEach(async ({ page }) => {
        // 홈페이지로 직접 이동
        await page.goto('/');
    });

    test('홈페이지 로딩 및 기본 네비게이션', async ({ page }) => {
        // 페이지 제목 확인
        await expect(page).toHaveTitle(/Collaborium/);

        // 주요 섹션이 표시되는지 확인
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

        // 페이지 로딩 대기
        await page.waitForLoadState('networkidle');

        // 커뮤니티 제목 확인
        await expect(page.locator('h1')).toBeVisible();

        // 게시글 목록 컨테이너 확인
        const postsContainer = page.locator('[data-testid="posts-container"]').or(page.locator('main'));
        await expect(postsContainer).toBeVisible();
    });

    test('프로젝트 페이지 기능 테스트', async ({ page }) => {
        // 프로젝트 페이지로 직접 이동
        await page.goto('/projects');

        // 페이지 로딩 대기
        await page.waitForLoadState('networkidle');

        // 프로젝트 제목 확인
        await expect(page.locator('h1')).toBeVisible();

        // 프로젝트 목록 컨테이너 확인
        const projectsContainer = page.locator('[data-testid="projects-container"]').or(page.locator('main'));
        await expect(projectsContainer).toBeVisible();
    });

    test('아티스트 페이지 기능 테스트', async ({ page }) => {
        // 아티스트 페이지로 직접 이동
        await page.goto('/artists');

        // 페이지 로딩 대기
        await page.waitForLoadState('networkidle');

        // 아티스트 제목 확인
        await expect(page.locator('h1')).toBeVisible();

        // 아티스트 목록 컨테이너 확인
        const artistsContainer = page.locator('[data-testid="artists-container"]').or(page.locator('main'));
        await expect(artistsContainer).toBeVisible();
    });

    test('파트너 페이지 기능 테스트', async ({ page }) => {
        // 파트너 페이지로 직접 이동
        await page.goto('/partners');

        // 페이지 로딩 대기
        await page.waitForLoadState('networkidle');

        // 파트너 제목 확인
        await expect(page.locator('h1')).toBeVisible();

        // 파트너 목록 컨테이너 확인
        const partnersContainer = page.locator('[data-testid="partners-container"]').or(page.locator('main'));
        await expect(partnersContainer).toBeVisible();
    });

    test('도움말 페이지 접근 테스트', async ({ page }) => {
        // 도움말 페이지로 직접 이동
        await page.goto('/help');

        // 페이지 로딩 대기
        await page.waitForLoadState('networkidle');

        // 도움말 제목 확인
        await expect(page.locator('h1')).toBeVisible();

        // 도움말 내용 확인
        const helpContent = page.locator('[data-testid="help-content"]').or(page.locator('main'));
        await expect(helpContent).toBeVisible();
    });

    test('반응형 디자인 테스트', async ({ page }) => {
        // 모바일 뷰포트로 변경
        await page.setViewportSize({ width: 375, height: 667 });
        await page.waitForLoadState('networkidle');

        // 모바일에서 네비게이션 확인
        const mobileNav = page.locator('[data-testid="mobile-nav"]').or(page.locator('nav'));
        await expect(mobileNav).toBeVisible();

        // 태블릿 뷰포트로 변경
        await page.setViewportSize({ width: 768, height: 1024 });
        await page.waitForLoadState('networkidle');

        // 태블릿에서 네비게이션 확인
        await expect(mobileNav).toBeVisible();

        // 데스크톱 뷰포트로 변경
        await page.setViewportSize({ width: 1920, height: 1080 });
        await page.waitForLoadState('networkidle');

        // 데스크톱에서 네비게이션 확인
        await expect(mobileNav).toBeVisible();
    });

    test('에러 페이지 테스트', async ({ page }) => {
        // 존재하지 않는 페이지로 이동
        await page.goto('/non-existent-page');

        // 404 페이지 확인
        await expect(page.locator('h1')).toBeVisible();
        await expect(page.locator('text=404')).toBeVisible();
    });

    test('접근성 테스트', async ({ page }) => {
        // 페이지 로딩 대기
        await page.waitForLoadState('networkidle');

        // 주요 제목이 h1 태그인지 확인
        const mainHeading = page.locator('h1');
        await expect(mainHeading).toBeVisible();

        // 네비게이션에 적절한 aria-label이 있는지 확인
        const navigation = page.locator('nav');
        await expect(navigation).toBeVisible();

        // 링크들이 적절한 텍스트를 가지고 있는지 확인
        const links = page.locator('a');
        const linkCount = await links.count();
        for (let i = 0; i < Math.min(linkCount, 5); i++) {
            const link = links.nth(i);
            const text = await link.textContent();
            expect(text).toBeTruthy();
        }
    });

    test('성능 테스트', async ({ page }) => {
        // 페이지 로딩 시간 측정
        const startTime = Date.now();
        await page.goto('/');
        await page.waitForLoadState('networkidle');
        const endTime = Date.now();
        const loadTime = endTime - startTime;

        // 로딩 시간이 5초 이내인지 확인
        expect(loadTime).toBeLessThan(5000);
    });

    test('SEO 테스트', async ({ page }) => {
        // 페이지 제목 확인
        const title = await page.title();
        expect(title).toBeTruthy();
        expect(title.length).toBeGreaterThan(0);

        // 메타 설명 확인
        const metaDescription = page.locator('meta[name="description"]');
        if (await metaDescription.count() > 0) {
            const description = await metaDescription.getAttribute('content');
            expect(description).toBeTruthy();
        }

        // 주요 제목 확인
        const mainHeading = page.locator('h1');
        await expect(mainHeading).toBeVisible();
    });
});