import { test, expect } from '@playwright/test';

test.describe('Regression Smoke Test Suite', () => {
  test('Smoke Test: Complete user journey', async ({ page }) => {
    // This is a comprehensive smoke test covering the entire user journey
    // Should complete in under 20 minutes as specified in the requirements
    
    // 1. Login (AT/RT refresh)
    await page.goto('/auth/signin');
    await page.fill('[data-testid="email-input"]', 'fan_ko@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await expect(page).toHaveURL('/');
    
    // 2. Project detail entry + reward selection + payment approval
    await page.goto('/projects/1');
    await page.click('[data-testid="reward-ticket-tier"]');
    await page.click('[data-testid="select-reward-button"]');
    
    await page.fill('[data-testid="card-number"]', '4242424242424242');
    await page.fill('[data-testid="card-expiry"]', '12/25');
    await page.fill('[data-testid="card-cvc"]', '123');
    await page.fill('[data-testid="card-name"]', 'Test User');
    await page.click('[data-testid="payment-submit-button"]');
    
    await expect(page.locator('[data-testid="payment-success"]')).toBeVisible();
    
    // 3. Community post creation/like/report 1 case
    await page.goto('/projects/1/community');
    await page.click('[data-testid="new-post-button"]');
    await page.fill('[data-testid="post-content"]', 'Great project! Looking forward to the results.');
    await page.click('[data-testid="submit-post-button"]');
    
    await page.click('[data-testid="post-like-button"]');
    await page.click('[data-testid="post-report-button"]');
    await page.selectOption('[data-testid="report-reason"]', 'spam');
    await page.click('[data-testid="submit-report-button"]');
    
    // 4. Admin: project 1 case approval, report 1 case action
    await page.goto('/auth/signin');
    await page.fill('[data-testid="email-input"]', 'admin_root@example.com');
    await page.fill('[data-testid="password-input"]', 'admin123');
    await page.click('[data-testid="login-button"]');
    await page.fill('[data-testid="mfa-code-input"]', '123456');
    await page.click('[data-testid="mfa-verify-button"]');
    
    await page.goto('/admin/projects');
    await page.click('[data-testid="project-1-row"]');
    await page.click('[data-testid="approve-project-button"]');
    await page.fill('[data-testid="approval-notes"]', 'Project approved');
    await page.click('[data-testid="confirm-approval"]');
    
    await page.goto('/admin/moderation');
    await page.click('[data-testid="report-1-row"]');
    await page.click('[data-testid="blind-content-button"]');
    await page.fill('[data-testid="processing-memo"]', 'Content violates guidelines');
    await page.click('[data-testid="confirm-action"]');
    
    // 5. Settlement queue check + status change (mock)
    await page.goto('/admin/settlements');
    await page.click('[data-testid="settlement-1-row"]');
    await page.click('[data-testid="view-payments-button"]');
    await page.click('[data-testid="execute-payment-1"]');
    
    // 6. Announcement creation/pin/scheduled publishing
    await page.goto('/admin/announcements');
    await page.click('[data-testid="create-announcement-button"]');
    await page.fill('[data-testid="announcement-title"]', 'Platform Maintenance');
    await page.fill('[data-testid="announcement-content"]', 'Scheduled maintenance on December 25th');
    await page.check('[data-testid="pin-announcement"]');
    await page.click('[data-testid="publish-announcement-button"]');
    
    // 7. Logout and re-login
    await page.click('[data-testid="user-menu"]');
    await page.click('[data-testid="logout-button"]');
    await expect(page).toHaveURL('/auth/signin');
    
    await page.fill('[data-testid="email-input"]', 'fan_ko@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await expect(page).toHaveURL('/');
  });

  test('Smoke Test: Artist communication flow', async ({ page }) => {
    // Test artist communication features
    await page.goto('/auth/signin');
    await page.fill('[data-testid="email-input"]', 'artist_ko@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');
    
    // Create backer-only update
    await page.goto('/artist/dashboard');
    await page.click('[data-testid="write-update-button"]');
    await page.fill('[data-testid="update-title"]', 'Backer Update');
    await page.fill('[data-testid="update-content"]', 'Thank you for your support!');
    await page.selectOption('[data-testid="visibility-select"]', 'BACKERS_ONLY');
    await page.click('[data-testid="publish-update-button"]');
    
    // Create public post
    await page.click('[data-testid="write-post-button"]');
    await page.fill('[data-testid="post-title"]', 'Public Post');
    await page.fill('[data-testid="post-content"]', 'Check out my latest work!');
    await page.selectOption('[data-testid="visibility-select"]', 'PUBLIC');
    await page.click('[data-testid="publish-post-button"]');
    
    // Create AMA
    await page.click('[data-testid="create-ama-button"]');
    await page.fill('[data-testid="ama-title"]', 'Q&A Session');
    await page.fill('[data-testid="ama-description"]', 'Ask me anything!');
    await page.fill('[data-testid="ama-date"]', '2024-12-25');
    await page.fill('[data-testid="ama-time"]', '19:00');
    await page.click('[data-testid="create-ama-submit"]');
  });

  test('Smoke Test: Content safety features', async ({ page }) => {
    // Test content safety
    await page.goto('/auth/signin');
    await page.fill('[data-testid="email-input"]', 'admin_root@example.com');
    await page.fill('[data-testid="password-input"]', 'admin123');
    await page.click('[data-testid="login-button"]');
    await page.fill('[data-testid="mfa-code-input"]', '123456');
    await page.click('[data-testid="mfa-verify-button"]');
    
    // Add safety rule
    await page.goto('/admin/safety');
    await page.click('[data-testid="add-word-button"]');
    await page.fill('[data-testid="word-input"]', 'spam');
    await page.selectOption('[data-testid="category-select"]', 'advertising');
    await page.selectOption('[data-testid="severity-select"]', 'MEDIUM');
    await page.selectOption('[data-testid="action-select"]', 'quarantine');
    await page.click('[data-testid="add-word-submit"]');
    
    // Test content filtering
    await page.goto('/auth/signin');
    await page.fill('[data-testid="email-input"]', 'fan_ko@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');
    
    await page.goto('/projects/1/community');
    await page.click('[data-testid="new-post-button"]');
    await page.fill('[data-testid="post-content"]', 'This is spam content');
    await page.click('[data-testid="submit-post-button"]');
    
    await expect(page.locator('[data-testid="content-quarantined"]')).toBeVisible();
  });

  test('Smoke Test: Settlement management', async ({ page }) => {
    // Test settlement features
    await page.goto('/auth/signin');
    await page.fill('[data-testid="email-input"]', 'admin_root@example.com');
    await page.fill('[data-testid="password-input"]', 'admin123');
    await page.click('[data-testid="login-button"]');
    await page.fill('[data-testid="mfa-code-input"]', '123456');
    await page.click('[data-testid="mfa-verify-button"]');
    
    // Review settlement
    await page.goto('/admin/settlements');
    await page.click('[data-testid="settlement-1-row"]');
    await page.click('[data-testid="settlement-details-button"]');
    
    // Verify calculation
    await expect(page.locator('[data-testid="total-raised"]')).toContainText('₩1,000,000');
    await expect(page.locator('[data-testid="net-payable"]')).toContainText('₩800,000');
    
    // Approve settlement
    await page.click('[data-testid="approve-settlement-button"]');
    await page.fill('[data-testid="approval-notes"]', 'Settlement approved');
    await page.click('[data-testid="confirm-approval"]');
    
    // Execute payment
    await page.click('[data-testid="view-payments-button"]');
    await page.click('[data-testid="execute-payment-1"]');
  });

  test('Smoke Test: Overfunding management', async ({ page }) => {
    // Test overfunding features
    await page.goto('/auth/signin');
    await page.fill('[data-testid="email-input"]', 'admin_root@example.com');
    await page.fill('[data-testid="password-input"]', 'admin123');
    await page.click('[data-testid="login-button"]');
    await page.fill('[data-testid="mfa-code-input"]', '123456');
    await page.click('[data-testid="mfa-verify-button"]');
    
    // Configure overfunding threshold
    await page.goto('/admin/funding-policy');
    await page.click('[data-testid="thresholds-tab"]');
    await page.click('[data-testid="edit-threshold-150"]');
    await page.check('[data-testid="require-stretch-goal"]');
    await page.check('[data-testid="payment-restriction"]');
    await page.click('[data-testid="save-threshold"]');
    
    // Test stretch goal requirement
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
    await page.fill('[data-testid="stretch-title"]', 'Enhanced Package');
    await page.fill('[data-testid="stretch-description"]', 'Bonus content for 200% funding');
    await page.fill('[data-testid="stretch-budget"]', '₩500,000');
    await page.click('[data-testid="submit-stretch-goal"]');
  });

  test('Smoke Test: Performance critical paths', async ({ page }) => {
    // Test performance critical paths
    const startTime = Date.now();
    
    // Login
    await page.goto('/auth/signin');
    await page.fill('[data-testid="email-input"]', 'fan_ko@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');
    
    // Homepage load
    await page.goto('/');
    await page.waitForSelector('[data-testid="project-list"]');
    
    // Project detail load
    await page.goto('/projects/1');
    await page.waitForSelector('[data-testid="project-details"]');
    
    // Community load
    await page.goto('/projects/1/community');
    await page.waitForSelector('[data-testid="community-posts"]');
    
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    
    // Verify performance within acceptable limits
    expect(totalTime).toBeLessThan(10000); // Under 10 seconds total
  });

  test('Smoke Test: Error handling', async ({ page }) => {
    // Test error handling
    await page.goto('/nonexistent-page');
    await expect(page.locator('[data-testid="404-error"]')).toBeVisible();
    
    await page.goto('/api/error-test');
    await expect(page.locator('[data-testid="500-error"]')).toBeVisible();
    
    // Test network error
    await page.route('/api/projects', route => route.abort());
    await page.goto('/projects');
    await expect(page.locator('[data-testid="network-error"]')).toBeVisible();
  });

  test('Smoke Test: Mobile responsiveness', async ({ page }) => {
    // Test mobile responsiveness
    await page.setViewportSize({ width: 390, height: 844 });
    
    await page.goto('/auth/signin');
    await page.fill('[data-testid="email-input"]', 'fan_ko@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');
    
    await page.goto('/');
    await expect(page.locator('[data-testid="mobile-nav"]')).toBeVisible();
    
    await page.goto('/projects/1');
    await expect(page.locator('[data-testid="mobile-project-details"]')).toBeVisible();
  });

  test('Smoke Test: Internationalization', async ({ page }) => {
    // Test i18n
    await page.goto('/auth/signin');
    await page.fill('[data-testid="email-input"]', 'fan_ko@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');
    
    // Test Korean
    await page.goto('/?lang=ko');
    await expect(page.locator('[data-testid="welcome-message"]')).toContainText('환영합니다');
    
    // Test English
    await page.goto('/?lang=en');
    await expect(page.locator('[data-testid="welcome-message"]')).toContainText('Welcome');
  });
});
