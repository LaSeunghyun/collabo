import { test, expect } from '@playwright/test';

test.describe('Admin Management Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin_root before each test
    await page.goto('/auth/signin');
    await page.fill('[data-testid="email-input"]', 'admin_root@example.com');
    await page.fill('[data-testid="password-input"]', 'admin123');
    await page.click('[data-testid="login-button"]');
    
    // MFA step
    await page.fill('[data-testid="mfa-code-input"]', '123456');
    await page.click('[data-testid="mfa-verify-button"]');
    
    await expect(page).toHaveURL('/admin');
  });

  test('TC-ADMIN-01: Dashboard overview', async ({ page }) => {
    // Given /admin access (ADMIN+MFA)
    await page.goto('/admin');
    
    // When dashboard entry
    await expect(page.locator('[data-testid="admin-dashboard"]')).toBeVisible();
    
    // Then Analytics/Project Review/Partner Approval/Moderation/Settlement widgets render with latest data
    await expect(page.locator('[data-testid="analytics-widget"]')).toBeVisible();
    await expect(page.locator('[data-testid="project-review-widget"]')).toBeVisible();
    await expect(page.locator('[data-testid="partner-approval-widget"]')).toBeVisible();
    await expect(page.locator('[data-testid="moderation-widget"]')).toBeVisible();
    await expect(page.locator('[data-testid="settlement-widget"]')).toBeVisible();
    
    // Verify latest data is loaded
    await expect(page.locator('[data-testid="pending-projects-count"]')).toContainText(/\d+/);
    await expect(page.locator('[data-testid="pending-partners-count"]')).toContainText(/\d+/);
    await expect(page.locator('[data-testid="pending-reports-count"]')).toContainText(/\d+/);
  });

  test('TC-ADMIN-02: Project review approval/rejection', async ({ page }) => {
    // When approval pending list → project selection → "Approve" or "Reject"
    await page.goto('/admin/projects');
    await expect(page.locator('[data-testid="pending-projects-list"]')).toBeVisible();
    
    // Select first pending project
    await page.click('[data-testid="project-1-row"]');
    await page.click('[data-testid="project-details-button"]');
    
    // Review project details
    await expect(page.locator('[data-testid="project-details-modal"]')).toBeVisible();
    await expect(page.locator('[data-testid="project-title"]')).toBeVisible();
    await expect(page.locator('[data-testid="project-description"]')).toBeVisible();
    await expect(page.locator('[data-testid="project-budget"]')).toBeVisible();
    
    // Approve project
    await page.click('[data-testid="approve-project-button"]');
    await page.fill('[data-testid="approval-notes"]', 'Project meets all requirements');
    await page.click('[data-testid="confirm-approval"]');
    
    // Then status transition, artist notification, public/private transition rules applied
    await expect(page.locator('[data-testid="approval-success"]')).toBeVisible();
    
    // Verify project status changed
    await page.goto('/admin/projects');
    await expect(page.locator('[data-testid="project-1-status"]')).toContainText('Approved');
    
    // Verify artist notification sent
    const notifications = await page.evaluate(() => 
      window.localStorage.getItem('artist_notifications')
    );
    expect(notifications).toContain('project_approved');
  });

  test('TC-ADMIN-03: Partner approval', async ({ page }) => {
    // When partner pending list → profile review → approval
    await page.goto('/admin/partners');
    await expect(page.locator('[data-testid="pending-partners-list"]')).toBeVisible();
    
    // Select first pending partner
    await page.click('[data-testid="partner-1-row"]');
    await page.click('[data-testid="partner-details-button"]');
    
    // Review partner profile
    await expect(page.locator('[data-testid="partner-details-modal"]')).toBeVisible();
    await expect(page.locator('[data-testid="partner-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="partner-type"]')).toBeVisible();
    await expect(page.locator('[data-testid="partner-facilities"]')).toBeVisible();
    await expect(page.locator('[data-testid="partner-rates"]')).toBeVisible();
    await expect(page.locator('[data-testid="partner-availability"]')).toBeVisible();
    
    // Approve partner
    await page.click('[data-testid="approve-partner-button"]');
    await page.fill('[data-testid="approval-notes"]', 'Partner profile verified and approved');
    await page.click('[data-testid="confirm-approval"]');
    
    // Then matching search exposure starts, approval log/responsible person recorded
    await expect(page.locator('[data-testid="approval-success"]')).toBeVisible();
    
    // Verify partner status changed
    await page.goto('/admin/partners');
    await expect(page.locator('[data-testid="partner-1-status"]')).toContainText('Approved');
    
    // Verify partner is now searchable
    await page.goto('/partners');
    await expect(page.locator('[data-testid="partner-1-card"]')).toBeVisible();
  });

  test('TC-ADMIN-04: Report detailed review/action', async ({ page }) => {
    // When report list → detail modal open → "Blind process" or "Dismiss" + processing memo save
    await page.goto('/admin/moderation');
    await expect(page.locator('[data-testid="reports-list"]')).toBeVisible();
    
    // Select first report
    await page.click('[data-testid="report-1-row"]');
    await page.click('[data-testid="report-details-button"]');
    
    // Review report details
    await expect(page.locator('[data-testid="report-details-modal"]')).toBeVisible();
    await expect(page.locator('[data-testid="reported-content"]')).toBeVisible();
    await expect(page.locator('[data-testid="report-reason"]')).toBeVisible();
    await expect(page.locator('[data-testid="reporter-info"]')).toBeVisible();
    
    // Process report - blind the content
    await page.click('[data-testid="blind-content-button"]');
    await page.fill('[data-testid="processing-memo"]', 'Content violates community guidelines');
    await page.click('[data-testid="confirm-action"]');
    
    // Then /api/admin/moderation PATCH success, post status reflection (HIDDEN/ACTIVE), reporter result notification
    await expect(page.locator('[data-testid="action-success"]')).toBeVisible();
    
    // Verify content is hidden
    await page.goto('/projects/1/community');
    await expect(page.locator('[data-testid="hidden-content-notice"]')).toBeVisible();
    
    // Verify reporter notification sent
    const notifications = await page.evaluate(() => 
      window.localStorage.getItem('reporter_notifications')
    );
    expect(notifications).toContain('report_processed');
  });

  test('TC-ADMIN-05: Settlement queue monitoring/payment confirmation', async ({ page }) => {
    // Given successful project in Settling status
    await page.goto('/admin/settlements');
    await expect(page.locator('[data-testid="settlements-list"]')).toBeVisible();
    
    // When settlement item review (evidence files/distribution table) → payment approval
    await page.click('[data-testid="settlement-1-row"]');
    await page.click('[data-testid="settlement-details-button"]');
    
    // Review settlement details
    await expect(page.locator('[data-testid="settlement-details-modal"]')).toBeVisible();
    await expect(page.locator('[data-testid="total-raised"]')).toBeVisible();
    await expect(page.locator('[data-testid="fees-breakdown"]')).toBeVisible();
    await expect(page.locator('[data-testid="distribution-table"]')).toBeVisible();
    await expect(page.locator('[data-testid="evidence-files"]')).toBeVisible();
    
    // Verify evidence files
    await page.click('[data-testid="view-invoice-1"]');
    await expect(page.locator('[data-testid="invoice-viewer"]')).toBeVisible();
    
    // Approve settlement
    await page.click('[data-testid="approve-settlement-button"]');
    await page.fill('[data-testid="approval-notes"]', 'All documentation verified');
    await page.click('[data-testid="confirm-approval"]');
    
    // Then payment status IN_PROGRESS→PAID, Settlement report (PDF) generation/timestamp, artist notification
    await expect(page.locator('[data-testid="approval-success"]')).toBeVisible();
    
    // Verify settlement status changed
    await page.goto('/admin/settlements');
    await expect(page.locator('[data-testid="settlement-1-status"]')).toContainText('Paid');
    
    // Verify PDF report generated
    await page.click('[data-testid="download-report-button"]');
    await expect(page.locator('[data-testid="report-download-success"]')).toBeVisible();
    
    // Verify artist notification sent
    const notifications = await page.evaluate(() => 
      window.localStorage.getItem('artist_notifications')
    );
    expect(notifications).toContain('settlement_approved');
  });

  test('TC-ADMIN-06: Announcement creation/pin/scheduled publishing', async ({ page }) => {
    // When /admin/announcements → announcement creation → immediate/scheduled publishing → pin toggle
    await page.goto('/admin/announcements');
    await expect(page.locator('[data-testid="announcements-list"]')).toBeVisible();
    
    // Create new announcement
    await page.click('[data-testid="create-announcement-button"]');
    await page.fill('[data-testid="announcement-title"]', 'Platform Maintenance Notice');
    await page.fill('[data-testid="announcement-content"]', 'We will be performing scheduled maintenance on December 25th from 2-4 AM KST.');
    await page.selectOption('[data-testid="announcement-type"]', 'maintenance');
    await page.selectOption('[data-testid="publish-type"]', 'immediate');
    await page.check('[data-testid="pin-announcement"]');
    await page.click('[data-testid="publish-announcement-button"]');
    
    // Then user feed exposure, scheduled time arrival auto post, pin sort priority
    await expect(page.locator('[data-testid="announcement-success"]')).toBeVisible();
    
    // Verify announcement appears in user feed
    await page.goto('/');
    await expect(page.locator('[data-testid="pinned-announcement"]')).toBeVisible();
    await expect(page.locator('[data-testid="announcement-title"]')).toContainText('Platform Maintenance Notice');
    
    // Test scheduled publishing
    await page.goto('/admin/announcements');
    await page.click('[data-testid="create-announcement-button"]');
    await page.fill('[data-testid="announcement-title"]', 'Scheduled Announcement');
    await page.fill('[data-testid="announcement-content"]', 'This will be published later.');
    await page.selectOption('[data-testid="publish-type"]', 'scheduled');
    await page.fill('[data-testid="publish-date"]', '2024-12-31');
    await page.fill('[data-testid="publish-time"]', '12:00');
    await page.click('[data-testid="schedule-announcement-button"]');
    
    // Verify scheduled announcement is in pending state
    await expect(page.locator('[data-testid="scheduled-announcement"]')).toBeVisible();
    await expect(page.locator('[data-testid="announcement-status"]')).toContainText('Scheduled');
    
    // Test pin toggle
    await page.click('[data-testid="toggle-pin-1"]');
    await expect(page.locator('[data-testid="pin-status-1"]')).toContainText('Unpinned');
  });
});
