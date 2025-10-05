import { test, expect } from '@playwright/test';

test.describe('Funding Flow', () => {
  test.beforeEach(async ({ page }) => {
    // 사용자 로그인
    await page.goto('/auth/signin');
    await page.fill('input[name="email"]', 'creator@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
  });

  test('프로젝트 생성 플로우', async ({ page }) => {
    await page.goto('/projects/new');
    
    // 1단계: 기본 정보
    await page.fill('input[name="title"]', '테스트 프로젝트');
    await page.fill('textarea[name="description"]', '테스트 프로젝트 설명입니다.');
    await page.selectOption('select[name="category"]', 'MUSIC');
    await page.fill('input[name="targetAmount"]', '1000000');
    await page.fill('input[name="endDate"]', '2024-12-31');
    await page.click('button:has-text("다음")');
    
    // 2단계: 리워드 설정
    await page.click('button:has-text("리워드 추가")');
    await page.fill('input[name="rewards.0.title"]', '기본 리워드');
    await page.fill('input[name="rewards.0.description"]', '기본 리워드 설명');
    await page.fill('input[name="rewards.0.price"]', '10000');
    await page.fill('input[name="rewards.0.limit"]', '100');
    await page.click('button:has-text("다음")');
    
    // 3단계: 예산 및 일정
    await page.fill('textarea[name="budget"]', '예산 계획입니다.');
    await page.fill('textarea[name="timeline"]', '일정 계획입니다.');
    await page.click('button:has-text("다음")');
    
    // 4단계: 검토 및 제출
    await expect(page.locator('text=프로젝트 검토')).toBeVisible();
    await page.click('button:has-text("프로젝트 제출")');
    
    // 성공 메시지 확인
    await expect(page.locator('text=프로젝트가 성공적으로 제출되었습니다')).toBeVisible();
  });

  test('프로젝트 펀딩 플로우', async ({ page }) => {
    await page.goto('/projects');
    
    // 프로젝트 선택
    const projectCard = page.locator('[data-testid="project-card"]').first();
    await projectCard.click();
    
    // 펀딩 페이지로 이동
    await page.click('button:has-text("펀딩하기")');
    
    // 리워드 선택
    await page.click('[data-testid="reward-card"]:first-child');
    await page.fill('input[name="quantity"]', '2');
    await page.click('button:has-text("장바구니에 추가")');
    
    // 주문 페이지로 이동
    await page.click('button:has-text("주문하기")');
    
    // 주문 정보 입력
    await page.fill('input[name="shippingAddress.name"]', '홍길동');
    await page.fill('input[name="shippingAddress.phone"]', '010-1234-5678');
    await page.fill('input[name="shippingAddress.address"]', '서울시 강남구');
    
    // 결제 정보 입력
    await page.fill('input[name="cardNumber"]', '4242424242424242');
    await page.fill('input[name="expiryDate"]', '12/25');
    await page.fill('input[name="cvv"]', '123');
    
    // 주문 완료
    await page.click('button:has-text("주문 완료")');
    
    // 성공 메시지 확인
    await expect(page.locator('text=주문이 완료되었습니다')).toBeVisible();
  });

  test('파트너 매칭 플로우', async ({ page }) => {
    await page.goto('/partners');
    
    // 파트너 검색
    await page.fill('input[placeholder="파트너 검색..."]', '스튜디오');
    await page.selectOption('select', 'STUDIO');
    await page.click('button:has-text("검색")');
    
    // 파트너 선택
    const partnerCard = page.locator('[data-testid="partner-card"]').first();
    await partnerCard.click();
    
    // 파트너 상세 페이지에서 매칭 요청
    await page.click('button:has-text("매칭 요청")');
    
    // 매칭 요청 폼 작성
    await page.fill('textarea[name="message"]', '프로젝트에 관심이 있습니다.');
    await page.click('button:has-text("요청 보내기")');
    
    // 성공 메시지 확인
    await expect(page.locator('text=매칭 요청이 전송되었습니다')).toBeVisible();
  });

  test('커뮤니티 게시글 작성', async ({ page }) => {
    await page.goto('/community');
    
    // 새 게시글 작성
    await page.click('button:has-text("글쓰기")');
    
    // 게시글 작성 폼
    await page.fill('input[name="title"]', '테스트 게시글');
    await page.fill('textarea[name="content"]', '테스트 게시글 내용입니다.');
    await page.selectOption('select[name="category"]', 'GENERAL');
    
    // 게시글 발행
    await page.click('button:has-text("발행")');
    
    // 성공 메시지 확인
    await expect(page.locator('text=게시글이 작성되었습니다')).toBeVisible();
    
    // 게시글 목록에서 확인
    await page.goto('/community');
    await expect(page.locator('text=테스트 게시글')).toBeVisible();
  });

  test('알림 확인', async ({ page }) => {
    await page.goto('/notifications');
    
    // 알림 목록 확인
    const notificationCards = page.locator('[data-testid="notification-card"]');
    await expect(notificationCards).toHaveCount.greaterThan(0);
    
    // 알림 읽음 처리
    const firstNotification = notificationCards.first();
    await firstNotification.locator('button:has-text("읽음 처리")').click();
    
    // 상태 변경 확인
    await expect(page.locator('text=읽음 처리 완료')).toBeVisible();
    
    // 전체 읽음 처리
    await page.click('button:has-text("모두 읽음 처리")');
    await expect(page.locator('text=전체 읽음 처리 완료')).toBeVisible();
  });

  test('주문 관리', async ({ page }) => {
    await page.goto('/orders');
    
    // 주문 목록 확인
    const orderCards = page.locator('[data-testid="order-card"]');
    await expect(orderCards).toHaveCount.greaterThan(0);
    
    // 주문 상세 확인
    const firstOrder = orderCards.first();
    await firstOrder.click();
    
    // 주문 상세 페이지에서 상태 확인
    await expect(page.locator('[data-testid="order-status"]')).toBeVisible();
    await expect(page.locator('[data-testid="order-items"]')).toBeVisible();
    await expect(page.locator('[data-testid="shipping-info"]')).toBeVisible();
  });
});
