import { test, expect } from '@playwright/test';

test.describe('Artist Funding Platform - E2E Tests', () => {
    test.beforeEach(async ({ page }) => {
        // ?�페?��?�?직접 ?�동
        await page.goto('/');
        // ?�이지 로딩 ?��?
        await page.waitForLoadState('networkidle');
    });

    test('?�용???�정: ?�페?��? ?�색 ???�로?�트 ?�세 ???�원 ?�도', async ({ page }) => {
        // 1. ?�페?��??�서 ?�로?�트 카드 ?�인
        await expect(page.locator('h1')).toBeVisible();
        
        // 2. ?�로?�트 ?�션?�로 ?�크�?
        const projectsSection = page.locator('section').filter({ hasText: '?�로?�트' });
        await projectsSection.scrollIntoViewIfNeeded();
        
        // 3. �?번째 ?�로?�트 카드 ?�릭
        const firstProjectCard = page.locator('[data-testid="project-card"]').first();
        if (await firstProjectCard.count() > 0) {
            await firstProjectCard.click();
            await page.waitForLoadState('networkidle');
            
            // 4. ?�로?�트 ?�세 ?�이지 ?�인
            await expect(page.locator('h1')).toBeVisible();
            
            // 5. ?�원 버튼 ?�인 (로그?�하지 ?��? ?�태)
            const fundingButton = page.locator('button').filter({ hasText: /?�원|?�?? });
            if (await fundingButton.count() > 0) {
                await expect(fundingButton).toBeVisible();
            }
        }
    });

    test('?�용???�정: 커�??�티 ?�색 ??게시글 ?�성 ?�도', async ({ page }) => {
        // 1. 커�??�티 ?�이지�??�동
        await page.goto('/community');
        await page.waitForLoadState('networkidle');

        // 2. 커�??�티 ?�목 ?�인
        await expect(page.locator('h1')).toBeVisible();

        // 3. 게시글 목록 ?�인
        const postsContainer = page.locator('[data-testid="posts-container"]').or(page.locator('main'));
        await expect(postsContainer).toBeVisible();

        // 4. ??게시글 ?�성 버튼 ?�인 (로그?�하지 ?��? ?�태)
        const newPostButton = page.locator('a[href="/community/new"]').or(page.locator('button').filter({ hasText: /??*게시글|글.*?�기/ }));
        if (await newPostButton.count() > 0) {
            await expect(newPostButton).toBeVisible();
        }

        // 5. �?번째 게시글 ?�릭 (?�는 경우)
        const firstPost = page.locator('[data-testid="post-card"]').first();
        if (await firstPost.count() > 0) {
            await firstPost.click();
            await page.waitForLoadState('networkidle');
            
            // 6. 게시글 ?�세 ?�이지 ?�인
            await expect(page.locator('h1')).toBeVisible();
        }
    });

    test('?�용???�정: ?�로?�트 ?�색 ???�터�????�세 보기', async ({ page }) => {
        // 1. ?�로?�트 ?�이지�??�동
        await page.goto('/projects');
        await page.waitForLoadState('networkidle');

        // 2. ?�로?�트 ?�목 ?�인
        await expect(page.locator('h1')).toBeVisible();

        // 3. ?�로?�트 목록 ?�인
        const projectsContainer = page.locator('[data-testid="projects-container"]').or(page.locator('main'));
        await expect(projectsContainer).toBeVisible();

        // 4. ?�터 버튼 ?�인 (?�는 경우)
        const filterButton = page.locator('button').filter({ hasText: /?�터|카테고리/ });
        if (await filterButton.count() > 0) {
            await filterButton.click();
            await page.waitForTimeout(500); // ?�터 메뉴 로딩 ?��?
        }

        // 5. �?번째 ?�로?�트 ?�릭
        const firstProject = page.locator('[data-testid="project-card"]').first();
        if (await firstProject.count() > 0) {
            await firstProject.click();
            await page.waitForLoadState('networkidle');
            
            // 6. ?�로?�트 ?�세 ?�이지 ?�인
            await expect(page.locator('h1')).toBeVisible();
        }
    });

    test('?�용???�정: ?�티?�트 ?�색 ???�로??보기', async ({ page }) => {
        // 1. ?�티?�트 ?�이지�??�동
        await page.goto('/artists');
        await page.waitForLoadState('networkidle');

        // 2. ?�티?�트 ?�목 ?�인
        await expect(page.locator('h1')).toBeVisible();

        // 3. ?�티?�트 목록 ?�인
        const artistsContainer = page.locator('[data-testid="artists-container"]').or(page.locator('main'));
        await expect(artistsContainer).toBeVisible();

        // 4. �?번째 ?�티?�트 ?�릭
        const firstArtist = page.locator('[data-testid="artist-card"]').first();
        if (await firstArtist.count() > 0) {
            await firstArtist.click();
            await page.waitForLoadState('networkidle');
            
            // 5. ?�티?�트 ?�로???�이지 ?�인
            await expect(page.locator('h1')).toBeVisible();
        }
    });

    test('?�용???�정: 반응???�자???�스??, async ({ page }) => {
        // 1. 모바??뷰포?�에???�스??
        await page.setViewportSize({ width: 375, height: 667 });
        await page.waitForLoadState('networkidle');

        // 모바?�에???�비게이???�인
        const mobileNav = page.locator('[data-testid="mobile-nav"]').or(page.locator('nav'));
        await expect(mobileNav).toBeVisible();

        // 2. ?�블�?뷰포?�로 변�?
        await page.setViewportSize({ width: 768, height: 1024 });
        await page.waitForLoadState('networkidle');

        // ?�블릿에???�비게이???�인
        await expect(mobileNav).toBeVisible();

        // 3. ?�스?�톱 뷰포?�로 변�?
        await page.setViewportSize({ width: 1920, height: 1080 });
        await page.waitForLoadState('networkidle');

        // ?�스?�톱?�서 ?�비게이???�인
        await expect(mobileNav).toBeVisible();
    });

    test('?�용???�정: ?�러 처리 �?복구', async ({ page }) => {
        // 1. 존재?��? ?�는 ?�이지�??�동
        await page.goto('/non-existent-page');

        // 2. 404 ?�이지 ?�인
        await expect(page.locator('h1')).toBeVisible();
        
        // 3. ?�으�??�아가�?버튼 ?�인
        const homeButton = page.locator('a[href="/"]').or(page.locator('button').filter({ hasText: /??메인/ }));
        if (await homeButton.count() > 0) {
            await homeButton.click();
            await page.waitForLoadState('networkidle');
            
            // 4. ?�페?��?�??�아?�는지 ?�인
            await expect(page.locator('h1')).toBeVisible();
        }
    });

    test('?�용???�정: ?�근??�??�용??검�?, async ({ page }) => {
        // 1. ?�이지 로딩 ?��?
        await page.waitForLoadState('networkidle');

        // 2. 주요 ?�목??h1 ?�그?��? ?�인
        const mainHeading = page.locator('h1');
        await expect(mainHeading).toBeVisible();

        // 3. ?�비게이???�인
        const navigation = page.locator('nav');
        await expect(navigation).toBeVisible();

        // 4. 주요 링크?�이 ?�절???�스?��? 가지�??�는지 ?�인
        const mainLinks = page.locator('nav a, main a').first(5);
        const linkCount = await mainLinks.count();
        for (let i = 0; i < linkCount; i++) {
            const link = mainLinks.nth(i);
            const text = await link.textContent();
            expect(text).toBeTruthy();
            expect(text?.trim().length).toBeGreaterThan(0);
        }
    });

    test('?�용???�정: ?�능 �??�용??경험 검�?, async ({ page }) => {
        // 1. ?�이지 로딩 ?�간 측정
        const startTime = Date.now();
        await page.goto('/');
        await page.waitForLoadState('networkidle');
        const endTime = Date.now();
        const loadTime = endTime - startTime;

        // 2. 로딩 ?�간??5�??�내?��? ?�인
        expect(loadTime).toBeLessThan(5000);

        // 3. ?�이지 ?�목 ?�인
        const title = await page.title();
        expect(title).toBeTruthy();
        expect(title.length).toBeGreaterThan(0);

        // 4. 메�? ?�명 ?�인 (?�는 경우)
        const metaDescription = page.locator('meta[name="description"]');
        if (await metaDescription.count() > 0) {
            const description = await metaDescription.getAttribute('content');
            expect(description).toBeTruthy();
        }
    });
});
