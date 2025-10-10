import { test, expect } from '@playwright/test';

test.describe('Artist Funding Platform - E2E Tests', () => {
    test.beforeEach(async ({ page }) => {
        // ?ˆí˜?´ì?ë¡?ì§ì ‘ ?´ë™
        await page.goto('/');
        // ?˜ì´ì§€ ë¡œë”© ?€ê¸?
        await page.waitForLoadState('networkidle');
    });

    test('?¬ìš©???¬ì •: ?ˆí˜?´ì? ?ìƒ‰ ???„ë¡œ?íŠ¸ ?ì„¸ ???„ì› ?œë„', async ({ page }) => {
        // 1. ?ˆí˜?´ì??ì„œ ?„ë¡œ?íŠ¸ ì¹´ë“œ ?•ì¸
        await expect(page.locator('h1')).toBeVisible();
        
        // 2. ?„ë¡œ?íŠ¸ ?¹ì…˜?¼ë¡œ ?¤í¬ë¡?
        const projectsSection = page.locator('section').filter({ hasText: '?„ë¡œ?íŠ¸' });
        await projectsSection.scrollIntoViewIfNeeded();
        
        // 3. ì²?ë²ˆì§¸ ?„ë¡œ?íŠ¸ ì¹´ë“œ ?´ë¦­
        const firstProjectCard = page.locator('[data-testid="project-card"]').first();
        if (await firstProjectCard.count() > 0) {
            await firstProjectCard.click();
            await page.waitForLoadState('networkidle');
            
            // 4. ?„ë¡œ?íŠ¸ ?ì„¸ ?˜ì´ì§€ ?•ì¸
            await expect(page.locator('h1')).toBeVisible();
            
            // 5. ?„ì› ë²„íŠ¼ ?•ì¸ (ë¡œê·¸?¸í•˜ì§€ ?Šì? ?íƒœ)
            const fundingButton = page.locator('button').filter({ hasText: /?„ì›|?€?? });
            if (await fundingButton.count() > 0) {
                await expect(fundingButton).toBeVisible();
            }
        }
    });

    test('?¬ìš©???¬ì •: ì»¤ë??ˆí‹° ?ìƒ‰ ??ê²Œì‹œê¸€ ?‘ì„± ?œë„', async ({ page }) => {
        // 1. ì»¤ë??ˆí‹° ?˜ì´ì§€ë¡??´ë™
        await page.goto('/community');
        await page.waitForLoadState('networkidle');

        // 2. ì»¤ë??ˆí‹° ?œëª© ?•ì¸
        await expect(page.locator('h1')).toBeVisible();

        // 3. ê²Œì‹œê¸€ ëª©ë¡ ?•ì¸
        const postsContainer = page.locator('[data-testid="posts-container"]').or(page.locator('main'));
        await expect(postsContainer).toBeVisible();

        // 4. ??ê²Œì‹œê¸€ ?‘ì„± ë²„íŠ¼ ?•ì¸ (ë¡œê·¸?¸í•˜ì§€ ?Šì? ?íƒœ)
        const newPostButton = page.locator('a[href="/community/new"]').or(page.locator('button').filter({ hasText: /??*ê²Œì‹œê¸€|ê¸€.*?°ê¸°/ }));
        if (await newPostButton.count() > 0) {
            await expect(newPostButton).toBeVisible();
        }

        // 5. ì²?ë²ˆì§¸ ê²Œì‹œê¸€ ?´ë¦­ (?ˆëŠ” ê²½ìš°)
        const firstPost = page.locator('[data-testid="post-card"]').first();
        if (await firstPost.count() > 0) {
            await firstPost.click();
            await page.waitForLoadState('networkidle');
            
            // 6. ê²Œì‹œê¸€ ?ì„¸ ?˜ì´ì§€ ?•ì¸
            await expect(page.locator('h1')).toBeVisible();
        }
    });

    test('?¬ìš©???¬ì •: ?„ë¡œ?íŠ¸ ?ìƒ‰ ???„í„°ë§????ì„¸ ë³´ê¸°', async ({ page }) => {
        // 1. ?„ë¡œ?íŠ¸ ?˜ì´ì§€ë¡??´ë™
        await page.goto('/projects');
        await page.waitForLoadState('networkidle');

        // 2. ?„ë¡œ?íŠ¸ ?œëª© ?•ì¸
        await expect(page.locator('h1')).toBeVisible();

        // 3. ?„ë¡œ?íŠ¸ ëª©ë¡ ?•ì¸
        const projectsContainer = page.locator('[data-testid="projects-container"]').or(page.locator('main'));
        await expect(projectsContainer).toBeVisible();

        // 4. ?„í„° ë²„íŠ¼ ?•ì¸ (?ˆëŠ” ê²½ìš°)
        const filterButton = page.locator('button').filter({ hasText: /?„í„°|ì¹´í…Œê³ ë¦¬/ });
        if (await filterButton.count() > 0) {
            await filterButton.click();
            await page.waitForTimeout(500); // ?„í„° ë©”ë‰´ ë¡œë”© ?€ê¸?
        }

        // 5. ì²?ë²ˆì§¸ ?„ë¡œ?íŠ¸ ?´ë¦­
        const firstProject = page.locator('[data-testid="project-card"]').first();
        if (await firstProject.count() > 0) {
            await firstProject.click();
            await page.waitForLoadState('networkidle');
            
            // 6. ?„ë¡œ?íŠ¸ ?ì„¸ ?˜ì´ì§€ ?•ì¸
            await expect(page.locator('h1')).toBeVisible();
        }
    });

    test('?¬ìš©???¬ì •: ?„í‹°?¤íŠ¸ ?ìƒ‰ ???„ë¡œ??ë³´ê¸°', async ({ page }) => {
        // 1. ?„í‹°?¤íŠ¸ ?˜ì´ì§€ë¡??´ë™
        await page.goto('/artists');
        await page.waitForLoadState('networkidle');

        // 2. ?„í‹°?¤íŠ¸ ?œëª© ?•ì¸
        await expect(page.locator('h1')).toBeVisible();

        // 3. ?„í‹°?¤íŠ¸ ëª©ë¡ ?•ì¸
        const artistsContainer = page.locator('[data-testid="artists-container"]').or(page.locator('main'));
        await expect(artistsContainer).toBeVisible();

        // 4. ì²?ë²ˆì§¸ ?„í‹°?¤íŠ¸ ?´ë¦­
        const firstArtist = page.locator('[data-testid="artist-card"]').first();
        if (await firstArtist.count() > 0) {
            await firstArtist.click();
            await page.waitForLoadState('networkidle');
            
            // 5. ?„í‹°?¤íŠ¸ ?„ë¡œ???˜ì´ì§€ ?•ì¸
            await expect(page.locator('h1')).toBeVisible();
        }
    });

    test('?¬ìš©???¬ì •: ë°˜ì‘???”ì???ŒìŠ¤??, async ({ page }) => {
        // 1. ëª¨ë°”??ë·°í¬?¸ì—???ŒìŠ¤??
        await page.setViewportSize({ width: 375, height: 667 });
        await page.waitForLoadState('networkidle');

        // ëª¨ë°”?¼ì—???¤ë¹„ê²Œì´???•ì¸
        const mobileNav = page.locator('[data-testid="mobile-nav"]').or(page.locator('nav'));
        await expect(mobileNav).toBeVisible();

        // 2. ?œë¸”ë¦?ë·°í¬?¸ë¡œ ë³€ê²?
        await page.setViewportSize({ width: 768, height: 1024 });
        await page.waitForLoadState('networkidle');

        // ?œë¸”ë¦¿ì—???¤ë¹„ê²Œì´???•ì¸
        await expect(mobileNav).toBeVisible();

        // 3. ?°ìŠ¤?¬í†± ë·°í¬?¸ë¡œ ë³€ê²?
        await page.setViewportSize({ width: 1920, height: 1080 });
        await page.waitForLoadState('networkidle');

        // ?°ìŠ¤?¬í†±?ì„œ ?¤ë¹„ê²Œì´???•ì¸
        await expect(mobileNav).toBeVisible();
    });

    test('?¬ìš©???¬ì •: ?ëŸ¬ ì²˜ë¦¬ ë°?ë³µêµ¬', async ({ page }) => {
        // 1. ì¡´ì¬?˜ì? ?ŠëŠ” ?˜ì´ì§€ë¡??´ë™
        await page.goto('/non-existent-page');

        // 2. 404 ?˜ì´ì§€ ?•ì¸
        await expect(page.locator('h1')).toBeVisible();
        
        // 3. ?ˆìœ¼ë¡??Œì•„ê°€ê¸?ë²„íŠ¼ ?•ì¸
        const homeButton = page.locator('a[href="/"]').or(page.locator('button').filter({ hasText: /??ë©”ì¸/ }));
        if (await homeButton.count() > 0) {
            await homeButton.click();
            await page.waitForLoadState('networkidle');
            
            // 4. ?ˆí˜?´ì?ë¡??Œì•„?”ëŠ”ì§€ ?•ì¸
            await expect(page.locator('h1')).toBeVisible();
        }
    });

    test('?¬ìš©???¬ì •: ?‘ê·¼??ë°??¬ìš©??ê²€ì¦?, async ({ page }) => {
        // 1. ?˜ì´ì§€ ë¡œë”© ?€ê¸?
        await page.waitForLoadState('networkidle');

        // 2. ì£¼ìš” ?œëª©??h1 ?œê·¸?¸ì? ?•ì¸
        const mainHeading = page.locator('h1');
        await expect(mainHeading).toBeVisible();

        // 3. ?¤ë¹„ê²Œì´???•ì¸
        const navigation = page.locator('nav');
        await expect(navigation).toBeVisible();

        // 4. ì£¼ìš” ë§í¬?¤ì´ ?ì ˆ???ìŠ¤?¸ë? ê°€ì§€ê³??ˆëŠ”ì§€ ?•ì¸
        const mainLinks = page.locator('nav a, main a').first(5);
        const linkCount = await mainLinks.count();
        for (let i = 0; i < linkCount; i++) {
            const link = mainLinks.nth(i);
            const text = await link.textContent();
            expect(text).toBeTruthy();
            expect(text?.trim().length).toBeGreaterThan(0);
        }
    });

    test('?¬ìš©???¬ì •: ?±ëŠ¥ ë°??¬ìš©??ê²½í—˜ ê²€ì¦?, async ({ page }) => {
        // 1. ?˜ì´ì§€ ë¡œë”© ?œê°„ ì¸¡ì •
        const startTime = Date.now();
        await page.goto('/');
        await page.waitForLoadState('networkidle');
        const endTime = Date.now();
        const loadTime = endTime - startTime;

        // 2. ë¡œë”© ?œê°„??5ì´??´ë‚´?¸ì? ?•ì¸
        expect(loadTime).toBeLessThan(5000);

        // 3. ?˜ì´ì§€ ?œëª© ?•ì¸
        const title = await page.title();
        expect(title).toBeTruthy();
        expect(title.length).toBeGreaterThan(0);

        // 4. ë©”í? ?¤ëª… ?•ì¸ (?ˆëŠ” ê²½ìš°)
        const metaDescription = page.locator('meta[name="description"]');
        if (await metaDescription.count() > 0) {
            const description = await metaDescription.getAttribute('content');
            expect(description).toBeTruthy();
        }
    });
});
