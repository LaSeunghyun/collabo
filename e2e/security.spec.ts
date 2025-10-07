import { test, expect } from '@playwright/test';

test.describe('Security & Data Integrity', () => {
  test.beforeEach(async ({ page }) => {
    // Setup security monitoring
    await page.addInitScript(() => {
      (window as any).securityEvents = [];
      (window as any).console.error = (...args) => {
        (window as any).securityEvents.push({ type: 'console_error', args });
        console.error(...args);
      };
    });
  });

  test('TC-SEC-01: Project internal community access control', async ({ page }) => {
    // Given non-participant tries to access internal community URL directly
    await page.goto('/projects/1/community');
    
    // Then 403 + participation required notice
    await expect(page.locator('[data-testid="access-denied"]')).toBeVisible();
    await expect(page.locator('[data-testid="participation-required"]')).toContainText('Participation Required');
    await expect(page.locator('[data-testid="join-project-button"]')).toBeVisible();
    
    // Verify URL shows 403 status
    const response = await page.request.get('/api/projects/1/community');
    expect(response.status()).toBe(403);
  });

  test('TC-SEC-02: Privilege escalation prevention', async ({ page }) => {
    // Given regular user tries to access admin API
    await page.goto('/auth/signin');
    await page.fill('[data-testid="email-input"]', 'fan_ko@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');
    
    // When calling admin API endpoints
    const adminEndpoints = [
      '/api/admin/projects',
      '/api/admin/users',
      '/api/admin/settlements',
      '/api/admin/moderation'
    ];
    
    for (const endpoint of adminEndpoints) {
      const response = await page.request.get(endpoint);
      expect(response.status()).toBeOneOf([401, 403]); // Should be unauthorized
    }
    
    // Verify audit log records
    const auditLogs = await page.evaluate(() => 
      window.localStorage.getItem('audit_logs')
    );
    expect(auditLogs).toContain('unauthorized_access_attempt');
  });

  test('TC-SEC-03: File upload validation', async ({ page }) => {
    // Test various file upload scenarios
    await page.goto('/auth/signin');
    await page.fill('[data-testid="email-input"]', 'artist_ko@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');
    
    await page.goto('/artist/dashboard');
    await page.click('[data-testid="write-update-button"]');
    
    // Test malicious file upload
    const maliciousFiles = [
      'test-files/malicious.exe',
      'test-files/script.js',
      'test-files/backdoor.php',
      'test-files/virus.zip'
    ];
    
    for (const file of maliciousFiles) {
      await page.setInputFiles('[data-testid="file-upload"]', file);
      await expect(page.locator('[data-testid="upload-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="upload-error"]')).toContainText('File type not allowed');
    }
    
    // Test oversized file
    await page.setInputFiles('[data-testid="file-upload"]', 'test-files/large-file.jpg');
    await expect(page.locator('[data-testid="upload-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="upload-error"]')).toContainText('File too large');
    
    // Test valid file
    await page.setInputFiles('[data-testid="file-upload"]', 'test-files/valid-image.jpg');
    await expect(page.locator('[data-testid="upload-success"]')).toBeVisible();
  });

  test('TC-SEC-04: SQL injection prevention', async ({ page }) => {
    // Test SQL injection attempts
    const sqlInjectionPayloads = [
      "'; DROP TABLE users; --",
      "' OR '1'='1",
      "'; INSERT INTO users (email) VALUES ('hacker@evil.com'); --",
      "' UNION SELECT * FROM users --"
    ];
    
    await page.goto('/auth/signin');
    
    for (const payload of sqlInjectionPayloads) {
      await page.fill('[data-testid="email-input"]', payload);
      await page.fill('[data-testid="password-input"]', 'password123');
      await page.click('[data-testid="login-button"]');
      
      // Should not succeed
      await expect(page.locator('[data-testid="login-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="login-error"]')).toContainText('Invalid credentials');
    }
    
    // Test search functionality
    await page.goto('/projects');
    await page.fill('[data-testid="search-input"]', "'; DROP TABLE projects; --");
    await page.click('[data-testid="search-button"]');
    
    // Should handle gracefully
    await expect(page.locator('[data-testid="search-results"]')).toBeVisible();
    await expect(page.locator('[data-testid="search-results"]')).toContainText('No results found');
  });

  test('TC-SEC-05: XSS prevention', async ({ page }) => {
    // Test XSS attempts
    const xssPayloads = [
      '<script>alert("XSS")</script>',
      '<img src="x" onerror="alert(\'XSS\')">',
      'javascript:alert("XSS")',
      '<svg onload="alert(\'XSS\')">'
    ];
    
    await page.goto('/auth/signin');
    await page.fill('[data-testid="email-input"]', 'artist_ko@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');
    
    await page.goto('/artist/dashboard');
    await page.click('[data-testid="write-update-button"]');
    
    for (const payload of xssPayloads) {
      await page.fill('[data-testid="update-content"]', payload);
      await page.click('[data-testid="publish-update-button"]');
      
      // Should be sanitized
      await expect(page.locator('[data-testid="update-content"]')).not.toContainText('<script>');
      await expect(page.locator('[data-testid="update-content"]')).not.toContainText('onerror');
      await expect(page.locator('[data-testid="update-content"]')).not.toContainText('javascript:');
    }
  });

  test('TC-SEC-06: CSRF protection', async ({ page }) => {
    // Test CSRF protection
    await page.goto('/auth/signin');
    await page.fill('[data-testid="email-input"]', 'artist_ko@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');
    
    // Try to make request without CSRF token
    const response = await page.request.post('/api/projects', {
      data: {
        title: 'Hacked Project',
        description: 'This should not be created'
      }
    });
    
    expect(response.status()).toBe(403);
    expect(await response.text()).toContain('CSRF token');
  });

  test('TC-SEC-07: Rate limiting', async ({ page }) => {
    // Test rate limiting
    await page.goto('/auth/signin');
    
    // Try multiple login attempts
    for (let i = 0; i < 10; i++) {
      await page.fill('[data-testid="email-input"]', 'test@example.com');
      await page.fill('[data-testid="password-input"]', 'wrongpassword');
      await page.click('[data-testid="login-button"]');
      
      if (i < 5) {
        await expect(page.locator('[data-testid="login-error"]')).toBeVisible();
      } else {
        // Should be rate limited
        await expect(page.locator('[data-testid="rate-limit-error"]')).toBeVisible();
        break;
      }
    }
  });

  test('TC-SEC-08: Session security', async ({ page }) => {
    // Test session security
    await page.goto('/auth/signin');
    await page.fill('[data-testid="email-input"]', 'fan_ko@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');
    
    // Verify session cookie security
    const cookies = await page.context().cookies();
    const sessionCookie = cookies.find(c => c.name.includes('session'));
    
    expect(sessionCookie?.secure).toBe(true);
    expect(sessionCookie?.httpOnly).toBe(true);
    expect(sessionCookie?.sameSite).toBe('Strict');
    
    // Test session timeout
    await page.evaluate(() => {
      // Simulate session expiry
      localStorage.setItem('session_expired', 'true');
    });
    
    await page.goto('/projects');
    await expect(page).toHaveURL('/auth/signin');
  });

  test('TC-SEC-09: Data encryption', async ({ page }) => {
    // Test data encryption
    await page.goto('/auth/signin');
    await page.fill('[data-testid="email-input"]', 'fan_ko@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');
    
    // Check that sensitive data is encrypted
    const response = await page.request.get('/api/users/profile');
    const profile = await response.json();
    
    // Verify sensitive fields are not in plain text
    expect(profile.password).toBeUndefined();
    expect(profile.creditCard).toBeUndefined();
    expect(profile.ssn).toBeUndefined();
    
    // Verify data is properly masked
    if (profile.phone) {
      expect(profile.phone).toMatch(/\*{3}-\*{4}-\*{4}/);
    }
  });

  test('TC-SEC-10: Input validation', async ({ page }) => {
    // Test input validation
    await page.goto('/auth/signin');
    await page.fill('[data-testid="email-input"]', 'artist_ko@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');
    
    await page.goto('/projects/new');
    
    // Test various invalid inputs
    const invalidInputs = [
      { field: 'project-title', value: '', error: 'Title is required' },
      { field: 'project-goal', value: '-1000', error: 'Goal must be positive' },
      { field: 'project-goal', value: 'abc', error: 'Goal must be a number' },
      { field: 'project-deadline', value: '2020-01-01', error: 'Deadline must be in the future' },
      { field: 'project-description', value: 'a'.repeat(10000), error: 'Description too long' }
    ];
    
    for (const input of invalidInputs) {
      await page.fill(`[data-testid="${input.field}"]`, input.value);
      await page.click('[data-testid="submit-project"]');
      
      await expect(page.locator('[data-testid="validation-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="validation-error"]')).toContainText(input.error);
    }
  });

  test('TC-SEC-11: API authentication', async ({ page }) => {
    // Test API authentication
    const protectedEndpoints = [
      '/api/projects',
      '/api/users/profile',
      '/api/settlements',
      '/api/admin/projects'
    ];
    
    for (const endpoint of protectedEndpoints) {
      const response = await page.request.get(endpoint);
      expect(response.status()).toBeOneOf([401, 403]); // Should require authentication
    }
    
    // Test with invalid token
    await page.setExtraHTTPHeaders({
      'Authorization': 'Bearer invalid-token'
    });
    
    const response = await page.request.get('/api/projects');
    expect(response.status()).toBe(401);
  });

  test('TC-SEC-12: Data sanitization', async ({ page }) => {
    // Test data sanitization
    await page.goto('/auth/signin');
    await page.fill('[data-testid="email-input"]', 'artist_ko@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');
    
    await page.goto('/projects/1/community');
    await page.click('[data-testid="new-post-button"]');
    
    // Test malicious content
    const maliciousContent = `
      <script>alert('XSS')</script>
      <img src="x" onerror="alert('XSS')">
      <a href="javascript:alert('XSS')">Click me</a>
      <iframe src="javascript:alert('XSS')"></iframe>
    `;
    
    await page.fill('[data-testid="post-content"]', maliciousContent);
    await page.click('[data-testid="submit-post-button"]');
    
    // Verify content is sanitized
    await page.goto('/projects/1/community');
    const postContent = await page.locator('[data-testid="post-content"]').textContent();
    
    expect(postContent).not.toContain('<script>');
    expect(postContent).not.toContain('onerror');
    expect(postContent).not.toContain('javascript:');
    expect(postContent).not.toContain('<iframe>');
  });

  test('TC-SEC-13: Audit logging', async ({ page }) => {
    // Test audit logging
    await page.goto('/auth/signin');
    await page.fill('[data-testid="email-input"]', 'admin_root@example.com');
    await page.fill('[data-testid="password-input"]', 'admin123');
    await page.click('[data-testid="login-button"]');
    await page.fill('[data-testid="mfa-code-input"]', '123456');
    await page.click('[data-testid="mfa-verify-button"]');
    
    // Perform admin actions
    await page.goto('/admin/projects');
    await page.click('[data-testid="project-1-row"]');
    await page.click('[data-testid="approve-project-button"]');
    
    // Verify audit log
    const auditLogs = await page.evaluate(() => 
      window.localStorage.getItem('audit_logs')
    );
    
    expect(auditLogs).toContain('project_approved');
    expect(auditLogs).toContain('admin_root@example.com');
    expect(auditLogs).toContain('project-1');
  });

  test('TC-SEC-14: Error handling', async ({ page }) => {
    // Test error handling
    await page.goto('/auth/signin');
    await page.fill('[data-testid="email-input"]', 'fan_ko@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');
    
    // Test 404 handling
    await page.goto('/nonexistent-page');
    await expect(page.locator('[data-testid="404-error"]')).toBeVisible();
    
    // Test 500 handling
    await page.goto('/api/error-test');
    await expect(page.locator('[data-testid="500-error"]')).toBeVisible();
    
    // Verify no sensitive information leaked
    const errorContent = await page.locator('[data-testid="error-content"]').textContent();
    expect(errorContent).not.toContain('stack trace');
    expect(errorContent).not.toContain('database');
    expect(errorContent).not.toContain('password');
  });
});
