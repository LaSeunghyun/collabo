# E2E Test Suite

This directory contains comprehensive end-to-end tests for the Collaborium Platform, covering all major user flows and system functionality.

## Test Structure

### Test Files

- **`auth.spec.ts`** - Authentication and session management tests
- **`funding.spec.ts`** - Visitor/participant (fan) flow tests
- **`artist-communication.spec.ts`** - Artist communication and fan interaction tests
- **`admin.spec.ts`** - Admin management and moderation tests
- **`content-safety.spec.ts`** - Content safety and moderation tests
- **`settlement.spec.ts`** - Settlement and payment processing tests
- **`overfunding.spec.ts`** - Overfunding management and stretch goals tests
- **`performance.spec.ts`** - Performance and observability tests
- **`security.spec.ts`** - Security and data integrity tests
- **`regression.spec.ts`** - Comprehensive smoke tests for critical paths

### Test Fixtures

- **`fixtures/test-data.ts`** - Test data constants and mock data
- **`fixtures/test-helpers.ts`** - Reusable test helper functions
- **`fixtures/data-seeder.ts`** - Data seeding and cleanup utilities
- **`fixtures/global-setup.ts`** - Global test setup
- **`fixtures/global-teardown.ts`** - Global test cleanup

## Test Scenarios Covered

### 1. Authentication & Session Management
- Basic login with AT/RT rotation
- RT reuse (theft) detection
- Remember me sliding/absolute expiration
- Admin MFA + concurrent session limits

### 2. Visitor/Participant (Fan) Flow
- Project exploration → reward selection → payment success
- Payment failure retry
- Deadline failure automatic refund
- Community post creation/edit/delete/like/report
- Ticket distribution/QR entry
- Goods shipping tracking/return processing

### 3. Artist Communication Flow
- Backer-only update posting
- Follower public post + SNS sharing
- AMA schedule creation → pre-question collection → session end record posting
- Vote/survey (goods color selection) creation → fan voting → result disclosure
- Comment communication - pin/highlight/report handling
- Backer bulk broadcast (message) - opt-out compliance
- Media gallery (private original) upload → backer only disclosure
- Live announcement (urgent delay/change) - multi-channel notification
- Membership tier (support tier) exclusive posts
- Fan participation production log - transparency card
- Offline fan meeting invitation - ticket/QR integration
- Spam/bot defense - rate limit & content filter
- Moderation collaboration - artist unit action + admin escalation
- Communication performance dashboard (retention metrics)

### 4. Admin Management Flow
- Dashboard overview
- Project review approval/rejection
- Partner approval
- Report detailed review/action
- Settlement queue monitoring/payment confirmation
- Announcement creation/pin/scheduled publishing

### 5. Content Safety Management
- Profanity dictionary addition → real-time blocking
- Med rule → quarantine/approval
- Personal information pattern detection
- Rate limiting and spam prevention
- Report threshold auto-hide
- Regex pattern testing
- Policy configuration and enforcement
- Audit logs and reporting

### 6. Settlement Management
- Settling → Executing approval
- Payment failure → retry → Hold
- Reconciliation (diff) resolution
- Settlement calculation verification
- Multi-currency settlement handling
- Dispute handling and resolution
- Settlement report generation
- KYC verification and account validation

### 7. Overfunding Management
- 150% achievement → stretch goal mandatory
- Exception approval
- Stretch goal registration and approval
- Threshold configuration and template management
- Real-time threshold monitoring and alerts
- Exception management and expiration
- Reporting and analytics
- Edge cases and error handling

### 8. Performance & Observability
- Community feed N+1 prevention
- Dashboard aggregation response time
- Database query optimization
- Image loading optimization
- Memory usage monitoring
- API response time monitoring
- Concurrent user simulation
- Error rate monitoring
- Cache performance
- Bundle size analysis

### 9. Security & Data Integrity
- Project internal community access control
- Privilege escalation prevention
- File upload validation
- SQL injection prevention
- XSS prevention
- CSRF protection
- Rate limiting
- Session security
- Data encryption
- Input validation
- API authentication
- Data sanitization
- Audit logging
- Error handling

### 10. Regression Smoke Tests
- Complete user journey
- Artist communication flow
- Content safety features
- Settlement management
- Overfunding management
- Performance critical paths
- Error handling
- Mobile responsiveness
- Internationalization

## Running Tests

### Prerequisites

1. Install dependencies:
   ```bash
   npm install
   ```

2. Setup test environment:
   ```bash
   npm run test:setup
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

### Running All Tests

```bash
# Run all tests
npx playwright test

# Run tests in headed mode (for debugging)
npx playwright test --headed

# Run tests in debug mode
npx playwright test --debug
```

### Running Specific Test Suites

```bash
# Run authentication tests
npx playwright test auth.spec.ts

# Run funding tests
npx playwright test funding.spec.ts

# Run artist communication tests
npx playwright test artist-communication.spec.ts

