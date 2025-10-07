import { test, expect } from '@playwright/test';

test.describe('Content Safety Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin with content safety permissions
    await page.goto('/auth/signin');
    await page.fill('[data-testid="email-input"]', 'admin_root@example.com');
    await page.fill('[data-testid="password-input"]', 'admin123');
    await page.click('[data-testid="login-button"]');
    
    // MFA step
    await page.fill('[data-testid="mfa-code-input"]', '123456');
    await page.click('[data-testid="mfa-verify-button"]');
    
    await expect(page).toHaveURL('/admin');
  });

  test('E2E-SAFETY-01: Profanity dictionary addition → real-time blocking', async ({ page }) => {
    // Given /admin/safety access, add "fuck(High/block)"
    await page.goto('/admin/safety');
    await expect(page.locator('[data-testid="safety-dashboard"]')).toBeVisible();
    
    // Navigate to profanity dictionary
    await page.click('[data-testid="lexicon-tab"]');
    await page.click('[data-testid="add-word-button"]');
    
    // Add profanity word
    await page.fill('[data-testid="word-input"]', 'fuck');
    await page.selectOption('[data-testid="category-select"]', 'profanity');
    await page.selectOption('[data-testid="severity-select"]', 'High');
    await page.selectOption('[data-testid="action-select"]', 'block');
    await page.selectOption('[data-testid="language-select"]', 'en');
    await page.click('[data-testid="add-word-submit"]');
    
    // Verify word added to dictionary
    await expect(page.locator('[data-testid="word-added-success"]')).toBeVisible();
    await expect(page.locator('[data-testid="word-list"]')).toContainText('fuck');
    
    // When user post contains the word → submit
    await page.goto('/projects/1/community');
    await page.click('[data-testid="new-post-button"]');
    await page.fill('[data-testid="post-title"]', 'Test Post');
    await page.fill('[data-testid="post-content"]', 'This post contains the word fuck and should be blocked');
    await page.click('[data-testid="submit-post-button"]');
    
    // Then submission blocked + guidance message, quarantine queue not created
    await expect(page.locator('[data-testid="content-blocked"]')).toBeVisible();
    await expect(page.locator('[data-testid="block-reason"]')).toContainText('Profanity detected');
    await expect(page.locator('[data-testid="guidance-message"]')).toContainText('Please remove inappropriate language');
    
    // Verify post was not created
    await page.goto('/projects/1/community');
    await expect(page.locator('[data-testid="post-list"]')).not.toContainText('Test Post');
  });

  test('E2E-SAFETY-02: Med rule → quarantine/approval', async ({ page }) => {
    // Given "advertising content(Med/quarantine)" rule
    await page.goto('/admin/safety');
    await page.click('[data-testid="lexicon-tab"]');
    await page.click('[data-testid="add-word-button"]');
    
    // Add medium severity rule
    await page.fill('[data-testid="word-input"]', 'buy now');
    await page.selectOption('[data-testid="category-select"]', 'advertising');
    await page.selectOption('[data-testid="severity-select"]', 'Med');
    await page.selectOption('[data-testid="action-select"]', 'quarantine');
    await page.selectOption('[data-testid="language-select"]', 'en');
    await page.click('[data-testid="add-word-submit"]');
    
    // When post submission → quarantine queue creation
    await page.goto('/projects/1/community');
    await page.click('[data-testid="new-post-button"]');
    await page.fill('[data-testid="post-title"]', 'Check this out');
    await page.fill('[data-testid="post-content"]', 'You should buy now this amazing product!');
    await page.click('[data-testid="submit-post-button"]');
    
    // Verify post is quarantined
    await expect(page.locator('[data-testid="post-quarantined"]')).toBeVisible();
    await expect(page.locator('[data-testid="quarantine-notice"]')).toContainText('Your post is under review');
    
    // Admin reviews quarantined content
    await page.goto('/admin/safety');
    await page.click('[data-testid="quarantine-tab"]');
    await expect(page.locator('[data-testid="quarantine-list"]')).toBeVisible();
    
    // Select quarantined post
    await page.click('[data-testid="quarantine-item-1"]');
    await page.click('[data-testid="review-content-button"]');
    
    // Review content
    await expect(page.locator('[data-testid="quarantine-review-modal"]')).toBeVisible();
    await expect(page.locator('[data-testid="quarantined-content"]')).toContainText('You should buy now this amazing product!');
    await expect(page.locator('[data-testid="rule-hit"]')).toContainText('advertising');
    
    // Approve content
    await page.click('[data-testid="approve-content-button"]');
    await page.fill('[data-testid="moderator-notes"]', 'Content is acceptable after review');
    await page.click('[data-testid="confirm-approval"]');
    
    // Then post transitions to ACTIVE, quarantine log recorded
    await expect(page.locator('[data-testid="approval-success"]')).toBeVisible();
    
    // Verify post is now visible
    await page.goto('/projects/1/community');
    await expect(page.locator('[data-testid="post-list"]')).toContainText('Check this out');
    
    // Verify quarantine log recorded
    await page.goto('/admin/safety');
    await page.click('[data-testid="logs-tab"]');
    await expect(page.locator('[data-testid="quarantine-log-1"]')).toBeVisible();
    await expect(page.locator('[data-testid="log-action"]')).toContainText('Approved');
  });

  test('E2E-SAFETY-03: Personal information pattern detection', async ({ page }) => {
    // Test phone number detection
    await page.goto('/projects/1/community');
    await page.click('[data-testid="new-post-button"]');
    await page.fill('[data-testid="post-title"]', 'Contact Info');
    await page.fill('[data-testid="post-content"]', 'Call me at 010-1234-5678 for more info');
    await page.click('[data-testid="submit-post-button"]');
    
    // Verify PII detection
    await expect(page.locator('[data-testid="pii-detected"]')).toBeVisible();
    await expect(page.locator('[data-testid="pii-type"]')).toContainText('Phone number');
    
    // Test account number detection
    await page.fill('[data-testid="post-content"]', 'Send money to account 123-456-789012');
    await page.click('[data-testid="submit-post-button"]');
    
    await expect(page.locator('[data-testid="pii-detected"]')).toBeVisible();
    await expect(page.locator('[data-testid="pii-type"]')).toContainText('Account number');
  });

  test('E2E-SAFETY-04: Rate limiting and spam prevention', async ({ page }) => {
    // Test rapid posting attempts
    for (let i = 0; i < 6; i++) {
      await page.goto('/projects/1/community');
      await page.click('[data-testid="new-post-button"]');
      await page.fill('[data-testid="post-title"]', `Spam Post ${i}`);
      await page.fill('[data-testid="post-content"]', `This is spam post number ${i}`);
      await page.click('[data-testid="submit-post-button"]');
      
      if (i < 3) {
        // First few should succeed
        await expect(page.locator('[data-testid="post-success"]')).toBeVisible();
      } else {
        // Later attempts should be rate limited
        await expect(page.locator('[data-testid="rate-limit-error"]')).toBeVisible();
        await expect(page.locator('[data-testid="cooldown-message"]')).toContainText('Please wait');
      }
    }
  });

  test('E2E-SAFETY-05: Report threshold auto-hide', async ({ page }) => {
    // Create a post first
    await page.goto('/projects/1/community');
    await page.click('[data-testid="new-post-button"]');
    await page.fill('[data-testid="post-title"]', 'Controversial Post');
    await page.fill('[data-testid="post-content"]', 'This post might be controversial');
    await page.click('[data-testid="submit-post-button"]');
    
    // Simulate multiple reports
    await page.evaluate(() => {
      window.localStorage.setItem('simulate_reports', JSON.stringify([
        { postId: 1, reports: 3, reason: 'inappropriate' }
      ]));
    });
    
    // Trigger report threshold check
    await page.click('[data-testid="check-report-threshold"]');
    
    // Verify post is auto-hidden
    await expect(page.locator('[data-testid="auto-hidden-notice"]')).toBeVisible();
    await expect(page.locator('[data-testid="hidden-post"]')).toHaveClass(/hidden/);
    
    // Verify admin queue entry
    await page.goto('/admin/safety');
    await page.click('[data-testid="quarantine-tab"]');
    await expect(page.locator('[data-testid="auto-hidden-item"]')).toBeVisible();
  });

  test('E2E-SAFETY-06: Regex pattern testing', async ({ page }) => {
    // Test regex pattern creation
    await page.goto('/admin/safety');
    await page.click('[data-testid="regex-tab"]');
    await page.click('[data-testid="add-regex-button"]');
    
    // Add regex pattern for URLs
    await page.fill('[data-testid="regex-name"]', 'URL Pattern');
    await page.fill('[data-testid="regex-pattern"]', 'https?://[\\w\\-]+(\\.[\\w\\-]+)+([\\w\\-\\.,@?^=%&:/~\\+#]*[\\w\\-\\@?^=%&/~\\+#])?');
    await page.selectOption('[data-testid="regex-category"]', 'advertising');
    await page.selectOption('[data-testid="regex-severity"]', 'Med');
    await page.selectOption('[data-testid="regex-action"]', 'quarantine');
    await page.click('[data-testid="add-regex-submit"]');
    
    // Test regex with sample text
    await page.fill('[data-testid="test-text"]', 'Check out this link: https://example.com');
    await page.click('[data-testid="test-regex-button"]');
    
    // Verify regex match
    await expect(page.locator('[data-testid="regex-match-result"]')).toBeVisible();
    await expect(page.locator('[data-testid="matched-text"]')).toContainText('https://example.com');
  });

  test('E2E-SAFETY-07: Policy configuration and enforcement', async ({ page }) => {
    // Configure content policies
    await page.goto('/admin/safety');
    await page.click('[data-testid="policies-tab"]');
    
    // Configure post policy
    await page.click('[data-testid="edit-post-policy"]');
    await page.selectOption('[data-testid="low-action"]', 'warning');
    await page.selectOption('[data-testid="med-action"]', 'quarantine');
    await page.selectOption('[data-testid="high-action"]', 'block');
    await page.fill('[data-testid="ratelimit-per-min"]', '5');
    await page.fill('[data-testid="ratelimit-per-10m"]', '20');
    await page.fill('[data-testid="auto-hide-threshold"]', '3');
    await page.click('[data-testid="save-policy"]');
    
    // Verify policy saved
    await expect(page.locator('[data-testid="policy-saved"]')).toBeVisible();
    
    // Test policy enforcement
    await page.goto('/projects/1/community');
    await page.click('[data-testid="new-post-button"]');
    await page.fill('[data-testid="post-title"]', 'Test Policy');
    await page.fill('[data-testid="post-content"]', 'This is a test post');
    await page.click('[data-testid="submit-post-button"]');
    
    // Verify policy is enforced
    await expect(page.locator('[data-testid="post-success"]')).toBeVisible();
  });

  test('E2E-SAFETY-08: Audit logs and reporting', async ({ page }) => {
    // Generate safety report
    await page.goto('/admin/safety');
    await page.click('[data-testid="reports-tab"]');
    await page.selectOption('[data-testid="report-period"]', '7_days');
    await page.click('[data-testid="generate-report-button"]');
    
    // Verify report generation
    await expect(page.locator('[data-testid="report-generated"]')).toBeVisible();
    
    // Check report content
    await expect(page.locator('[data-testid="blocked-count"]')).toContainText(/\d+/);
    await expect(page.locator('[data-testid="quarantined-count"]')).toContainText(/\d+/);
    await expect(page.locator('[data-testid="false-positive-rate"]')).toContainText(/\d+%/);
    
    // Export report
    await page.click('[data-testid="export-report-button"]');
    await expect(page.locator('[data-testid="export-success"]')).toBeVisible();
    
    // Check audit logs
    await page.click('[data-testid="audit-logs-tab"]');
    await expect(page.locator('[data-testid="audit-log-list"]')).toBeVisible();
    
    // Verify log entries
    await expect(page.locator('[data-testid="log-entry-1"]')).toContainText('Word added');
    await expect(page.locator('[data-testid="log-entry-2"]')).toContainText('Policy updated');
  });
});
