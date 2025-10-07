// Test helper functions for E2E tests
import { Page, expect } from '@playwright/test';
import { testUsers, testProjects, testConfig } from './test-data';

export class TestHelper {
  constructor(private page: Page) {}

  async loginAs(user: keyof typeof testUsers) {
    const userData = testUsers[user];
    await this.page.goto('/auth/signin');
    await this.page.fill('[data-testid="email-input"]', userData.email);
    await this.page.fill('[data-testid="password-input"]', userData.password);
    await this.page.click('[data-testid="login-button"]');
    
    if (userData.mfaEnabled) {
      await this.page.fill('[data-testid="mfa-code-input"]', '123456');
      await this.page.click('[data-testid="mfa-verify-button"]');
    }
    
    await expect(this.page).toHaveURL('/');
  }

  async logout() {
    await this.page.click('[data-testid="user-menu"]');
    await this.page.click('[data-testid="logout-button"]');
    await expect(this.page).toHaveURL('/auth/signin');
  }

  async createProject(projectData: any) {
    await this.page.goto('/projects/new');
    await this.page.fill('[data-testid="project-title"]', projectData.title);
    await this.page.fill('[data-testid="project-description"]', projectData.description);
    await this.page.fill('[data-testid="project-goal"]', projectData.goal.toString());
    await this.page.fill('[data-testid="project-deadline"]', projectData.deadline);
    await this.page.click('[data-testid="submit-project"]');
    
    await expect(this.page.locator('[data-testid="project-created"]')).toBeVisible();
  }

  async makePayment(projectId: number, rewardId: number, cardData: any) {
    await this.page.goto(`/projects/${projectId}`);
    await this.page.click(`[data-testid="reward-${rewardId}"]`);
    await this.page.click('[data-testid="select-reward-button"]');
    
    await this.page.fill('[data-testid="card-number"]', cardData.number);
    await this.page.fill('[data-testid="card-expiry"]', cardData.expiry);
    await this.page.fill('[data-testid="card-cvc"]', cardData.cvc);
    await this.page.fill('[data-testid="card-name"]', cardData.name);
    
    await this.page.click('[data-testid="payment-submit-button"]');
  }

  async createPost(content: string, visibility: string = 'PUBLIC') {
    await this.page.click('[data-testid="new-post-button"]');
    await this.page.fill('[data-testid="post-content"]', content);
    await this.page.selectOption('[data-testid="visibility-select"]', visibility);
    await this.page.click('[data-testid="submit-post-button"]');
  }

  async reportContent(contentId: string, reason: string) {
    await this.page.click(`[data-testid="report-${contentId}"]`);
    await this.page.selectOption('[data-testid="report-reason"]', reason);
    await this.page.fill('[data-testid="report-details"]', 'Test report');
    await this.page.click('[data-testid="submit-report-button"]');
  }

  async approveProject(projectId: number) {
    await this.page.goto('/admin/projects');
    await this.page.click(`[data-testid="project-${projectId}-row"]`);
    await this.page.click('[data-testid="approve-project-button"]');
    await this.page.fill('[data-testid="approval-notes"]', 'Project approved');
    await this.page.click('[data-testid="confirm-approval"]');
  }

  async approveSettlement(settlementId: number) {
    await this.page.goto('/admin/settlements');
    await this.page.click(`[data-testid="settlement-${settlementId}-row"]`);
    await this.page.click('[data-testid="approve-settlement-button"]');
    await this.page.fill('[data-testid="approval-notes"]', 'Settlement approved');
    await this.page.click('[data-testid="confirm-approval"]');
  }

  async addSafetyRule(rule: any) {
    await this.page.goto('/admin/safety');
    await this.page.click('[data-testid="add-word-button"]');
    await this.page.fill('[data-testid="word-input"]', rule.word);
    await this.page.selectOption('[data-testid="category-select"]', rule.category);
    await this.page.selectOption('[data-testid="severity-select"]', rule.severity);
    await this.page.selectOption('[data-testid="action-select"]', rule.action);
    await this.page.click('[data-testid="add-word-submit"]');
  }

  async configureOverfundingThreshold(percent: number, config: any) {
    await this.page.goto('/admin/funding-policy');
    await this.page.click('[data-testid="thresholds-tab"]');
    await this.page.click(`[data-testid="edit-threshold-${percent}"]`);
    
    if (config.requireStretchGoal) {
      await this.page.check('[data-testid="require-stretch-goal"]');
    }
    if (config.paymentRestriction) {
      await this.page.check('[data-testid="payment-restriction"]');
    }
    
    await this.page.selectOption('[data-testid="banner-template"]', config.bannerTemplate);
    await this.page.click('[data-testid="save-threshold"]');
  }

  async simulateEvent(eventType: string, data: any = {}) {
    await this.page.evaluate(({ eventType, data }) => {
      window.localStorage.setItem(`simulate_${eventType}`, JSON.stringify(data));
    }, { eventType, data });
  }

  async waitForNotification(type: string) {
    await expect(this.page.locator(`[data-testid="${type}-notification"]`)).toBeVisible();
  }

  async verifyApiCall(endpoint: string, method: string = 'GET') {
    const response = await this.page.waitForResponse(response => 
      response.url().includes(endpoint) && response.request().method() === method
    );
    return response;
  }

  async takeScreenshot(name: string) {
    await this.page.screenshot({ 
      path: `${testConfig.screenshotPath}/${name}.png`,
      fullPage: true 
    });
  }

  async clearStorage() {
    await this.page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  }