# Run admin tests
npx playwright test admin.spec.ts

# Run content safety tests
npx playwright test content-safety.spec.ts

# Run settlement tests
npx playwright test settlement.spec.ts

# Run overfunding tests
npx playwright test overfunding.spec.ts

# Run performance tests
npx playwright test performance.spec.ts

# Run security tests
npx playwright test security.spec.ts

# Run regression tests
npx playwright test regression.spec.ts
```

### Running Tests by Tags

```bash
# Run critical path tests
TEST_TAGS="critical" npx playwright test

# Run payment tests
TEST_TAGS="payments" npx playwright test

# Run admin tests
TEST_TAGS="admin" npx playwright test

# Run community tests
TEST_TAGS="community" npx playwright test

# Run settlement tests
TEST_TAGS="settlement" npx playwright test

# Run auth tests
TEST_TAGS="auth" npx playwright test
```

### Running Tests in Different Browsers

```bash
# Run in Chrome
npx playwright test --project=chromium

# Run in Firefox
npx playwright test --project=firefox

# Run in Safari
npx playwright test --project=webkit

# Run in Mobile Chrome
npx playwright test --project="Mobile Chrome"

# Run in Mobile Safari
npx playwright test --project="Mobile Safari"
```

### Running Tests in CI

```bash
# Run tests in CI mode
npx playwright test --project=chromium --reporter=html

# Run tests with coverage
npx playwright test --project=chromium --reporter=html,json

# Run tests in parallel
npx playwright test --workers=4
```

## Test Configuration

### Environment Variables

```bash
# Test database URL
TEST_DATABASE_URL=postgresql://test:test@localhost:5432/test_collabo

# Test Redis URL
TEST_REDIS_URL=redis://localhost:6379

# Base URL for tests
BASE_URL=http://localhost:3000

# Test tags filter
TEST_TAGS=critical,payments

# Test timeout
TEST_TIMEOUT=30000
```

### Test Data

Test data is managed through the `fixtures/test-data.ts` file and seeded using the `DataSeeder` class. The test data includes:

- Test users (fan, artist, partner, admin)
- Test projects (music, exhibition)
- Test partners (studio, venue)
- Test settlements
- Test content (posts, comments)
- Test safety rules
- Test overfunding configuration

### Test Helpers

The `TestHelper` class provides utility functions for common test operations:

- User authentication
- Project creation
- Payment processing
- Content creation
- Admin actions
- Safety rule management
- Overfunding configuration
- Performance monitoring
- Security testing

## Test Reports

Test results are generated in multiple formats:

- **HTML Report**: `playwright-report/index.html`
- **JSON Report**: `test-results/results.json`
- **JUnit Report**: `test-results/results.xml`
- **Screenshots**: `test-results/screenshots/`
- **Videos**: `test-results/videos/`
- **Traces**: `test-results/traces/`

## Debugging Tests

### Debug Mode

```bash
# Run specific test in debug mode
npx playwright test auth.spec.ts --debug

# Run test with browser dev tools
npx playwright test auth.spec.ts --headed --debug
```

### Screenshots and Videos

Screenshots are automatically taken on test failures. Videos are recorded for failed tests when running in headed mode.

### Traces

Traces are automatically generated for failed tests and can be viewed using:

```bash
npx playwright show-trace test-results/traces/trace.zip
```

## Best Practices

1. **Test Isolation**: Each test should be independent and not rely on other tests
2. **Data Cleanup**: Always clean up test data after tests complete
3. **Error Handling**: Test both success and failure scenarios
4. **Performance**: Monitor test execution time and optimize slow tests
5. **Security**: Test security vulnerabilities and edge cases
6. **Accessibility**: Ensure tests cover accessibility requirements
7. **Mobile**: Test on both desktop and mobile viewports
8. **Internationalization**: Test with different languages and locales

## Troubleshooting

### Common Issues

1. **Test Timeouts**: Increase timeout values in `playwright.config.ts`
2. **Flaky Tests**: Use `waitFor` methods instead of fixed timeouts
3. **Database Issues**: Ensure test database is properly reset between tests
4. **Network Issues**: Mock external API calls for consistent testing
5. **Browser Issues**: Update browser versions and clear browser cache

### Debug Commands

```bash
# Show test results
npx playwright show-report

# Show traces
npx playwright show-trace test-results/traces/trace.zip

# Run tests with verbose output
npx playwright test --verbose

# Run tests with specific browser
npx playwright test --project=chromium --headed
```

## Contributing

When adding new tests:

1. Follow the existing test structure and naming conventions
2. Add appropriate test data to `fixtures/test-data.ts`
3. Use helper functions from `fixtures/test-helpers.ts`
4. Add proper cleanup in teardown functions
5. Document new test scenarios in this README
6. Ensure tests are deterministic and reliable
7. Add appropriate test tags for categorization
8. Include both positive and negative test cases
