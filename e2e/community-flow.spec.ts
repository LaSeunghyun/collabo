import { test, expect } from '@playwright/test';

test.describe('Community Flow', () => {
  test.beforeEach(async ({ page }) => {
    // ?¬ìš©??ë¡œê·¸??
    await page.goto('/auth/signin');
    await page.fill('input[name="email"]', 'user@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
  });

  test('ì»¤ë??ˆí‹° ê²Œì‹œê¸€ ?‘ì„± ë°??˜ì •', async ({ page }) => {
    await page.goto('/community');
    
    // ??ê²Œì‹œê¸€ ?‘ì„±
    await page.click('button:has-text("ê¸€?°ê¸°")');
    
    // ê²Œì‹œê¸€ ?‘ì„± ??
    await page.fill('input[name="title"]', 'ì»¤ë??ˆí‹° ?ŒìŠ¤??ê²Œì‹œê¸€');
    await page.fill('textarea[name="content"]', 'ì»¤ë??ˆí‹° ?ŒìŠ¤??ê²Œì‹œê¸€ ?´ìš©?…ë‹ˆ??');
    await page.selectOption('select[name="category"]', 'QUESTION');
    
    // ê²Œì‹œê¸€ ë°œí–‰
    await page.click('button:has-text("ë°œí–‰")');
    
    // ?±ê³µ ë©”ì‹œì§€ ?•ì¸
    await expect(page.locator('text=ê²Œì‹œê¸€???‘ì„±?˜ì—ˆ?µë‹ˆ??)).toBeVisible();
    
    // ê²Œì‹œê¸€ ?ì„¸ ?˜ì´ì§€ë¡??´ë™
    await page.click('text=ì»¤ë??ˆí‹° ?ŒìŠ¤??ê²Œì‹œê¸€');
    
    // ê²Œì‹œê¸€ ?˜ì •
    await page.click('button:has-text("?˜ì •")');
    await page.fill('textarea[name="content"]', '?˜ì •??ê²Œì‹œê¸€ ?´ìš©?…ë‹ˆ??');
    await page.click('button:has-text("?˜ì • ?„ë£Œ")');
    
    // ?˜ì • ?•ì¸
    await expect(page.locator('text=?˜ì •??ê²Œì‹œê¸€ ?´ìš©?…ë‹ˆ??)).toBeVisible();
  });

  test('ê²Œì‹œê¸€ ì¢‹ì•„??ë°??“ê?', async ({ page }) => {
    await page.goto('/community');
    
    // ê²Œì‹œê¸€ ? íƒ
    const postCard = page.locator('[data-testid="post-card"]').first();
    await postCard.click();
    
    // ì¢‹ì•„??ë²„íŠ¼ ?´ë¦­
    await page.click('button[data-testid="like-button"]');
    await expect(page.locator('text=ì¢‹ì•„?”ê? ì¶”ê??˜ì—ˆ?µë‹ˆ??)).toBeVisible();
    
    // ?“ê? ?‘ì„±
    await page.fill('textarea[name="comment"]', '?ŒìŠ¤???“ê??…ë‹ˆ??');
    await page.click('button:has-text("?“ê? ?‘ì„±")');
    
    // ?“ê? ?•ì¸
    await expect(page.locator('text=?ŒìŠ¤???“ê??…ë‹ˆ??)).toBeVisible();
  });

  test('ê²Œì‹œê¸€ ? ê³ ', async ({ page }) => {
    await page.goto('/community');
    
    // ê²Œì‹œê¸€ ? íƒ
    const postCard = page.locator('[data-testid="post-card"]').first();
    await postCard.click();
    
    // ? ê³  ë²„íŠ¼ ?´ë¦­
    await page.click('button:has-text("? ê³ ")');
    
    // ? ê³  ?¬ìœ  ? íƒ
    await page.selectOption('select[name="reason"]', 'SPAM');
    await page.fill('textarea[name="description"]', '?¤íŒ¸ ê²Œì‹œê¸€?…ë‹ˆ??');
    
    // ? ê³  ?œì¶œ
    await page.click('button:has-text("? ê³  ?œì¶œ")');
    
    // ? ê³  ?„ë£Œ ?•ì¸
    await expect(page.locator('text=? ê³ ê°€ ?‘ìˆ˜?˜ì—ˆ?µë‹ˆ??)).toBeVisible();
  });

  test('ê²Œì‹œê¸€ ê²€??ë°??„í„°ë§?, async ({ page }) => {
    await page.goto('/community');
    
    // ê²€??ê¸°ëŠ¥ ?ŒìŠ¤??
    await page.fill('input[placeholder="ê²Œì‹œê¸€ ê²€??.."]', '?ŒìŠ¤??);
    await page.click('button:has-text("ê²€??)');
    
    // ê²€??ê²°ê³¼ ?•ì¸
    const searchResults = page.locator('[data-testid="post-card"]');
    await expect(searchResults).toHaveCount.greaterThan(0);
    
    // ì¹´í…Œê³ ë¦¬ ?„í„° ?ŒìŠ¤??
    await page.selectOption('select[name="category"]', 'QUESTION');
    await page.click('button:has-text("?„í„° ?ìš©")');
    
    // ?„í„° ê²°ê³¼ ?•ì¸
    const filteredResults = page.locator('[data-testid="post-card"]');
    await expect(filteredResults).toHaveCount.greaterThan(0);
  });

  test('?„ë¡œ?íŠ¸ ì»¤ë??ˆí‹°', async ({ page }) => {
    // ?„ë¡œ?íŠ¸ ?˜ì´ì§€ë¡??´ë™
    await page.goto('/projects');
    
    // ?„ë¡œ?íŠ¸ ? íƒ
    const projectCard = page.locator('[data-testid="project-card"]').first();
    await projectCard.click();
    
    // ì»¤ë??ˆí‹° ???´ë¦­
    await page.click('button:has-text("ì»¤ë??ˆí‹°")');
    
    // ?„ë¡œ?íŠ¸ ì»¤ë??ˆí‹° ê²Œì‹œê¸€ ?‘ì„±
    await page.click('button:has-text("ê¸€?°ê¸°")');
    await page.fill('input[name="title"]', '?„ë¡œ?íŠ¸ ê´€??ì§ˆë¬¸');
    await page.fill('textarea[name="content"]', '?„ë¡œ?íŠ¸???€??ì§ˆë¬¸???ˆìŠµ?ˆë‹¤.');
    await page.selectOption('select[name="category"]', 'QUESTION');
    
    // ê²Œì‹œê¸€ ë°œí–‰
    await page.click('button:has-text("ë°œí–‰")');
    
    // ?±ê³µ ë©”ì‹œì§€ ?•ì¸
    await expect(page.locator('text=ê²Œì‹œê¸€???‘ì„±?˜ì—ˆ?µë‹ˆ??)).toBeVisible();
  });

  test('ê²Œì‹œê¸€ ?? œ', async ({ page }) => {
    await page.goto('/community');
    
    // ?´ê? ?‘ì„±??ê²Œì‹œê¸€ ì°¾ê¸°
    const myPost = page.locator('[data-testid="post-card"]:has-text("?´ê? ?‘ì„±??ê²Œì‹œê¸€")').first();
    await myPost.click();
    
    // ?? œ ë²„íŠ¼ ?´ë¦­
    await page.click('button:has-text("?? œ")');
    
    // ?? œ ?•ì¸ ?¤ì´?¼ë¡œê·?
    await page.click('button:has-text("?? œ ?•ì¸")');
    
    // ?? œ ?„ë£Œ ?•ì¸
    await expect(page.locator('text=ê²Œì‹œê¸€???? œ?˜ì—ˆ?µë‹ˆ??)).toBeVisible();
  });

  test('?¸ê¸° ê²Œì‹œê¸€ ë°??¸ë Œ??, async ({ page }) => {
    await page.goto('/community');
    
    // ?¸ê¸° ê²Œì‹œê¸€ ?¹ì…˜ ?•ì¸
    await expect(page.locator('[data-testid="popular-posts"]')).toBeVisible();
    
    // ?¸ë Œ??ê²Œì‹œê¸€ ?¹ì…˜ ?•ì¸
    await expect(page.locator('[data-testid="trending-posts"]')).toBeVisible();
    
    // ?•ë ¬ ?µì…˜ ?ŒìŠ¤??
    await page.selectOption('select[name="sort"]', 'popular');
    await page.click('button:has-text("?•ë ¬")');
    
    // ?¸ê¸°???•ë ¬ ê²°ê³¼ ?•ì¸
    const popularPosts = page.locator('[data-testid="post-card"]');
    await expect(popularPosts).toHaveCount.greaterThan(0);
  });
});
