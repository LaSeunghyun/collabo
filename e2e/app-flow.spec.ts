import { test, expect } from '@playwright/test';

test.describe('Artist Funding Platform - E2E Tests', () => {
    test.beforeEach(async ({ page }) => {
        // 홈페이지로 직접 이동
        await page.goto('/');
        // 페이지 로딩 대기
        await page.waitForLoadState('networkidle');
    });

    test('사용자 시나리오: 홈페이지 탐색 및 프로젝트 상세 보기 흐름', async ({ page }) => {
        // 1. 홈페이지에서 프로젝트 카드 확인
        await expect(page.locator('h1')).toBeVisible();
        
        // 2. 프로젝트 섹션으로 스크롤
        const projectsSection = page.locator('section').filter({ hasText: '프로젝트' });
        await projectsSection.scrollIntoViewIfNeeded();
        
        // 3. 첫 번째 프로젝트 카드 클릭
        const firstProjectCard = page.locator('[data-testid="project-card"]').first();
        if (await firstProjectCard.count() > 0) {
            await firstProjectCard.click();
            await page.waitForLoadState('networkidle');
            
            // 4. 프로젝트 상세 페이지 확인
            await expect(page.locator('h1')).toBeVisible();
            
            // 5. 후원 버튼 확인 (로그인하지 않은 상태)
            const fundingButton = page.locator('button').filter({ hasText: /후원|펀딩/ });
            if (await fundingButton.count() > 0) {
                await expect(fundingButton).toBeVisible();
            }
        }
    });

    test('사용자 시나리오: 프로젝트 탐색 및 필터링 상세 보기', async ({ page }) => {
        // 1. 프로젝트 페이지로 이동
        await page.goto('/projects');
        await page.waitForLoadState('networkidle');

        // 2. 프로젝트 제목 확인
        await expect(page.locator('h1')).toBeVisible();

        // 3. 프로젝트 목록 확인
        const projectsContainer = page.locator('[data-testid="projects-container"]').or(page.locator('main'));
        await expect(projectsContainer).toBeVisible();

        // 4. 필터 버튼 확인 (있는 경우)
        const filterButton = page.locator('button').filter({ hasText: /필터|카테고리/ });
        if (await filterButton.count() > 0) {
            await filterButton.click();
            await page.waitForTimeout(500); // 필터 메뉴 로딩 대기
        }

        // 5. 첫 번째 프로젝트 클릭
        const firstProject = page.locator('[data-testid="project-card"]').first();
        if (await firstProject.count() > 0) {
            await firstProject.click();
            await page.waitForLoadState('networkidle');
            
            // 6. 프로젝트 상세 페이지 확인
            await expect(page.locator('h1')).toBeVisible();
        }
    });

    test('사용자 시나리오: 아티스트 탐색 및 프로필보기', async ({ page }) => {
        // 1. 아티스트 페이지로 이동
        await page.goto('/artists');
        await page.waitForLoadState('networkidle');

        // 2. 아티스트 제목 확인
        await expect(page.locator('h1')).toBeVisible();

        // 3. 아티스트 목록 확인
        const artistsContainer = page.locator('[data-testid="artists-container"]').or(page.locator('main'));
        await expect(artistsContainer).toBeVisible();

        // 4. 첫 번째 아티스트 클릭
        const firstArtist = page.locator('[data-testid="artist-card"]').first();
        if (await firstArtist.count() > 0) {
            await firstArtist.click();
            await page.waitForLoadState('networkidle');
            
            // 5. 아티스트 프로필 페이지 확인
            await expect(page.locator('h1')).toBeVisible();
        }
    });

    test('사용자 시나리오: 반응형 디자인 테스트', async ({ page }) => {
        // 1. 모바일 뷰포트에서 테스트
        await page.setViewportSize({ width: 375, height: 667 });
        await page.waitForLoadState('networkidle');

        // 모바일에서의 네비게이션 확인
        const mobileNav = page.locator('[data-testid="mobile-nav"]').or(page.locator('nav'));
        await expect(mobileNav).toBeVisible();

        // 2. 태블릿 뷰포트로 변경
        await page.setViewportSize({ width: 768, height: 1024 });
        await page.waitForLoadState('networkidle');

        // 태블릿에서의 네비게이션 확인
        await expect(mobileNav).toBeVisible();

        // 3. 데스크톱 뷰포트로 변경
        await page.setViewportSize({ width: 1920, height: 1080 });
        await page.waitForLoadState('networkidle');

        // 데스크톱에서의 네비게이션 확인
        await expect(mobileNav).toBeVisible();
    });

    test('사용자 시나리오: 에러 처리 및 복구', async ({ page }) => {
        // 1. 존재하지 않는 페이지로 이동
        await page.goto('/non-existent-page');

        // 2. 404 페이지 확인
        await expect(page.locator('h1')).toBeVisible();
        
        // 3. 다시 홈으로 가기 버튼 확인
        const homeButton = page.locator('a[href="/"]').or(page.locator('button').filter({ hasText: /홈메인/ }));
        if (await homeButton.count() > 0) {
            await homeButton.click();
            await page.waitForLoadState('networkidle');
            
            // 4. 홈페이지로 돌아가는지 확인
            await expect(page.locator('h1')).toBeVisible();
        }
    });

    test('사용자 시나리오: 접근성 및 사용자 경험 검증', async ({ page }) => {
        // 1. 페이지 로딩 대기
        await page.waitForLoadState('networkidle');

        // 2. 주요 제목인 h1 태그가 있는지 확인
        const mainHeading = page.locator('h1');
        await expect(mainHeading).toBeVisible();

        // 3. 네비게이션 확인
        const navigation = page.locator('nav');
        await expect(navigation).toBeVisible();

        // 4. 주요 링크들이 절대 경로나 스타일을 가지는지 확인
        const mainLinks = page.locator('nav a, main a').first(5);
        const linkCount = await mainLinks.count();
        for (let i = 0; i < linkCount; i++) {
            const link = mainLinks.nth(i);
            const text = await link.textContent();
            expect(text).toBeTruthy();
            expect(text?.trim().length).toBeGreaterThan(0);
        }
    });

    test('사용자 시나리오: 성능 및 사용자 경험 검증', async ({ page }) => {
        // 1. 페이지 로딩 시간 측정
        const startTime = Date.now();
        await page.goto('/');
        await page.waitForLoadState('networkidle');
        const endTime = Date.now();
        const loadTime = endTime - startTime;

        // 2. 로딩 시간이 5초 이내인지 확인
        expect(loadTime).toBeLessThan(5000);

        // 3. 페이지 제목 확인
        const title = await page.title();
        expect(title).toBeTruthy();
        expect(title.length).toBeGreaterThan(0);

        // 4. 메타 설명 확인 (있는 경우)
        const metaDescription = page.locator('meta[name="description"]');
        if (await metaDescription.count() > 0) {
            const description = await metaDescription.getAttribute('content');
            expect(description).toBeTruthy();
        }
    });
});