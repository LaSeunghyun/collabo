import { test, expect } from '@playwright/test';

test.describe('Admin Flow', () => {
  test.beforeEach(async ({ page }) => {
    // 관리자 로그인
    await page.goto('/auth/signin');
    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
  });

  test('관리자 대시보드 접근', async ({ page }) => {
    await page.goto('/admin');
    
    // 헤더 확인
    await expect(page.locator('h1')).toContainText('관리자 대시보드');
    
    // 주요 지표 카드 확인
    await expect(page.locator('[data-testid="total-visitors"]')).toBeVisible();
    await expect(page.locator('[data-testid="new-users"]')).toBeVisible();
    await expect(page.locator('[data-testid="active-projects"]')).toBeVisible();
    await expect(page.locator('[data-testid="total-revenue"]')).toBeVisible();
    
    // 섹션들 확인
    await expect(page.locator('[data-testid="analytics-section"]')).toBeVisible();
    await expect(page.locator('[data-testid="project-review-section"]')).toBeVisible();
    await expect(page.locator('[data-testid="partner-approval-section"]')).toBeVisible();
    await expect(page.locator('[data-testid="moderation-report-section"]')).toBeVisible();
    await expect(page.locator('[data-testid="settlement-queue-section"]')).toBeVisible();
  });

  test('프로젝트 검수 페이지', async ({ page }) => {
    await page.goto('/admin/projects');
    
    // 페이지 헤더 확인
    await expect(page.locator('h1')).toContainText('프로젝트 검수');
    
    // 필터 기능 테스트
    await page.fill('input[placeholder="프로젝트 검색..."]', '테스트');
    await page.selectOption('select', 'DRAFT');
    
    // 프로젝트 목록 확인
    const projectCards = page.locator('[data-testid="project-card"]');
    await expect(projectCards).toHaveCount.greaterThan(0);
    
    // 프로젝트 승인 테스트
    const firstProject = projectCards.first();
    await firstProject.locator('button:has-text("승인")').click();
    await expect(page.locator('text=상태 변경 완료')).toBeVisible();
  });

  test('파트너 승인 페이지', async ({ page }) => {
    await page.goto('/admin/partners');
    
    // 페이지 헤더 확인
    await expect(page.locator('h1')).toContainText('파트너 승인');
    
    // 파트너 목록 확인
    const partnerCards = page.locator('[data-testid="partner-card"]');
    await expect(partnerCards).toHaveCount.greaterThan(0);
    
    // 파트너 승인 테스트
    const firstPartner = partnerCards.first();
    await firstPartner.locator('button:has-text("승인")').click();
    await expect(page.locator('text=상태 변경 완료')).toBeVisible();
  });

  test('신고 관리 페이지', async ({ page }) => {
    await page.goto('/admin/reports');
    
    // 페이지 헤더 확인
    await expect(page.locator('h1')).toContainText('신고 관리');
    
    // 신고 통계 확인
    await expect(page.locator('[data-testid="total-reports"]')).toBeVisible();
    await expect(page.locator('[data-testid="pending-reports"]')).toBeVisible();
    await expect(page.locator('[data-testid="completed-reports"]')).toBeVisible();
    
    // 신고 목록 확인
    const reportCards = page.locator('[data-testid="report-card"]');
    await expect(reportCards).toHaveCount.greaterThan(0);
    
    // 신고 처리 테스트
    const firstReport = reportCards.first();
    await firstReport.locator('button:has-text("조치완료")').click();
    await expect(page.locator('text=상태 변경 완료')).toBeVisible();
  });

  test('정산 관리 페이지', async ({ page }) => {
    await page.goto('/admin/settlements');
    
    // 페이지 헤더 확인
    await expect(page.locator('h1')).toContainText('정산 관리');
    
    // 정산 목록 확인
    const settlementCards = page.locator('[data-testid="settlement-card"]');
    await expect(settlementCards).toHaveCount.greaterThan(0);
    
    // 정산 상태 변경 테스트
    const firstSettlement = settlementCards.first();
    await firstSettlement.locator('button:has-text("완료")').click();
    await expect(page.locator('text=상태 변경 완료')).toBeVisible();
  });

  test('공지 관리 페이지', async ({ page }) => {
    await page.goto('/admin/announcements');
    
    // 페이지 헤더 확인
    await expect(page.locator('h1')).toContainText('공지 관리');
    
    // 새 공지 작성 버튼 확인
    await expect(page.locator('button:has-text("새 공지 작성")')).toBeVisible();
    
    // 공지 목록 확인
    const announcementCards = page.locator('[data-testid="announcement-card"]');
    await expect(announcementCards).toHaveCount.greaterThan(0);
    
    // 공지 고정 테스트
    const firstAnnouncement = announcementCards.first();
    await firstAnnouncement.locator('button:has-text("고정")').click();
    await expect(page.locator('text=상태 변경 완료')).toBeVisible();
  });

  test('이행 관리 페이지', async ({ page }) => {
    await page.goto('/admin/fulfillment');
    
    // 페이지 헤더 확인
    await expect(page.locator('h1')).toContainText('리워드 이행 관리');
    
    // 배송 현황 섹션 확인
    await expect(page.locator('h2:has-text("배송 현황")')).toBeVisible();
    
    // 티켓 현황 섹션 확인
    await expect(page.locator('h2:has-text("티켓 현황")')).toBeVisible();
    
    // 이행 상태 변경 테스트
    const shipmentCards = page.locator('[data-testid="shipment-card"]');
    if (await shipmentCards.count() > 0) {
      const firstShipment = shipmentCards.first();
      await firstShipment.locator('button:has-text("배송시작")').click();
      await expect(page.locator('text=상태 변경 완료')).toBeVisible();
    }
  });

  test('권한 없는 사용자 접근 차단', async ({ page }) => {
    // 일반 사용자로 로그인
    await page.goto('/auth/signin');
    await page.fill('input[name="email"]', 'user@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
    
    // 관리자 페이지 접근 시도
    await page.goto('/admin');
    
    // 접근 차단 확인
    await expect(page.locator('text=접근 권한이 없습니다')).toBeVisible();
  });
});
