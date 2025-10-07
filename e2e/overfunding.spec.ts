import { test, expect } from '@playwright/test';

test.describe('Overfunding Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin with overfunding management permissions
    await page.goto('/auth/signin');
    await page.fill('[data-testid="email-input"]', 'admin_root@example.com');
    await page.fill('[data-testid="password-input"]', 'admin123');
    await page.click('[data-testid="login-button"]');
    
    // MFA step
    await page.fill('[data-testid="mfa-code-input"]', '123456');
    await page.click('[data-testid="mfa-verify-button"]');
    
    await expect(page).toHaveURL('/admin');
  });

  test('E2E-OVER-01: 150% achievement → stretch goal mandatory', async ({ page }) => {
    // Given project funding amount exceeds 150% of goal
    await page.goto('/admin/funding-policy');
    await expect(page.locator('[data-testid="overfunding-dashboard"]')).toBeVisible();
    
    // Configure 150% threshold
    await page.click('[data-testid="thresholds-tab"]');
    await page.click('[data-testid="edit-threshold-150"]');
    await page.check('[data-testid="require-stretch-goal"]');
    await page.check('[data-testid="payment-restriction"]');
    await page.selectOption('[data-testid="banner-template"]', 'stretch-goal-required');
    await page.click('[data-testid="save-threshold"]');
    
    // Simulate project reaching 150%
    await page.evaluate(() => {
      window.localStorage.setItem('simulate_150_percent', 'true');
    });
    
    // When payment flow entry
    await page.goto('/projects/1');
    await page.click('[data-testid="reward-ticket-tier"]');
    await page.click('[data-testid="select-reward-button"]');
    
    // Then stretch goal not registered → "New Order" button disabled + guidance banner shown
    await expect(page.locator('[data-testid="stretch-goal-banner"]')).toBeVisible();
    await expect(page.locator('[data-testid="stretch-goal-message"]')).toContainText('Stretch goal required');
    await expect(page.locator('[data-testid="new-order-button"]')).toBeDisabled();
    await expect(page.locator('[data-testid="payment-form"]')).not.toBeVisible();
    
    // Verify banner template is applied
    await expect(page.locator('[data-testid="banner-template"]')).toHaveClass(/stretch-goal-required/);
  });

  test('E2E-OVER-02: Exception approval', async ({ page }) => {
    // Given specific project exception approval (payment restriction lift, 7 days)
    await page.goto('/admin/funding-policy');
    await page.click('[data-testid="exceptions-tab"]');
    await page.click('[data-testid="create-exception-button"]');
    
    // Create exception for project
    await page.selectOption('[data-testid="project-select"]', 'project-1');
    await page.selectOption('[data-testid="exemption-type"]', 'payment_restriction');
    await page.fill('[data-testid="expires-at"]', '2024-12-31');
    await page.fill('[data-testid="exception-reason"]', 'Special circumstances approved');
    await page.click('[data-testid="create-exception-submit"]');
    
    // Verify exception created
    await expect(page.locator('[data-testid="exception-created"]')).toBeVisible();
    
    // Simulate project reaching 150% with exception
    await page.evaluate(() => {
      window.localStorage.setItem('simulate_150_percent_with_exception', 'true');
    });
    
    // When 150% threshold entry
    await page.goto('/projects/1');
    await page.click('[data-testid="reward-ticket-tier"]');
    await page.click('[data-testid="select-reward-button"]');
    
    // Then restriction not applied, banner only shown
    await expect(page.locator('[data-testid="stretch-goal-banner"]')).toBeVisible();
    await expect(page.locator('[data-testid="new-order-button"]')).toBeEnabled();
    await expect(page.locator('[data-testid="payment-form"]')).toBeVisible();
    
    // Verify exception is active
    await expect(page.locator('[data-testid="exception-active"]')).toBeVisible();
    await expect(page.locator('[data-testid="exception-expires"]')).toContainText('2024-12-31');
  });

  test('E2E-OVER-03: Stretch goal registration and approval', async ({ page }) => {
    // Test stretch goal registration process
    await page.goto('/projects/1');
    
    // Artist registers stretch goal
    await page.goto('/auth/signin');
    await page.fill('[data-testid="email-input"]', 'artist_ko@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');
    
    await page.goto('/artist/dashboard');
    await page.click('[data-testid="project-management-tab"]');
    await page.click('[data-testid="project-1-edit"]');
    await page.click('[data-testid="stretch-goals-tab"]');
    
    // Create stretch goal
    await page.click('[data-testid="create-stretch-goal-button"]');
    await page.fill('[data-testid="stretch-title"]', 'Enhanced Album Package');
    await page.fill('[data-testid="stretch-description"]', 'If we reach 200%, we will include bonus tracks and enhanced packaging');
    await page.fill('[data-testid="stretch-budget"]', '₩500,000');
    await page.fill('[data-testid="stretch-timeline"]', '3 months');
    await page.click('[data-testid="submit-stretch-goal"]');
    
    // Verify stretch goal submitted for review
    await expect(page.locator('[data-testid="stretch-submitted"]')).toBeVisible();
    await expect(page.locator('[data-testid="stretch-status"]')).toContainText('Pending Review');
    
    // Admin reviews stretch goal
    await page.goto('/auth/signin');
    await page.fill('[data-testid="email-input"]', 'admin_root@example.com');
    await page.fill('[data-testid="password-input"]', 'admin123');
    await page.click('[data-testid="login-button"]');
    await page.fill('[data-testid="mfa-code-input"]', '123456');
    await page.click('[data-testid="mfa-verify-button"]');
    
    await page.goto('/admin/funding-policy');
    await page.click('[data-testid="stretch-goals-tab"]');
    await page.click('[data-testid="stretch-goal-1-row"]');
    
    // Review stretch goal
    await expect(page.locator('[data-testid="stretch-details"]')).toBeVisible();
    await expect(page.locator('[data-testid="stretch-title"]')).toContainText('Enhanced Album Package');
    await expect(page.locator('[data-testid="stretch-budget"]')).toContainText('₩500,000');
    
    // Approve stretch goal
    await page.click('[data-testid="approve-stretch-goal"]');
    await page.fill('[data-testid="approval-notes"]', 'Stretch goal approved');
    await page.click('[data-testid="confirm-approval"]');
    
    // Verify stretch goal approved
    await expect(page.locator('[data-testid="stretch-approved"]')).toBeVisible();
    
    // Verify project can now accept payments
    await page.goto('/projects/1');
    await page.click('[data-testid="reward-ticket-tier"]');
    await page.click('[data-testid="select-reward-button"]');
    await expect(page.locator('[data-testid="payment-form"]')).toBeVisible();
  });

  test('E2E-OVER-04: Threshold configuration and template management', async ({ page }) => {
    // Configure multiple thresholds
    await page.goto('/admin/funding-policy');
    await page.click('[data-testid="thresholds-tab"]');
    
    // Configure 100% threshold
    await page.click('[data-testid="edit-threshold-100"]');
    await page.selectOption('[data-testid="action-100"]', 'banner');
    await page.selectOption('[data-testid="banner-template-100"]', 'goal-achieved');
    await page.click('[data-testid="save-threshold"]');
    
    // Configure 200% threshold
    await page.click('[data-testid="edit-threshold-200"]');
    await page.selectOption('[data-testid="action-200"]', 'mandatory_announcement');
    await page.check('[data-testid="require-usage-clarification"]');
    await page.selectOption('[data-testid="banner-template-200"]', 'overfunding-warning');
    await page.click('[data-testid="save-threshold"]');
    
    // Create banner templates
    await page.click('[data-testid="templates-tab"]');
    await page.click('[data-testid="create-template-button"]');
    
    // Create goal achieved template
    await page.fill('[data-testid="template-name"]', 'Goal Achieved');
    await page.fill('[data-testid="template-subject"]', 'Congratulations! Goal Achieved');
    await page.fill('[data-testid="template-body"]', 'Thank you for reaching our goal of {goal_amount}!');
    await page.fill('[data-testid="template-banner"]', '<div class="success-banner">Goal Achieved!</div>');
    await page.click('[data-testid="create-template-submit"]');
    
    // Create overfunding warning template
    await page.click('[data-testid="create-template-button"]');
    await page.fill('[data-testid="template-name"]', 'Overfunding Warning');
    await page.fill('[data-testid="template-subject"]', 'Additional Usage Required');
    await page.fill('[data-testid="template-body"]', 'You have raised {current_amount} ({percent}% of goal). Please clarify additional usage.');
    await page.fill('[data-testid="template-banner"]', '<div class="warning-banner">Usage Clarification Required</div>');
    await page.click('[data-testid="create-template-submit"]');
    
    // Verify templates created
    await expect(page.locator('[data-testid="template-list"]')).toContainText('Goal Achieved');
    await expect(page.locator('[data-testid="template-list"]')).toContainText('Overfunding Warning');
  });

  test('E2E-OVER-05: Real-time threshold monitoring and alerts', async ({ page }) => {
    // Test real-time monitoring
    await page.goto('/admin/funding-policy');
    await page.click('[data-testid="monitoring-tab"]');
    
    // View current overfunding projects
    await expect(page.locator('[data-testid="overfunding-projects"]')).toBeVisible();
    await expect(page.locator('[data-testid="project-1-card"]')).toBeVisible();
    await expect(page.locator('[data-testid="funding-percentage"]')).toContainText('150%');
    
    // Test alert configuration
    await page.click('[data-testid="alerts-tab"]');
    await page.click('[data-testid="create-alert-button"]');
    
    // Create threshold alert
    await page.selectOption('[data-testid="alert-type"]', 'threshold_reached');
    await page.fill('[data-testid="alert-threshold"]', '150');
    await page.check('[data-testid="alert-email"]');
    await page.check('[data-testid="alert-slack"]');
    await page.fill('[data-testid="alert-recipients"]', 'admin@example.com');
    await page.click('[data-testid="create-alert-submit"]');
    
    // Verify alert created
    await expect(page.locator('[data-testid="alert-created"]')).toBeVisible();
    
    // Test alert triggering
    await page.evaluate(() => {
      window.localStorage.setItem('simulate_threshold_alert', 'true');
    });
    
    await page.click('[data-testid="test-alert-button"]');
    await expect(page.locator('[data-testid="alert-triggered"]')).toBeVisible();
  });

  test('E2E-OVER-06: Exception management and expiration', async ({ page }) => {
    // Test exception lifecycle
    await page.goto('/admin/funding-policy');
    await page.click('[data-testid="exceptions-tab"]');
    
    // Create temporary exception
    await page.click('[data-testid="create-exception-button"]');
    await page.selectOption('[data-testid="project-select"]', 'project-2');
    await page.selectOption('[data-testid="exemption-type"]', 'stretch_goal_requirement');
    await page.fill('[data-testid="expires-at"]', '2024-12-25');
    await page.fill('[data-testid="exception-reason"]', 'Holiday season exception');
    await page.click('[data-testid="create-exception-submit"]');
    
    // Verify exception created
    await expect(page.locator('[data-testid="exception-created"]')).toBeVisible();
    await expect(page.locator('[data-testid="exception-status"]')).toContainText('Active');
    
    // Test exception expiration
    await page.evaluate(() => {
      window.localStorage.setItem('simulate_exception_expired', 'true');
    });
    
    await page.click('[data-testid="refresh-exceptions"]');
    await expect(page.locator('[data-testid="exception-status"]')).toContainText('Expired');
    
    // Test exception renewal
    await page.click('[data-testid="renew-exception-button"]');
    await page.fill('[data-testid="new-expires-at"]', '2024-12-31');
    await page.fill('[data-testid="renewal-reason"]', 'Extended for additional review');
    await page.click('[data-testid="confirm-renewal"]');
    
    await expect(page.locator('[data-testid="exception-renewed"]')).toBeVisible();
    await expect(page.locator('[data-testid="exception-status"]')).toContainText('Active');
  });

  test('E2E-OVER-07: Reporting and analytics', async ({ page }) => {
    // Generate overfunding report
    await page.goto('/admin/funding-policy');
    await page.click('[data-testid="reports-tab"]');
    
    // Configure report parameters
    await page.selectOption('[data-testid="report-period"]', '30_days');
    await page.check('[data-testid="include-thresholds"]');
    await page.check('[data-testid="include-exceptions"]');
    await page.check('[data-testid="include-templates"]');
    
    // Generate report
    await page.click('[data-testid="generate-report-button"]');
    await expect(page.locator('[data-testid="report-generating"]')).toBeVisible();
    await expect(page.locator('[data-testid="report-generated"]')).toBeVisible();
    
    // Verify report content
    await expect(page.locator('[data-testid="report-summary"]')).toBeVisible();
    await expect(page.locator('[data-testid="threshold-breakdown"]')).toBeVisible();
    await expect(page.locator('[data-testid="exception-summary"]')).toBeVisible();
    await expect(page.locator('[data-testid="template-usage"]')).toBeVisible();
    
    // Export report
    await page.click('[data-testid="export-report-button"]');
    await expect(page.locator('[data-testid="export-success"]')).toBeVisible();
    
    // Test analytics dashboard
    await page.click('[data-testid="analytics-tab"]');
    await expect(page.locator('[data-testid="overfunding-chart"]')).toBeVisible();
    await expect(page.locator('[data-testid="threshold-distribution"]')).toBeVisible();
    await expect(page.locator('[data-testid="exception-trends"]')).toBeVisible();
  });

  test('E2E-OVER-08: Edge cases and error handling', async ({ page }) => {
    // Test small goal projects
    await page.goto('/admin/funding-policy');
    await page.click('[data-testid="thresholds-tab"]');
    
    // Configure custom threshold for small projects
    await page.click('[data-testid="create-custom-threshold"]');
    await page.fill('[data-testid="threshold-name"]', 'Small Project Threshold');
    await page.fill('[data-testid="min-goal-amount"]', '100000');
    await page.fill('[data-testid="threshold-percentage"]', '200');
    await page.selectOption('[data-testid="custom-action"]', 'banner');
    await page.click('[data-testid="create-custom-threshold-submit"]');
    
    // Test currency handling
    await page.click('[data-testid="currency-tab"]');
    await page.selectOption('[data-testid="base-currency"]', 'USD');
    await page.fill('[data-testid="exchange-rate"]', '1300');
    await page.click('[data-testid="save-currency-settings"]');
    
    // Test error handling
    await page.evaluate(() => {
      window.localStorage.setItem('simulate_api_error', 'true');
    });
    
    await page.goto('/projects/1');
    await page.click('[data-testid="reward-ticket-tier"]');
    await page.click('[data-testid="select-reward-button"]');
    
    // Verify error handling
    await expect(page.locator('[data-testid="api-error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
  });
});
