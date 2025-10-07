import { test, expect } from '@playwright/test';

test.describe('Visitor/Participant (Fan) Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login as fan_ko before each test
    await page.goto('/auth/signin');
    await page.fill('[data-testid="email-input"]', 'fan_ko@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await expect(page).toHaveURL('/');
  });

  test('TC-FUND-01: Project exploration → reward selection → payment success', async ({ page }) => {
    // Given funding open project with sufficient inventory
    await page.goto('/projects/1');
    await expect(page.locator('[data-testid="project-status"]')).toContainText('Live');
    await expect(page.locator('[data-testid="reward-inventory"]')).toContainText('Available');
    
    // When detail page entry → reward (ticket) selection → payment (sandbox card)
    await page.click('[data-testid="reward-ticket-tier"]');
    await page.click('[data-testid="select-reward-button"]');
    
    // Fill payment form
    await page.fill('[data-testid="card-number"]', '4242424242424242');
    await page.fill('[data-testid="card-expiry"]', '12/25');
    await page.fill('[data-testid="card-cvc"]', '123');
    await page.fill('[data-testid="card-name"]', 'Test User');
    
    await page.click('[data-testid="payment-submit-button"]');
    
    // Then payment approval, order status Paid or PaidPendingCapture
    await expect(page.locator('[data-testid="payment-success"]')).toBeVisible();
    await expect(page.locator('[data-testid="order-status"]')).toContainText(/Paid|PaidPendingCapture/);
    
    // Verify achievement rate/participant count real-time update
    await expect(page.locator('[data-testid="funding-progress"]')).toContainText('Updated');
    await expect(page.locator('[data-testid="participant-count"]')).toContainText('+1');
    
    // Verify notification subscription (project updates) is on by default
    await expect(page.locator('[data-testid="notification-toggle"]')).toBeChecked();
    
    // Verify event tracking (view→click→payment funnel), receipt email sent
    const trackingEvents = await page.evaluate(() => 
      window.localStorage.getItem('tracking_events')
    );
    expect(trackingEvents).toContain('project_view');
    expect(trackingEvents).toContain('reward_click');
    expect(trackingEvents).toContain('payment_success');
  });

  test('TC-FUND-02: Payment failure retry', async ({ page }) => {
    // Given first payment failure (intentional error code return)
    await page.goto('/projects/1');
    await page.click('[data-testid="reward-ticket-tier"]');
    await page.click('[data-testid="select-reward-button"]');
    
    // Use card that will fail
    await page.fill('[data-testid="card-number"]', '4000000000000002'); // Declined card
    await page.fill('[data-testid="card-expiry"]', '12/25');
    await page.fill('[data-testid="card-cvc"]', '123');
    await page.fill('[data-testid="card-name"]', 'Test User');
    
    await page.click('[data-testid="payment-submit-button"]');
    
    // When 3 retries or payment method change
    await expect(page.locator('[data-testid="payment-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
    
    // First retry with same card
    await page.click('[data-testid="retry-button"]');
    await expect(page.locator('[data-testid="payment-error"]')).toBeVisible();
    
    // Second retry with different card
    await page.fill('[data-testid="card-number"]', '4242424242424242'); // Success card
    await page.click('[data-testid="retry-button"]');
    
    // Then failure notification → retry success → normal transition, failure accumulation → customer service guidance
    await expect(page.locator('[data-testid="payment-success"]')).toBeVisible();
    
    // Verify retry count tracking
    const retryCount = await page.evaluate(() => 
      window.localStorage.getItem('payment_retry_count')
    );
    expect(parseInt(retryCount || '0')).toBe(2);
  });

  test('TC-FUND-03: Deadline failure automatic refund', async ({ page }) => {
    // Given goal not met project (deadline shortened for testing)
    await page.goto('/projects/2'); // Project with short deadline
    await expect(page.locator('[data-testid="project-status"]')).toContainText('Live');
    
    // Make a payment
    await page.click('[data-testid="reward-ticket-tier"]');
    await page.click('[data-testid="select-reward-button"]');
    await page.fill('[data-testid="card-number"]', '4242424242424242');
    await page.fill('[data-testid="card-expiry"]', '12/25');
    await page.fill('[data-testid="card-cvc"]', '123');
    await page.fill('[data-testid="card-name"]', 'Test User');
    await page.click('[data-testid="payment-submit-button"]');
    
    // Wait for deadline to pass (simulated)
    await page.evaluate(() => {
      // Simulate deadline passing
      window.localStorage.setItem('simulate_deadline_passed', 'true');
    });
    
    // When deadline batch execution
    await page.goto('/projects/2');
    await page.click('[data-testid="check-deadline-status"]');
    
    // Then full payment automatic refund, participant notification sent, similar project recommendation shown
    await expect(page.locator('[data-testid="refund-notification"]')).toBeVisible();
    await expect(page.locator('[data-testid="refund-amount"]')).toContainText('₩50,000');
    await expect(page.locator('[data-testid="similar-projects"]')).toBeVisible();
    
    // Verify refund email sent
    const notifications = await page.evaluate(() => 
      window.localStorage.getItem('email_notifications')
    );
    expect(notifications).toContain('refund_processed');
  });

  test('TC-FUND-04: Community - post creation/edit/delete/like/report', async ({ page }) => {
    // Given project community access permission (participant)
    await page.goto('/projects/1/community');
    await expect(page.locator('[data-testid="community-access"]')).toBeVisible();
    
    // When category selection→title/content writing→post→edit→delete(soft)→like toggle→report submission
    await page.click('[data-testid="new-post-button"]');
    await page.selectOption('[data-testid="category-select"]', 'general');
    await page.fill('[data-testid="post-title"]', 'Test Post Title');
    await page.fill('[data-testid="post-content"]', 'This is a test post content');
    await page.click('[data-testid="submit-post-button"]');
    
    // Verify post creation
    await expect(page.locator('[data-testid="post-list"]')).toContainText('Test Post Title');
    
    // Edit post
    await page.click('[data-testid="post-edit-button"]');
    await page.fill('[data-testid="post-title"]', 'Updated Test Post Title');
    await page.click('[data-testid="save-post-button"]');
    
    // Verify edit
    await expect(page.locator('[data-testid="post-list"]')).toContainText('Updated Test Post Title');
    
    // Like toggle
    await page.click('[data-testid="post-like-button"]');
    await expect(page.locator('[data-testid="like-count"]')).toContainText('1');
    
    // Unlike
    await page.click('[data-testid="post-like-button"]');
    await expect(page.locator('[data-testid="like-count"]')).toContainText('0');
    
    // Report post
    await page.click('[data-testid="post-report-button"]');
    await page.selectOption('[data-testid="report-reason"]', 'spam');
    await page.fill('[data-testid="report-details"]', 'This post is spam');
    await page.click('[data-testid="submit-report-button"]');
    
    // Verify report submission
    await expect(page.locator('[data-testid="report-success"]')).toBeVisible();
    
    // Soft delete
    await page.click('[data-testid="post-delete-button"]');
    await page.click('[data-testid="confirm-delete-button"]');
    
    // Then creation/edit/delete permission compliance (own only)
    await expect(page.locator('[data-testid="post-list"]')).not.toContainText('Updated Test Post Title');
    
    // Verify soft delete behavior
    await page.goto('/projects/1/community/post/1');
    await expect(page.locator('[data-testid="deleted-post-message"]')).toBeVisible();
    
    // Verify like duplicate prevention (toggle), count optimistic update then match
    const likeCount = await page.locator('[data-testid="like-count"]').textContent();
    expect(likeCount).toBe('0');
    
    // Verify report 3+ times → auto hide (HIDDEN), admin queue entry
    // This would require multiple users reporting the same post
    // For testing, we'll simulate this
    await page.evaluate(() => {
      window.localStorage.setItem('simulate_multiple_reports', 'true');
    });
    
    await page.goto('/projects/1/community');
    await expect(page.locator('[data-testid="hidden-post-notice"]')).toBeVisible();
  });

  test('TC-FUND-05: Ticket distribution/QR entry', async ({ page }) => {
    // Given performance type reward + order Paid
    await page.goto('/projects/1');
    await page.click('[data-testid="reward-performance-tier"]');
    await page.click('[data-testid="select-reward-button"]');
    
    // Complete payment
    await page.fill('[data-testid="card-number"]', '4242424242424242');
    await page.fill('[data-testid="card-expiry"]', '12/25');
    await page.fill('[data-testid="card-cvc"]', '123');
    await page.fill('[data-testid="card-name"]', 'Test User');
    await page.click('[data-testid="payment-submit-button"]');
    
    // Simulate project completion and ticket generation
    await page.evaluate(() => {
      window.localStorage.setItem('simulate_project_completed', 'true');
    });
    
    // When ticket (QR) issued after deadline, D-1 reminder
    await page.goto('/my-tickets');
    await expect(page.locator('[data-testid="ticket-qr"]')).toBeVisible();
    
    // Verify QR is valid for single use
    await page.click('[data-testid="qr-code"]');
    await expect(page.locator('[data-testid="qr-valid"]')).toBeVisible();
    
    // Try to use QR again (should fail)
    await page.click('[data-testid="qr-code"]');
    await expect(page.locator('[data-testid="qr-used-error"]')).toBeVisible();
    
    // Verify D-1 reminder
    const notifications = await page.evaluate(() => 
      window.localStorage.getItem('push_notifications')
    );
    expect(notifications).toContain('ticket_reminder_d1');
  });

  test('TC-FUND-06: Goods shipping tracking/return processing', async ({ page }) => {
    // Given goods reward, tracking number generated
    await page.goto('/projects/1');
    await page.click('[data-testid="reward-goods-tier"]');
    await page.click('[data-testid="select-reward-button"]');
    
    // Complete payment
    await page.fill('[data-testid="card-number"]', '4242424242424242');
    await page.fill('[data-testid="card-expiry"]', '12/25');
    await page.fill('[data-testid="card-cvc"]', '123');
    await page.fill('[data-testid="card-name"]', 'Test User');
    await page.click('[data-testid="payment-submit-button"]');
    
    // Simulate shipping process
    await page.evaluate(() => {
      window.localStorage.setItem('simulate_shipping_started', 'true');
    });
    
    // When shipping status change (shipped→in transit→delivered) & return event occurs
    await page.goto('/my-orders');
    await expect(page.locator('[data-testid="shipping-status"]')).toContainText('Shipped');
    
    // Simulate status updates
    await page.click('[data-testid="refresh-shipping-status"]');
    await expect(page.locator('[data-testid="shipping-status"]')).toContainText('In Transit');
    
    await page.click('[data-testid="refresh-shipping-status"]');
    await expect(page.locator('[data-testid="shipping-status"]')).toContainText('Delivered');
    
    // Simulate return event
    await page.evaluate(() => {
      window.localStorage.setItem('simulate_return_requested', 'true');
    });
    
    await page.click('[data-testid="refresh-shipping-status"]');
    
    // Then UI tracking update, return address confirmation flow/reshipment/refund options shown
    await expect(page.locator('[data-testid="return-notice"]')).toBeVisible();
    await expect(page.locator('[data-testid="address-confirmation"]')).toBeVisible();
    await expect(page.locator('[data-testid="reshipment-option"]')).toBeVisible();
    await expect(page.locator('[data-testid="refund-option"]')).toBeVisible();
  });
});
