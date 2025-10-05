import { test, expect } from '@playwright/test';

test.describe('Community Flow', () => {
  test.beforeEach(async ({ page }) => {
    // 사용자 로그인
    await page.goto('/auth/signin');
    await page.fill('input[name="email"]', 'user@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
  });

  test('커뮤니티 게시글 작성 및 수정', async ({ page }) => {
    await page.goto('/community');
    
    // 새 게시글 작성
    await page.click('button:has-text("글쓰기")');
    
    // 게시글 작성 폼
    await page.fill('input[name="title"]', '커뮤니티 테스트 게시글');
    await page.fill('textarea[name="content"]', '커뮤니티 테스트 게시글 내용입니다.');
    await page.selectOption('select[name="category"]', 'QUESTION');
    
    // 게시글 발행
    await page.click('button:has-text("발행")');
    
    // 성공 메시지 확인
    await expect(page.locator('text=게시글이 작성되었습니다')).toBeVisible();
    
    // 게시글 상세 페이지로 이동
    await page.click('text=커뮤니티 테스트 게시글');
    
    // 게시글 수정
    await page.click('button:has-text("수정")');
    await page.fill('textarea[name="content"]', '수정된 게시글 내용입니다.');
    await page.click('button:has-text("수정 완료")');
    
    // 수정 확인
    await expect(page.locator('text=수정된 게시글 내용입니다')).toBeVisible();
  });

  test('게시글 좋아요 및 댓글', async ({ page }) => {
    await page.goto('/community');
    
    // 게시글 선택
    const postCard = page.locator('[data-testid="post-card"]').first();
    await postCard.click();
    
    // 좋아요 버튼 클릭
    await page.click('button[data-testid="like-button"]');
    await expect(page.locator('text=좋아요가 추가되었습니다')).toBeVisible();
    
    // 댓글 작성
    await page.fill('textarea[name="comment"]', '테스트 댓글입니다.');
    await page.click('button:has-text("댓글 작성")');
    
    // 댓글 확인
    await expect(page.locator('text=테스트 댓글입니다')).toBeVisible();
  });

  test('게시글 신고', async ({ page }) => {
    await page.goto('/community');
    
    // 게시글 선택
    const postCard = page.locator('[data-testid="post-card"]').first();
    await postCard.click();
    
    // 신고 버튼 클릭
    await page.click('button:has-text("신고")');
    
    // 신고 사유 선택
    await page.selectOption('select[name="reason"]', 'SPAM');
    await page.fill('textarea[name="description"]', '스팸 게시글입니다.');
    
    // 신고 제출
    await page.click('button:has-text("신고 제출")');
    
    // 신고 완료 확인
    await expect(page.locator('text=신고가 접수되었습니다')).toBeVisible();
  });

  test('게시글 검색 및 필터링', async ({ page }) => {
    await page.goto('/community');
    
    // 검색 기능 테스트
    await page.fill('input[placeholder="게시글 검색..."]', '테스트');
    await page.click('button:has-text("검색")');
    
    // 검색 결과 확인
    const searchResults = page.locator('[data-testid="post-card"]');
    await expect(searchResults).toHaveCount.greaterThan(0);
    
    // 카테고리 필터 테스트
    await page.selectOption('select[name="category"]', 'QUESTION');
    await page.click('button:has-text("필터 적용")');
    
    // 필터 결과 확인
    const filteredResults = page.locator('[data-testid="post-card"]');
    await expect(filteredResults).toHaveCount.greaterThan(0);
  });

  test('프로젝트 커뮤니티', async ({ page }) => {
    // 프로젝트 페이지로 이동
    await page.goto('/projects');
    
    // 프로젝트 선택
    const projectCard = page.locator('[data-testid="project-card"]').first();
    await projectCard.click();
    
    // 커뮤니티 탭 클릭
    await page.click('button:has-text("커뮤니티")');
    
    // 프로젝트 커뮤니티 게시글 작성
    await page.click('button:has-text("글쓰기")');
    await page.fill('input[name="title"]', '프로젝트 관련 질문');
    await page.fill('textarea[name="content"]', '프로젝트에 대한 질문이 있습니다.');
    await page.selectOption('select[name="category"]', 'QUESTION');
    
    // 게시글 발행
    await page.click('button:has-text("발행")');
    
    // 성공 메시지 확인
    await expect(page.locator('text=게시글이 작성되었습니다')).toBeVisible();
  });

  test('게시글 삭제', async ({ page }) => {
    await page.goto('/community');
    
    // 내가 작성한 게시글 찾기
    const myPost = page.locator('[data-testid="post-card"]:has-text("내가 작성한 게시글")').first();
    await myPost.click();
    
    // 삭제 버튼 클릭
    await page.click('button:has-text("삭제")');
    
    // 삭제 확인 다이얼로그
    await page.click('button:has-text("삭제 확인")');
    
    // 삭제 완료 확인
    await expect(page.locator('text=게시글이 삭제되었습니다')).toBeVisible();
  });

  test('인기 게시글 및 트렌딩', async ({ page }) => {
    await page.goto('/community');
    
    // 인기 게시글 섹션 확인
    await expect(page.locator('[data-testid="popular-posts"]')).toBeVisible();
    
    // 트렌딩 게시글 섹션 확인
    await expect(page.locator('[data-testid="trending-posts"]')).toBeVisible();
    
    // 정렬 옵션 테스트
    await page.selectOption('select[name="sort"]', 'popular');
    await page.click('button:has-text("정렬")');
    
    // 인기순 정렬 결과 확인
    const popularPosts = page.locator('[data-testid="post-card"]');
    await expect(popularPosts).toHaveCount.greaterThan(0);
  });
});
