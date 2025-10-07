import { test, expect } from '@playwright/test';

test.describe('Settlement Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin with settlement permissions
    await page.goto('/auth/signin');
    await page.fill('[data-testid="email-input"]', 'admin_root@example.com');
    await page.fill('[data-testid="password-input"]', 'admin123');
    await page.click('[data-testid="login-button"]');
    
    // MFA step
    await page.fill('[data-testid="mfa-code-input"]', '123456');
    await page.click('[data-testid="mfa-verify-button"]');
    
    await expect(page).toHaveURL('/admin');
  });

  test('E2E-SET-01: Settling → Executing approval', async ({ page }) => {
    // Given successful project, evidence/distribution table complete
    await page.goto('/admin/settlements');
    await expect(page.locator('[data-testid="settlements-list"]')).toBeVisible();
    
    // Find settlement in Settling status
    await page.click('[data-testid="settlement-1-row"]');
    await page.click('[data-testid="settlement-details-button"]');
    
    // Review settlement details
    await expect(page.locator('[data-testid="settlement-details-modal"]')).toBeVisible();
    await expect(page.locator('[data-testid="settlement-status"]')).toContainText('Settling');
    
    // Verify evidence files are complete
    await expect(page.locator('[data-testid="evidence-files"]')).toBeVisible();
    await page.click('[data-testid="view-invoice-1"]');
    await expect(page.locator('[data-testid="invoice-viewer"]')).toBeVisible();
    await page.click('[data-testid="close-viewer"]');
    
    // Verify distribution table is complete
    await expect(page.locator('[data-testid="distribution-table"]')).toBeVisible();
    await expect(page.locator('[data-testid="artist-share"]')).toContainText('60%');
    await expect(page.locator('[data-testid="collaborator-share"]')).toContainText('20%');
    await expect(page.locator('[data-testid="platform-share"]')).toContainText('10%');
    await expect(page.locator('[data-testid="reserve-share"]')).toContainText('10%');
    
    // Verify total distribution is 100%
    await expect(page.locator('[data-testid="distribution-total"]')).toContainText('100%');
    
    // When admin clicks "Settlement Approval"
    await page.click('[data-testid="approve-settlement-button"]');
    await page.fill('[data-testid="approval-notes"]', 'All documentation verified and approved');
    await page.click('[data-testid="confirm-approval"]');
    
    // Then status Executing, 1st installment payment created
    await expect(page.locator('[data-testid="approval-success"]')).toBeVisible();
    
    // Verify status changed to Executing
    await page.goto('/admin/settlements');
    await expect(page.locator('[data-testid="settlement-1-status"]')).toContainText('Executing');
    
    // Verify 1st installment payment created
    await page.click('[data-testid="settlement-1-row"]');
    await page.click('[data-testid="view-payments-button"]');
    await expect(page.locator('[data-testid="payment-1"]')).toBeVisible();
    await expect(page.locator('[data-testid="payment-1-status"]')).toContainText('IN_PROGRESS');
  });

  test('E2E-SET-02: Payment failure → retry → Hold', async ({ page }) => {
    // Given settlement in Executing status with payment created
    await page.goto('/admin/settlements');
    await page.click('[data-testid="settlement-1-row"]');
    await page.click('[data-testid="view-payments-button"]');
    
    // When 1st payment API error 3 times
    await page.click('[data-testid="execute-payment-1"]');
    
    // Simulate payment failure
    await page.evaluate(() => {
      window.localStorage.setItem('simulate_payment_failure', 'true');
    });
    
    // First failure
    await expect(page.locator('[data-testid="payment-failed"]')).toBeVisible();
    await expect(page.locator('[data-testid="retry-payment-button"]')).toBeVisible();
    
    // Retry payment
    await page.click('[data-testid="retry-payment-button"]');
    await expect(page.locator('[data-testid="payment-failed"]')).toBeVisible();
    
    // Second retry
    await page.click('[data-testid="retry-payment-button"]');
    await expect(page.locator('[data-testid="payment-failed"]')).toBeVisible();
    
    // Third retry
    await page.click('[data-testid="retry-payment-button"]');
    
    // Then FAILED → auto retry → Hold transition + notification
    await expect(page.locator('[data-testid="payment-failed-final"]')).toBeVisible();
    await expect(page.locator('[data-testid="hold-transition"]')).toBeVisible();
    
    // Verify settlement moved to Hold status
    await page.goto('/admin/settlements');
    await expect(page.locator('[data-testid="settlement-1-status"]')).toContainText('Hold');
    
    // Verify notification sent
    const notifications = await page.evaluate(() => 
      window.localStorage.getItem('admin_notifications')
    );
    expect(notifications).toContain('settlement_hold');
  });

  test('E2E-SET-03: Reconciliation (diff) resolution', async ({ page }) => {
    // Given PG file and internal ledger difference occurs
    await page.goto('/admin/settlements');
    await page.click('[data-testid="settlement-1-row"]');
    await page.click('[data-testid="reconciliation-tab"]');
    
    // View reconciliation report
    await expect(page.locator('[data-testid="reconciliation-report"]')).toBeVisible();
    
    // Check for differences
    await expect(page.locator('[data-testid="diff-summary"]')).toBeVisible();
    await expect(page.locator('[data-testid="diff-amount"]')).toContainText('₩50,000');
    await expect(page.locator('[data-testid="diff-reason"]')).toContainText('Processing fee discrepancy');
    
    // View diff items
    await page.click('[data-testid="view-diff-items"]');
    await expect(page.locator('[data-testid="diff-item-1"]')).toBeVisible();
    await expect(page.locator('[data-testid="internal-amount"]')).toContainText('₩1,000,000');
    await expect(page.locator('[data-testid="pg-amount"]')).toContainText('₩950,000');
    await expect(page.locator('[data-testid="delta-amount"]')).toContainText('₩50,000');
    
    // When admin enters adjustment → save
    await page.click('[data-testid="resolve-diff-item-1"]');
    await page.fill('[data-testid="adjustment-amount"]', '50000');
    await page.fill('[data-testid="adjustment-reason"]', 'Processing fee adjustment');
    await page.click('[data-testid="save-adjustment"]');
    
    // Then diff resolved, audit log recorded, report regenerated
    await expect(page.locator('[data-testid="adjustment-saved"]')).toBeVisible();
    
    // Verify diff is resolved
    await page.click('[data-testid="refresh-reconciliation"]');
    await expect(page.locator('[data-testid="diff-resolved"]')).toBeVisible();
    
    // Verify audit log recorded
    await page.click('[data-testid="audit-log-tab"]');
    await expect(page.locator('[data-testid="audit-entry-1"]')).toContainText('Adjustment made');
    await expect(page.locator('[data-testid="audit-amount"]')).toContainText('₩50,000');
    
    // Verify report regenerated
    await page.click('[data-testid="regenerate-report"]');
    await expect(page.locator('[data-testid="report-regenerated"]')).toBeVisible();
  });

  test('E2E-SET-04: Settlement calculation verification', async ({ page }) => {
    // Test settlement calculation accuracy
    await page.goto('/admin/settlements');
    await page.click('[data-testid="settlement-1-row"]');
    await page.click('[data-testid="settlement-details-button"]');
    
    // Verify calculation breakdown
    await expect(page.locator('[data-testid="total-raised"]')).toContainText('₩1,000,000');
    await expect(page.locator('[data-testid="payment-fees"]')).toContainText('₩30,000');
    await expect(page.locator('[data-testid="platform-fees"]')).toContainText('₩50,000');
    await expect(page.locator('[data-testid="taxes"]')).toContainText('₩20,000');
    await expect(page.locator('[data-testid="reserve"]')).toContainText('₩100,000');
    
    // Verify net payable calculation
    const netPayable = await page.locator('[data-testid="net-payable"]').textContent();
    expect(netPayable).toContain('₩800,000'); // 1,000,000 - 200,000
    
    // Verify distribution calculation
    await expect(page.locator('[data-testid="artist-amount"]')).toContainText('₩480,000'); // 800,000 * 60%
    await expect(page.locator('[data-testid="collaborator-amount"]')).toContainText('₩160,000'); // 800,000 * 20%
    await expect(page.locator('[data-testid="platform-amount"]')).toContainText('₩80,000'); // 800,000 * 10%
    await expect(page.locator('[data-testid="reserve-amount"]')).toContainText('₩80,000'); // 800,000 * 10%
  });

  test('E2E-SET-05: Multi-currency settlement handling', async ({ page }) => {
    // Test foreign currency settlement
    await page.goto('/admin/settlements');
    await page.click('[data-testid="settlement-2-row"]'); // Foreign currency settlement
    await page.click('[data-testid="settlement-details-button"]');
    
    // Verify currency conversion
    await expect(page.locator('[data-testid="original-currency"]')).toContainText('USD');
    await expect(page.locator('[data-testid="original-amount"]')).toContainText('$1,000');
    await expect(page.locator('[data-testid="exchange-rate"]')).toContainText('1,300');
    await expect(page.locator('[data-testid="converted-amount"]')).toContainText('₩1,300,000');
    
    // Verify conversion timestamp
    await expect(page.locator('[data-testid="conversion-timestamp"]')).toBeVisible();
  });

  test('E2E-SET-06: Dispute handling and resolution', async ({ page }) => {
    // Test dispute creation
    await page.goto('/admin/settlements');
    await page.click('[data-testid="settlement-1-row"]');
    await page.click('[data-testid="create-dispute-button"]');
    
    // Fill dispute details
    await page.fill('[data-testid="dispute-reason"]', 'Copyright issue');
    await page.fill('[data-testid="dispute-details"]', 'Artist claims copyright infringement');
    await page.setInputFiles('[data-testid="dispute-evidence"]', 'test-files/copyright-claim.pdf');
    await page.click('[data-testid="submit-dispute"]');
    
    // Verify dispute created
    await expect(page.locator('[data-testid="dispute-created"]')).toBeVisible();
    
    // Verify settlement moved to Hold
    await page.goto('/admin/settlements');
    await expect(page.locator('[data-testid="settlement-1-status"]')).toContainText('Hold');
    
    // Resolve dispute
    await page.click('[data-testid="settlement-1-row"]');
    await page.click('[data-testid="resolve-dispute-button"]');
    await page.selectOption('[data-testid="dispute-resolution"]', 'resolved');
    await page.fill('[data-testid="resolution-notes"]', 'Copyright issue resolved');
    await page.click('[data-testid="confirm-resolution"]');
    
    // Verify settlement resumed
    await expect(page.locator('[data-testid="dispute-resolved"]')).toBeVisible();
    await page.goto('/admin/settlements');
    await expect(page.locator('[data-testid="settlement-1-status"]')).toContainText('Executing');
  });

  test('E2E-SET-07: Settlement report generation', async ({ page }) => {
    // Generate settlement report
    await page.goto('/admin/settlements');
    await page.click('[data-testid="settlement-1-row"]');
    await page.click('[data-testid="generate-report-button"]');
    
    // Verify report generation
    await expect(page.locator('[data-testid="report-generating"]')).toBeVisible();
    await expect(page.locator('[data-testid="report-generated"]')).toBeVisible();
    
    // Download report
    await page.click('[data-testid="download-report-button"]');
    await expect(page.locator('[data-testid="download-success"]')).toBeVisible();
    
    // Verify report content
    await page.click('[data-testid="preview-report-button"]');
    await expect(page.locator('[data-testid="report-preview"]')).toBeVisible();
    await expect(page.locator('[data-testid="report-total"]')).toContainText('₩1,000,000');
    await expect(page.locator('[data-testid="report-distribution"]')).toBeVisible();
    await expect(page.locator('[data-testid="report-timestamp"]')).toBeVisible();
  });

  test('E2E-SET-08: KYC verification and account validation', async ({ page }) => {
    // Test KYC verification
    await page.goto('/admin/settlements');
    await page.click('[data-testid="settlement-1-row"]');
    await page.click('[data-testid="kyc-tab"]');
    
    // Verify KYC status
    await expect(page.locator('[data-testid="kyc-status"]')).toContainText('Verified');
    await expect(page.locator('[data-testid="kyc-documents"]')).toBeVisible();
    
    // Test account validation
    await page.click('[data-testid="validate-account-button"]');
    await expect(page.locator('[data-testid="account-validation"]')).toBeVisible();
    await expect(page.locator('[data-testid="account-status"]')).toContainText('Valid');
    
    // Test KYC failure scenario
    await page.goto('/admin/settlements');
    await page.click('[data-testid="settlement-3-row"]'); // Settlement with KYC issues
    await page.click('[data-testid="kyc-tab"]');
    
    await expect(page.locator('[data-testid="kyc-status"]')).toContainText('Failed');
    await expect(page.locator('[data-testid="kyc-error"]')).toContainText('Invalid document');
    
    // Verify settlement moved to Hold
    await expect(page.locator('[data-testid="settlement-status"]')).toContainText('Hold');
  });
});
