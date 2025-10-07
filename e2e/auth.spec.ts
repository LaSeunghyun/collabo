import { test, expect } from '@playwright/test';

test.describe('Authentication & Session Management', () => {
  test.beforeEach(async ({ page }) => {
    // Clear cookies and local storage before each test
    await page.context().clearCookies();
    await page.context().clearPermissions();
  });

  test('TC-AUTH-01: Basic login + AT/RT rotation', async ({ page }) => {
    // Given fan_ko account exists and browser cookies are cleared
    await page.goto('/auth/signin');
    
    // When login → navigate to project detail page → idle for 16+ minutes → API call occurs
    await page.fill('[data-testid="email-input"]', 'fan_ko@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');
    
    // Wait for successful login and redirect
    await expect(page).toHaveURL('/');
    
    // Navigate to project detail page
    await page.goto('/projects/1');
    await expect(page.locator('[data-testid="project-title"]')).toBeVisible();
    
    // Simulate 16+ minutes of idle time (in real test, this would be actual time)
    // For testing purposes, we'll trigger the refresh manually
    await page.evaluate(() => {
      // Simulate AT expiration by clearing the access token
      localStorage.removeItem('access_token');
    });
    
    // Trigger API call that should refresh the token
    await page.click('[data-testid="project-like-button"]');
    
    // Then verify token refresh occurred
    await expect(page.locator('[data-testid="toast-success"]')).toContainText('Success');
    
    // Verify Set-Cookie attributes for refresh token
    const cookies = await page.context().cookies();
    const refreshTokenCookie = cookies.find(c => c.name === '__Host-refresh_token');
    expect(refreshTokenCookie).toBeTruthy();
    expect(refreshTokenCookie?.secure).toBe(true);
    expect(refreshTokenCookie?.httpOnly).toBe(true);
    expect(refreshTokenCookie?.sameSite).toBe('Strict');
    expect(refreshTokenCookie?.path).toBe('/auth');
  });

  test('TC-AUTH-02: RT reuse (theft) detection', async ({ page, context }) => {
    // Given same RT is reused in two sessions (simulated with proxy)
    await page.goto('/auth/signin');
    await page.fill('[data-testid="email-input"]', 'fan_ko@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');
    
    // Get refresh token from first session
    const cookies = await page.context().cookies();
    const refreshToken = cookies.find(c => c.name === '__Host-refresh_token')?.value;
    
    // Create second session with same refresh token
    const secondContext = await context.browser()?.newContext();
    const secondPage = await secondContext?.newPage();
    
    if (secondPage && refreshToken) {
      await secondPage.context().addCookies([{
        name: '__Host-refresh_token',
        value: refreshToken,
        domain: 'localhost',
        path: '/auth',
        secure: true,
        httpOnly: true,
        sameSite: 'Strict'
      }]);
      
      // When second session calls /auth/refresh
      const response = await secondPage.request.get('/api/auth/refresh');
      
      // Then server detects reuse → invalidates session → returns 401
      expect(response.status()).toBe(401);
      
      // Verify security event log was created
      const securityLogs = await page.evaluate(() => 
        window.localStorage.getItem('security_events')
      );
      expect(securityLogs).toContain('refresh_token_reuse');
      
      await secondContext?.close();
    }
  });

  test('TC-AUTH-03: Remember me sliding/absolute expiration', async ({ page }) => {
    // Given "Remember browser" checked login
    await page.goto('/auth/signin');
    await page.fill('[data-testid="email-input"]', 'fan_ko@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.check('[data-testid="remember-me-checkbox"]');
    await page.click('[data-testid="login-button"]');
    
    // Simulate 29 days later visit (sliding refresh should work)
    await page.evaluate(() => {
      const now = new Date();
      const futureDate = new Date(now.getTime() + (29 * 24 * 60 * 60 * 1000));
      // Mock date for testing
      (window as any).mockDate = futureDate;
    });
    
    await page.goto('/');
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
    
    // Simulate 91 days later (absolute expiration should require re-login)
    await page.evaluate(() => {
      const now = new Date();
      const futureDate = new Date(now.getTime() + (91 * 24 * 60 * 60 * 1000));
      (window as any).mockDate = futureDate;
    });
    
    await page.goto('/');
    await expect(page).toHaveURL('/auth/signin');
  });

  test('TC-AUTH-04: Admin MFA + concurrent session limit', async ({ page }) => {
    // Given admin_root account, MFA registered
    await page.goto('/auth/signin');
    await page.fill('[data-testid="email-input"]', 'admin_root@example.com');
    await page.fill('[data-testid="password-input"]', 'admin123');
    await page.click('[data-testid="login-button"]');
    
    // MFA step
    await page.fill('[data-testid="mfa-code-input"]', '123456');
    await page.click('[data-testid="mfa-verify-button"]');
    
    // When backoffice login + sensitive action (settlement approval) click
    await page.goto('/admin');
    await expect(page.locator('[data-testid="admin-dashboard"]')).toBeVisible();
    
    // Try to access settlement approval
    await page.click('[data-testid="settlements-tab"]');
    await page.click('[data-testid="settlement-approve-button"]');
    
    // Then MFA re-authentication required
    await expect(page.locator('[data-testid="mfa-reauth-modal"]')).toBeVisible();
    
    // Test concurrent session limit (3 devices max)
    const contexts = [];
    for (let i = 0; i < 4; i++) {
      const newContext = await page.context().browser()?.newContext();
      const newPage = await newContext?.newPage();
      if (newPage) {
        await newPage.goto('/auth/signin');
        await newPage.fill('[data-testid="email-input"]', 'admin_root@example.com');
        await newPage.fill('[data-testid="password-input"]', 'admin123');
        await newPage.click('[data-testid="login-button"]');
        
        if (i < 3) {
          // First 3 sessions should succeed
          await expect(newPage.locator('[data-testid="mfa-code-input"]')).toBeVisible();
        } else {
          // 4th session should be blocked
          await expect(newPage.locator('[data-testid="session-limit-error"]')).toBeVisible();
        }
        
        contexts.push(newContext);
      }
    }
    
    // Cleanup
    for (const context of contexts) {
      await context?.close();
    }
  });
});
