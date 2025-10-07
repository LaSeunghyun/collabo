// Data seeder for E2E tests
import { Page } from '@playwright/test';
import { testUsers, testProjects, testPartners, testSettlements, testContent, testSafetyRules, testOverfunding } from './test-data';

export class DataSeeder {
  constructor(private page: Page) {}

  async seedUsers() {
    // Seed test users via API
    for (const [key, user] of Object.entries(testUsers)) {
      await this.page.request.post('/api/test/seed/users', {
        data: {
          ...user,
          id: key
        }
      });
    }
  }

  async seedProjects() {
    // Seed test projects
    for (const [key, project] of Object.entries(testProjects)) {
      await this.page.request.post('/api/test/seed/projects', {
        data: {
          ...project,
          id: key
        }
      });
    }
  }

  async seedPartners() {
    // Seed test partners
    for (const [key, partner] of Object.entries(testPartners)) {
      await this.page.request.post('/api/test/seed/partners', {
        data: {
          ...partner,
          id: key
        }
      });
    }
  }

  async seedSettlements() {
    // Seed test settlements
    for (const [key, settlement] of Object.entries(testSettlements)) {
      await this.page.request.post('/api/test/seed/settlements', {
        data: {
          ...settlement,
          id: key
        }
      });
    }
  }

  async seedContent() {
    // Seed test content
    await this.page.request.post('/api/test/seed/content', {
      data: {
        posts: testContent.posts,
        comments: testContent.comments
      }
    });
  }

  async seedSafetyRules() {
    // Seed safety rules
    await this.page.request.post('/api/test/seed/safety', {
      data: {
        profanity: testSafetyRules.profanity,
        advertising: testSafetyRules.advertising,
        pii: testSafetyRules.pii
      }
    });
  }

  async seedOverfundingConfig() {
    // Seed overfunding configuration
    await this.page.request.post('/api/test/seed/overfunding', {
      data: {
        thresholds: testOverfunding.thresholds,
        stretchGoals: testOverfunding.stretchGoals,
        exceptions: testOverfunding.exceptions
      }
    });
  }

  async seedAll() {
    // Seed all test data
    await this.seedUsers();
    await this.seedProjects();
    await this.seedPartners();
    await this.seedSettlements();
    await this.seedContent();
    await this.seedSafetyRules();
    await this.seedOverfundingConfig();
  }

  async clearAll() {
    // Clear all test data
    await this.page.request.post('/api/test/clear');
  }

  async resetDatabase() {
    // Reset database to clean state
    await this.clearAll();
    await this.seedAll();
  }

  async createTestProject(projectData: any) {
    // Create a specific test project
    const response = await this.page.request.post('/api/test/seed/projects', {
      data: projectData
    });
    return response.json();
  }

  async createTestUser(userData: any) {
    // Create a specific test user
    const response = await this.page.request.post('/api/test/seed/users', {
      data: userData
    });
    return response.json();
  }

  async createTestSettlement(settlementData: any) {
    // Create a specific test settlement
    const response = await this.page.request.post('/api/test/seed/settlements', {
      data: settlementData
    });
    return response.json();
  }

  async updateProjectStatus(projectId: number, status: string) {
    // Update project status
    await this.page.request.patch(`/api/test/projects/${projectId}/status`, {
      data: { status }
    });
  }

  async updateSettlementStatus(settlementId: number, status: string) {
    // Update settlement status
    await this.page.request.patch(`/api/test/settlements/${settlementId}/status`, {
      data: { status }
    });
  }

  async simulatePayment(projectId: number, amount: number, status: string = 'succeeded') {
    // Simulate payment
    await this.page.request.post(`/api/test/projects/${projectId}/payment`, {
      data: { amount, status }
    });
  }

  async simulateRefund(projectId: number, amount: number) {
    // Simulate refund
    await this.page.request.post(`/api/test/projects/${projectId}/refund`, {
      data: { amount }
    });
  }

  async simulateOverfunding(projectId: number, percentage: number) {
    // Simulate overfunding
    await this.page.request.post(`/api/test/projects/${projectId}/overfunding`, {
      data: { percentage }
    });
  }

  async simulateDeadline(projectId: number) {
    // Simulate project deadline
    await this.page.request.post(`/api/test/projects/${projectId}/deadline`);
  }

  async simulateReport(contentId: string, reason: string) {
    // Simulate content report
    await this.page.request.post(`/api/test/content/${contentId}/report`, {
      data: { reason }
    });
  }

  async simulateMFA(userId: string, enabled: boolean) {
    // Simulate MFA setup
    await this.page.request.patch(`/api/test/users/${userId}/mfa`, {
      data: { enabled }
    });
  }

