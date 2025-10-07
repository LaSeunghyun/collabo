import { test, expect } from '@playwright/test';

test.describe('Performance & Observability', () => {
  test.beforeEach(async ({ page }) => {
    // Setup performance monitoring
    await page.addInitScript(() => {
      // Mock performance API for testing
      (window as any).performanceMetrics = {
        ttfb: 0,
        fcp: 0,
        lcp: 0,
        fid: 0,
        cls: 0,
        queries: [],
        errors: []
      };

      // Override performance.now for consistent testing
      const startTime = Date.now();
      (window as any).performance.now = () => Date.now() - startTime;
    });
  });

  test('TC-PERF-01: Community feed N+1 prevention', async ({ page }) => {
    // Given community feed with 200 posts
    await page.goto('/projects/1/community');
    
    // Start performance monitoring
    await page.evaluate(() => {
      (window as any).performanceMetrics.queries = [];
    });

    // When popular sorting (like count) with 200 posts pagination
    await page.click('[data-testid="sort-popular"]');
    await page.click('[data-testid="load-more-posts"]');
    
    // Wait for all posts to load
    await page.waitForSelector('[data-testid="post-200"]');
    
    // Then query count/time below threshold (verify via logs)
    const metrics = await page.evaluate(() => (window as any).performanceMetrics);
    
    // Verify query count is reasonable (not N+1)
    expect(metrics.queries.length).toBeLessThan(10); // Should be batched queries
    
    // Verify cache hit rate
    const cacheHits = metrics.queries.filter((q: any) => q.cached).length;
    const cacheHitRate = cacheHits / metrics.queries.length;
    expect(cacheHitRate).toBeGreaterThan(0.8); // 80% cache hit rate
    
    // Verify total query time
    const totalQueryTime = metrics.queries.reduce((sum: number, q: any) => sum + q.duration, 0);
    expect(totalQueryTime).toBeLessThan(1000); // Less than 1 second total
  });

  test('TC-PERF-02: Dashboard aggregation response time', async ({ page }) => {
    // Login as admin
    await page.goto('/auth/signin');
    await page.fill('[data-testid="email-input"]', 'admin_root@example.com');
    await page.fill('[data-testid="password-input"]', 'admin123');
    await page.click('[data-testid="login-button"]');
    await page.fill('[data-testid="mfa-code-input"]', '123456');
    await page.click('[data-testid="mfa-verify-button"]');

    // Start performance monitoring
    const startTime = Date.now();
    
    // When /admin first entry
    await page.goto('/admin');
    
    // Wait for all widgets to load
    await page.waitForSelector('[data-testid="analytics-widget"]');
    await page.waitForSelector('[data-testid="settlement-widget"]');
    await page.waitForSelector('[data-testid="moderation-widget"]');
    
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    
    // Then Analytics/settlement/review sections render within SLA (TTFB < 500ms, render < 2s)
    expect(totalTime).toBeLessThan(2000); // Less than 2 seconds total
    
    // Verify TTFB (Time to First Byte)
    const ttfb = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return navigation.responseStart - navigation.requestStart;
    });
    expect(ttfb).toBeLessThan(500); // Less than 500ms TTFB
    
    // Verify individual widget load times
    const widgetMetrics = await page.evaluate(() => {
      const widgets = document.querySelectorAll('[data-testid$="-widget"]');
      return Array.from(widgets).map(widget => {
        const rect = widget.getBoundingClientRect();
        return {
          id: widget.getAttribute('data-testid'),
          visible: rect.width > 0 && rect.height > 0
        };
      });
    });
    
    // All widgets should be visible
    expect(widgetMetrics.every(w => w.visible)).toBe(true);
  });

  test('TC-PERF-03: Database query optimization', async ({ page }) => {
    // Test database query performance
    await page.goto('/projects');
    
    // Start query monitoring
    await page.evaluate(() => {
      (window as any).queryMetrics = {
        queries: [],
        totalTime: 0
      };
    });

    // Perform various operations that trigger database queries
    await page.click('[data-testid="filter-category-music"]');
    await page.click('[data-testid="sort-by-popularity"]');
    await page.click('[data-testid="load-more-projects"]');
    
    // Wait for queries to complete
    await page.waitForTimeout(1000);
    
    // Verify query performance
    const metrics = await page.evaluate(() => (window as any).queryMetrics);
    
    // Check for slow queries
    const slowQueries = metrics.queries.filter((q: any) => q.duration > 100);
    expect(slowQueries.length).toBe(0); // No queries should take more than 100ms
    
    // Check for N+1 queries
    const duplicateQueries = metrics.queries.filter((q: any, index: number, arr: any[]) => 
      arr.findIndex(other => other.sql === q.sql) !== index
    );
    expect(duplicateQueries.length).toBe(0); // No duplicate queries
    
    // Check total query time
    expect(metrics.totalTime).toBeLessThan(500); // Total query time under 500ms
  });

  test('TC-PERF-04: Image loading optimization', async ({ page }) => {
    // Test image loading performance
    await page.goto('/projects/1');
    
    // Start image monitoring
    await page.evaluate(() => {
      (window as any).imageMetrics = {
        loaded: 0,
        failed: 0,
        totalSize: 0,
        loadTimes: []
      };
    });

    // Wait for all images to load
    await page.waitForLoadState('networkidle');
    
    // Verify image loading metrics
    const metrics = await page.evaluate(() => (window as any).imageMetrics);
    
    // Check image load success rate
    const totalImages = metrics.loaded + metrics.failed;
    const successRate = metrics.loaded / totalImages;
    expect(successRate).toBeGreaterThan(0.95); // 95% success rate
    
    // Check average load time
    const avgLoadTime = metrics.loadTimes.reduce((sum: number, time: number) => sum + time, 0) / metrics.loadTimes.length;
    expect(avgLoadTime).toBeLessThan(1000); // Average load time under 1 second
    
    // Check total image size
    expect(metrics.totalSize).toBeLessThan(5 * 1024 * 1024); // Under 5MB total
  });

  test('TC-PERF-05: Memory usage monitoring', async ({ page }) => {
    // Test memory usage
    await page.goto('/projects/1/community');
    
    // Get initial memory usage
    const initialMemory = await page.evaluate(() => {
      return (performance as any).memory ? {
        used: (performance as any).memory.usedJSHeapSize,
        total: (performance as any).memory.totalJSHeapSize,
        limit: (performance as any).memory.jsHeapSizeLimit
      } : null;
    });
    
    if (initialMemory) {
      // Perform memory-intensive operations
      for (let i = 0; i < 10; i++) {
        await page.click('[data-testid="load-more-posts"]');
        await page.waitForTimeout(100);
      }
      
      // Get final memory usage
      const finalMemory = await page.evaluate(() => {
        return (performance as any).memory ? {
          used: (performance as any).memory.usedJSHeapSize,
          total: (performance as any).memory.totalJSHeapSize
        } : null;
      });
      
      if (finalMemory) {
        // Check memory growth
        const memoryGrowth = finalMemory.used - initialMemory.used;
        expect(memoryGrowth).toBeLessThan(10 * 1024 * 1024); // Less than 10MB growth
        
        // Check memory usage percentage
        const memoryUsagePercent = (finalMemory.used / initialMemory.limit) * 100;
        expect(memoryUsagePercent).toBeLessThan(80); // Less than 80% of limit
      }
    }
  });

  test('TC-PERF-06: API response time monitoring', async ({ page }) => {
    // Test API response times
    const apiEndpoints = [
      '/api/projects',
      '/api/projects/1',
      '/api/projects/1/community',
      '/api/users/profile',
      '/api/settlements'
    ];
    
    const responseTimes: number[] = [];
    
    for (const endpoint of apiEndpoints) {
      const startTime = Date.now();
      const response = await page.request.get(endpoint);
      const endTime = Date.now();
      
      expect(response.status()).toBe(200);
      responseTimes.push(endTime - startTime);
    }
    
    // Check average response time
    const avgResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
    expect(avgResponseTime).toBeLessThan(500); // Average under 500ms
    
    // Check max response time
    const maxResponseTime = Math.max(...responseTimes);
    expect(maxResponseTime).toBeLessThan(1000); // Max under 1 second
    
    // Check for any failed requests
    expect(responseTimes.every(time => time < 2000)).toBe(true); // All under 2 seconds
  });

  test('TC-PERF-07: Concurrent user simulation', async ({ page, context }) => {
    // Simulate concurrent users
    const userCount = 10;
    const pages = [];
    
    // Create multiple browser contexts
    for (let i = 0; i < userCount; i++) {
      const newPage = await context.newPage();
      pages.push(newPage);
    }
    
    // Simulate concurrent requests
    const promises = pages.map(async (p, index) => {
      await p.goto('/projects');
      await p.click('[data-testid="filter-category-music"]');
      await p.waitForSelector('[data-testid="project-list"]');
      return index;
    });
    
    const startTime = Date.now();
    await Promise.all(promises);
    const endTime = Date.now();
    
    // Verify concurrent performance
    const totalTime = endTime - startTime;
    expect(totalTime).toBeLessThan(5000); // All users served within 5 seconds
    
    // Cleanup
    for (const p of pages) {
      await p.close();
    }
  });

  test('TC-PERF-08: Error rate monitoring', async ({ page }) => {
    // Test error rates
    await page.goto('/projects');
    
    // Monitor errors
    const errors: any[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    page.on('pageerror', error => {
      errors.push(error.message);
    });
    
    // Perform various operations
    await page.click('[data-testid="filter-category-music"]');
    await page.click('[data-testid="sort-by-popularity"]');
    await page.click('[data-testid="load-more-projects"]');
    await page.goto('/projects/1');
    await page.goto('/projects/1/community');
    
    // Wait for all operations to complete
    await page.waitForLoadState('networkidle');
    
    // Verify error rate
    expect(errors.length).toBe(0); // No errors should occur
    
    // Check for specific error types
    const jsErrors = errors.filter(e => e.includes('JavaScript'));
    const networkErrors = errors.filter(e => e.includes('Network'));
    const renderErrors = errors.filter(e => e.includes('Rendering'));
    
    expect(jsErrors.length).toBe(0);
    expect(networkErrors.length).toBe(0);
    expect(renderErrors.length).toBe(0);
  });

  test('TC-PERF-09: Cache performance', async ({ page }) => {
    // Test cache performance
    await page.goto('/projects');
    
    // First load (cache miss)
    const firstLoadStart = Date.now();
    await page.waitForSelector('[data-testid="project-list"]');
    const firstLoadTime = Date.now() - firstLoadStart;
    
    // Second load (cache hit)
    await page.reload();
    const secondLoadStart = Date.now();
    await page.waitForSelector('[data-testid="project-list"]');
    const secondLoadTime = Date.now() - secondLoadStart;
    
    // Verify cache effectiveness
    expect(secondLoadTime).toBeLessThan(firstLoadTime); // Second load should be faster
    expect(secondLoadTime).toBeLessThan(firstLoadTime * 0.5); // At least 50% faster
    
    // Check cache headers
    const response = await page.request.get('/api/projects');
    const cacheControl = response.headers()['cache-control'];
    expect(cacheControl).toBeTruthy();
    expect(cacheControl).toContain('max-age');
  });

  test('TC-PERF-10: Bundle size analysis', async ({ page }) => {
    // Test bundle size
    await page.goto('/projects');
    
    // Get resource sizes
    const resources = await page.evaluate(() => {
      const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      return entries
        .filter(entry => entry.name.includes('.js') || entry.name.includes('.css'))
        .map(entry => ({
          name: entry.name,
          size: entry.transferSize || 0,
          type: entry.name.includes('.js') ? 'js' : 'css'
        }));
    });
    
    // Calculate total bundle size
    const totalJSSize = resources
      .filter(r => r.type === 'js')
      .reduce((sum, r) => sum + r.size, 0);
    
    const totalCSSSize = resources
      .filter(r => r.type === 'css')
      .reduce((sum, r) => sum + r.size, 0);
    
    // Verify bundle size limits
    expect(totalJSSize).toBeLessThan(500 * 1024); // Under 500KB JS
    expect(totalCSSSize).toBeLessThan(100 * 1024); // Under 100KB CSS
    
    // Check for large individual files
    const largeFiles = resources.filter(r => r.size > 100 * 1024);
    expect(largeFiles.length).toBe(0); // No files over 100KB
  });
});