  async mockApiResponse(endpoint: string, response: any) {
    await this.page.route(endpoint, route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(response)
      });
    });
  }

  async mockApiError(endpoint: string, status: number = 500) {
    await this.page.route(endpoint, route => {
      route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'API Error' })
      });
    });
  }

  async waitForElement(selector: string, timeout: number = 10000) {
    await this.page.waitForSelector(selector, { timeout });
  }

  async waitForText(text: string, timeout: number = 10000) {
    await this.page.waitForFunction(
      (text) => document.body.textContent?.includes(text),
      text,
      { timeout }
    );
  }

  async verifyElementExists(selector: string) {
    await expect(this.page.locator(selector)).toBeVisible();
  }

  async verifyElementNotExists(selector: string) {
    await expect(this.page.locator(selector)).not.toBeVisible();
  }

  async verifyTextContent(selector: string, text: string) {
    await expect(this.page.locator(selector)).toContainText(text);
  }

  async verifyElementCount(selector: string, count: number) {
    await expect(this.page.locator(selector)).toHaveCount(count);
  }

  async verifyUrl(url: string) {
    await expect(this.page).toHaveURL(url);
  }

  async verifyTitle(title: string) {
    await expect(this.page).toHaveTitle(title);
  }

  async scrollToElement(selector: string) {
    await this.page.locator(selector).scrollIntoViewIfNeeded();
  }

  async clickAndWait(selector: string, waitForSelector?: string) {
    await this.page.click(selector);
    if (waitForSelector) {
      await this.waitForElement(waitForSelector);
    }
  }

  async fillAndSubmit(formData: Record<string, string>) {
    for (const [selector, value] of Object.entries(formData)) {
      await this.page.fill(selector, value);
    }
    await this.page.click('[data-testid="submit-button"]');
  }

  async selectOptionAndWait(selector: string, value: string, waitForSelector?: string) {
    await this.page.selectOption(selector, value);
    if (waitForSelector) {
      await this.waitForElement(waitForSelector);
    }
  }

  async uploadFile(selector: string, filePath: string) {
    await this.page.setInputFiles(selector, filePath);
  }

  async waitForApiResponse(endpoint: string) {
    return await this.page.waitForResponse(response => 
      response.url().includes(endpoint)
    );
  }

  async verifyApiResponse(endpoint: string, expectedStatus: number) {
    const response = await this.waitForApiResponse(endpoint);
    expect(response.status()).toBe(expectedStatus);
    return response;
  }

  async verifyApiResponseBody(endpoint: string, expectedBody: any) {
    const response = await this.waitForApiResponse(endpoint);
    const body = await response.json();
    expect(body).toEqual(expectedBody);
    return body;
  }

  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle');
  }

  async waitForNavigation() {
    await this.page.waitForNavigation();
  }

  async reloadPage() {
    await this.page.reload();
  }

  async goBack() {
    await this.page.goBack();
  }

  async goForward() {
    await this.page.goForward();
  }

  async getElementText(selector: string) {
    return await this.page.locator(selector).textContent();
  }

  async getElementValue(selector: string) {
    return await this.page.locator(selector).inputValue();
  }

  async isElementVisible(selector: string) {
    return await this.page.locator(selector).isVisible();
  }

  async isElementEnabled(selector: string) {
    return await this.page.locator(selector).isEnabled();
  }

  async isElementChecked(selector: string) {
    return await this.page.locator(selector).isChecked();
  }

  async getElementAttribute(selector: string, attribute: string) {
    return await this.page.locator(selector).getAttribute(attribute);
  }

  async getElementCount(selector: string) {
    return await this.page.locator(selector).count();
  }

  async hoverElement(selector: string) {
    await this.page.locator(selector).hover();
  }

  async doubleClickElement(selector: string) {
    await this.page.locator(selector).dblclick();
  }

  async rightClickElement(selector: string) {
    await this.page.locator(selector).click({ button: 'right' });
  }

  async pressKey(key: string) {
    await this.page.keyboard.press(key);
  }

  async typeText(text: string) {
    await this.page.keyboard.type(text);
  }

  async clearInput(selector: string) {
    await this.page.locator(selector).clear();
  }

  async focusElement(selector: string) {
    await this.page.locator(selector).focus();
  }

  async blurElement(selector: string) {
    await this.page.locator(selector).blur();
  }

  async selectAllText(selector: string) {
    await this.page.locator(selector).selectText();
  }

  async copyToClipboard() {
    await this.page.keyboard.press('Control+c');
  }

  async pasteFromClipboard() {
    await this.page.keyboard.press('Control+v');
  }

  async undo() {
    await this.page.keyboard.press('Control+z');
  }

  async redo() {
    await this.page.keyboard.press('Control+y');
  }

  async savePage() {
    await this.page.keyboard.press('Control+s');
  }

  async openDevTools() {
    await this.page.keyboard.press('F12');
  }

  async refreshPage() {
    await this.page.keyboard.press('F5');
  }

  async closeTab() {
    await this.page.keyboard.press('Control+w');
  }

  async newTab() {
    await this.page.keyboard.press('Control+t');
  }

  async switchTab(index: number) {
    await this.page.keyboard.press(`Control+${index}`);
  }

  async zoomIn() {
    await this.page.keyboard.press('Control+=');
  }

  async zoomOut() {
    await this.page.keyboard.press('Control+-');
  }

  async resetZoom() {
    await this.page.keyboard.press('Control+0');
  }

  async fullScreen() {
    await this.page.keyboard.press('F11');
  }

  async findText(text: string) {
    await this.page.keyboard.press('Control+f');
    await this.page.keyboard.type(text);
  }

  async findNext() {
    await this.page.keyboard.press('F3');
  }

  async findPrevious() {
    await this.page.keyboard.press('Shift+F3');
  }

  async closeFind() {
    await this.page.keyboard.press('Escape');
  }
}