  async simulateSessionExpiry(userId: string) {
    // Simulate session expiry
    await this.page.request.post(`/api/test/users/${userId}/expire-session`);
  }

  async simulateRateLimit(endpoint: string) {
    // Simulate rate limiting
    await this.page.request.post(`/api/test/rate-limit/${endpoint}`);
  }

  async simulateAPIError(endpoint: string, status: number) {
    // Simulate API error
    await this.page.request.post(`/api/test/error/${endpoint}`, {
      data: { status }
    });
  }

  async simulateNetworkDelay(delay: number) {
    // Simulate network delay
    await this.page.request.post('/api/test/delay', {
      data: { delay }
    });
  }

  async simulateFileUpload(filePath: string, type: string) {
    // Simulate file upload
    const response = await this.page.request.post('/api/test/upload', {
      data: { filePath, type }
    });
    return response.json();
  }

  async simulateEmailSend(to: string, subject: string, content: string) {
    // Simulate email sending
    await this.page.request.post('/api/test/email', {
      data: { to, subject, content }
    });
  }

  async simulatePushNotification(userId: string, title: string, body: string) {
    // Simulate push notification
    await this.page.request.post('/api/test/push', {
      data: { userId, title, body }
    });
  }

  async simulateInAppNotification(userId: string, type: string, data: any) {
    // Simulate in-app notification
    await this.page.request.post('/api/test/notification', {
      data: { userId, type, data }
    });
  }

  async simulateSMS(phone: string, message: string) {
    // Simulate SMS sending
    await this.page.request.post('/api/test/sms', {
      data: { phone, message }
    });
  }

  async simulateWebhook(url: string, payload: any) {
    // Simulate webhook call
    await this.page.request.post('/api/test/webhook', {
      data: { url, payload }
    });
  }

  async simulateDatabaseError(table: string) {
    // Simulate database error
    await this.page.request.post('/api/test/db-error', {
      data: { table }
    });
  }

  async simulateCacheMiss(key: string) {
    // Simulate cache miss
    await this.page.request.post('/api/test/cache-miss', {
      data: { key }
    });
  }

  async simulateCacheHit(key: string) {
    // Simulate cache hit
    await this.page.request.post('/api/test/cache-hit', {
      data: { key }
    });
  }

  async simulateConcurrentUsers(count: number) {
    // Simulate concurrent users
    await this.page.request.post('/api/test/concurrent', {
      data: { count }
    });
  }

  async simulateHighLoad() {
    // Simulate high load
    await this.page.request.post('/api/test/load');
  }

  async simulateMemoryLeak() {
    // Simulate memory leak
    await this.page.request.post('/api/test/memory-leak');
  }

  async simulateSlowQuery() {
    // Simulate slow database query
    await this.page.request.post('/api/test/slow-query');
  }

  async simulateTimeout() {
    // Simulate request timeout
    await this.page.request.post('/api/test/timeout');
  }

  async simulatePartialFailure() {
    // Simulate partial system failure
    await this.page.request.post('/api/test/partial-failure');
  }

  async simulateFullFailure() {
    // Simulate complete system failure
    await this.page.request.post('/api/test/full-failure');
  }

  async restoreSystem() {
    // Restore system to normal state
    await this.page.request.post('/api/test/restore');
  }

  async getSystemStatus() {
    // Get system status
    const response = await this.page.request.get('/api/test/status');
    return response.json();
  }

  async getTestData(type: string) {
    // Get test data by type
    const response = await this.page.request.get(`/api/test/data/${type}`);
    return response.json();
  }

  async cleanupTestData() {
    // Cleanup test data
    await this.page.request.delete('/api/test/cleanup');
  }

  async generateTestReport() {
    // Generate test report
    const response = await this.page.request.get('/api/test/report');
    return response.json();
  }

  async exportTestData() {
    // Export test data
    const response = await this.page.request.get('/api/test/export');
    return response.json();
  }

  async importTestData(data: any) {
    // Import test data
    await this.page.request.post('/api/test/import', {
      data
    });
  }

  async validateTestData() {
    // Validate test data integrity
    const response = await this.page.request.get('/api/test/validate');
    return response.json();
  }

  async resetTestEnvironment() {
    // Reset test environment
    await this.page.request.post('/api/test/reset');
  }

  async setupTestEnvironment() {
    // Setup test environment
    await this.page.request.post('/api/test/setup');
  }

  async teardownTestEnvironment() {
    // Teardown test environment
    await this.page.request.post('/api/test/teardown');
  }
}
