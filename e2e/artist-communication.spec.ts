import { test, expect } from '@playwright/test';

test.describe('Artist Communication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login as artist_ko before each test
    await page.goto('/auth/signin');
    await page.fill('[data-testid="email-input"]', 'artist_ko@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await expect(page).toHaveURL('/');
  });

  test('TC-ART-COMM-01: Backer-only update posting', async ({ page }) => {
    // Given artist_ko logged in, successful or ongoing project with at least 1 backer
    await page.goto('/artist/dashboard');
    await expect(page.locator('[data-testid="artist-dashboard"]')).toBeVisible();
    
    // Navigate to project management
    await page.click('[data-testid="project-management-tab"]');
    await page.click('[data-testid="project-1-edit"]');
    
    // When artist page → "Write Update" → title/content/image attachment → visibility 'Backers Only' → post
    await page.click('[data-testid="write-update-button"]');
    await page.fill('[data-testid="update-title"]', 'Backer-only Update');
    await page.fill('[data-testid="update-content"]', 'This is a special update for our backers only!');
    
    // Upload image
    await page.setInputFiles('[data-testid="image-upload"]', 'test-files/sample-image.jpg');
    
    // Select backers only visibility
    await page.selectOption('[data-testid="visibility-select"]', 'BACKERS_ONLY');
    await page.click('[data-testid="publish-update-button"]');
    
    // Then post created in project community with visibility=BACKERS_ONLY
    await expect(page.locator('[data-testid="update-success"]')).toBeVisible();
    
    // Verify backer can see the content
    await page.goto('/projects/1/community');
    await expect(page.locator('[data-testid="backer-only-update"]')).toBeVisible();
    await expect(page.locator('[data-testid="update-content"]')).toContainText('This is a special update for our backers only!');
    
    // Verify non-backer/non-logged in users get 403 and "Backers Only" notice
    await page.context().clearCookies();
    await page.goto('/projects/1/community');
    await expect(page.locator('[data-testid="access-restricted"]')).toBeVisible();
    await expect(page.locator('[data-testid="backers-only-notice"]')).toContainText('Backers Only');
    
    // Verify update notification sent only to backers
    const notifications = await page.evaluate(() => 
      window.localStorage.getItem('backer_notifications')
    );
    expect(notifications).toContain('update_published');
  });

  test('TC-ART-COMM-02: Follower public post + SNS sharing', async ({ page }) => {
    // Given follow feature is active and artist_ko has followers
    await page.goto('/artist/dashboard');
    await page.click('[data-testid="write-post-button"]');
    
    // When artist page → "Write Post" → visibility 'Follower Public' → post → share button for SNS sharing link
    await page.fill('[data-testid="post-title"]', 'Public Post for Followers');
    await page.fill('[data-testid="post-content"]', 'This is a public post for my followers!');
    await page.selectOption('[data-testid="visibility-select"]', 'FOLLOWERS_ONLY');
    await page.click('[data-testid="publish-post-button"]');
    
    // Generate SNS sharing link
    await page.click('[data-testid="share-button"]');
    const shareLink = await page.locator('[data-testid="share-link"]').inputValue();
    
    // Then follower can see normally
    await page.goto('/artist/artist_ko/posts');
    await expect(page.locator('[data-testid="follower-post"]')).toBeVisible();
    
    // Verify non-follower sees follow inducement banner with summary only or access restriction
    await page.context().clearCookies();
    await page.goto('/artist/artist_ko/posts');
    await expect(page.locator('[data-testid="follow-banner"]')).toBeVisible();
    await expect(page.locator('[data-testid="post-summary"]')).toBeVisible();
    
    // Verify share link click shows teaser only for non-followers, login+follow required for full content
    await page.goto(shareLink);
    await expect(page.locator('[data-testid="teaser-content"]')).toBeVisible();
    await expect(page.locator('[data-testid="login-prompt"]')).toBeVisible();
  });

  test('TC-ART-COMM-03: AMA schedule creation → pre-question collection → session end record posting', async ({ page }) => {
    // Given artist page AMA feature available
    await page.goto('/artist/dashboard');
    await page.click('[data-testid="ama-management-tab"]');
    
    // When AMA schedule creation (date/time/description), question collection ON
    await page.click('[data-testid="create-ama-button"]');
    await page.fill('[data-testid="ama-title"]', 'Q&A Session with Artist');
    await page.fill('[data-testid="ama-description"]', 'Ask me anything about my music!');
    await page.fill('[data-testid="ama-date"]', '2024-12-25');
    await page.fill('[data-testid="ama-time"]', '19:00');
    await page.check('[data-testid="pre-question-enabled"]');
    await page.click('[data-testid="create-ama-submit"]');
    
    // Simulate fan questions
    await page.evaluate(() => {
      window.localStorage.setItem('simulate_fan_questions', JSON.stringify([
        { id: 1, question: 'What inspired your latest song?', user: 'fan1' },
        { id: 2, question: 'When is your next concert?', user: 'fan2' }
      ]));
    });
    
    // Simulate session time arrival → progress → answer check/arrangement
    await page.evaluate(() => {
      window.localStorage.setItem('simulate_ama_session_start', 'true');
    });
    
    await page.click('[data-testid="start-ama-session"]');
    
    // Answer questions
    await page.fill('[data-testid="answer-1"]', 'My latest song was inspired by my travels in Japan.');
    await page.click('[data-testid="mark-answered-1"]');
    
    await page.fill('[data-testid="answer-2"]', 'My next concert is scheduled for March 2024.');
    await page.click('[data-testid="mark-answered-2"]');
    
    // Session end → record posting
    await page.click('[data-testid="end-ama-session"]');
    await page.click('[data-testid="publish-ama-record"]');
    
    // Then AMA event appears in calendar/timeline, D-1/D-0 push sent
    await expect(page.locator('[data-testid="ama-calendar-event"]')).toBeVisible();
    
    // Verify questions are posted after spam/profanity filter pass → 'Answered' label during progress
    await expect(page.locator('[data-testid="question-1"]')).toContainText('Answered');
    await expect(page.locator('[data-testid="question-2"]')).toContainText('Answered');
    
    // Verify record posted as post with timestamp/answer mapping maintained
    await page.goto('/artist/artist_ko/posts');
    await expect(page.locator('[data-testid="ama-record-post"]')).toBeVisible();
    await expect(page.locator('[data-testid="ama-answers"]')).toBeVisible();
  });

  test('TC-ART-COMM-04: Vote/survey (goods color selection) creation → fan voting → result disclosure', async ({ page }) => {
    // Given voting module active, backer/follower target selection possible
    await page.goto('/artist/dashboard');
    await page.click('[data-testid="voting-management-tab"]');
    
    // When vote creation (question, options N, deadline, visibility range)
    await page.click('[data-testid="create-vote-button"]');
    await page.fill('[data-testid="vote-question"]', 'Which color should our merchandise be?');
    await page.fill('[data-testid="vote-option-1"]', 'Red');
    await page.fill('[data-testid="vote-option-2"]', 'Blue');
    await page.fill('[data-testid="vote-option-3"]', 'Green');
    await page.fill('[data-testid="vote-deadline"]', '2024-12-30');
    await page.selectOption('[data-testid="vote-target"]', 'BACKERS_ONLY');
    await page.click('[data-testid="create-vote-submit"]');
    
    // Simulate multiple fan voting
    await page.evaluate(() => {
      window.localStorage.setItem('simulate_vote_participation', JSON.stringify([
        { user: 'fan1', option: 'Red' },
        { user: 'fan2', option: 'Blue' },
        { user: 'fan3', option: 'Red' },
        { user: 'fan4', option: 'Green' }
      ]));
    });
    
    // Simulate deadline arrival
    await page.evaluate(() => {
      window.localStorage.setItem('simulate_vote_deadline', 'true');
    });
    
    await page.click('[data-testid="check-vote-results"]');
    
    // Then non-vote target users cannot vote or see results only (according to settings)
    await page.context().clearCookies();
    await page.goto('/projects/1/vote/1');
    await expect(page.locator('[data-testid="vote-restricted"]')).toBeVisible();
    
    // Verify duplicate vote prevention (account/device/fingerprint minimum account level guaranteed)
    await page.goto('/auth/signin');
    await page.fill('[data-testid="email-input"]', 'fan1@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');
    
    await page.goto('/projects/1/vote/1');
    await page.click('[data-testid="vote-option-red"]');
    await page.click('[data-testid="submit-vote"]');
    
    // Try to vote again
    await page.click('[data-testid="vote-option-blue"]');
    await page.click('[data-testid="submit-vote"]');
    await expect(page.locator('[data-testid="duplicate-vote-error"]')).toBeVisible();
    
    // Verify result percentage sum=100%, result fixed after deadline
    await expect(page.locator('[data-testid="vote-result-red"]')).toContainText('50%');
    await expect(page.locator('[data-testid="vote-result-blue"]')).toContainText('25%');
    await expect(page.locator('[data-testid="vote-result-green"]')).toContainText('25%');
  });

  test('TC-ART-COMM-05: Comment communication - pin/highlight/report handling', async ({ page }) => {
    // Given artist-written update or post exists
    await page.goto('/artist/dashboard');
    await page.click('[data-testid="write-update-button"]');
    await page.fill('[data-testid="update-title"]', 'Test Update');
    await page.fill('[data-testid="update-content"]', 'This is a test update for comments.');
    await page.click('[data-testid="publish-update-button"]');
    
    // Simulate fan comments
    await page.evaluate(() => {
      window.localStorage.setItem('simulate_fan_comments', JSON.stringify([
        { id: 1, content: 'Great update!', user: 'fan1', type: 'positive' },
        { id: 2, content: 'This is spam content', user: 'fan2', type: 'spam' },
        { id: 3, content: 'Amazing work!', user: 'fan3', type: 'positive' }
      ]));
    });
    
    await page.goto('/projects/1/community/post/1');
    
    // When fan writes comment → artist 'pin' or 'highlight' designation
    await page.click('[data-testid="pin-comment-1"]');
    await page.click('[data-testid="highlight-comment-3"]');
    
    // Simulate other fan reporting abusive comment
    await page.evaluate(() => {
      window.localStorage.setItem('simulate_comment_reports', JSON.stringify([
        { commentId: 2, reports: 3, reason: 'spam' }
      ]));
    });
    
    await page.click('[data-testid="report-comment-2"]');
    await page.selectOption('[data-testid="report-reason"]', 'spam');
    await page.click('[data-testid="submit-report"]');
    
    // Then pinned/highlighted comments are visually emphasized at top
    await expect(page.locator('[data-testid="pinned-comment-1"]')).toHaveClass(/pinned/);
    await expect(page.locator('[data-testid="highlighted-comment-3"]')).toHaveClass(/highlighted/);
    
    // Verify report threshold reached → comment auto hide (HIDDEN) → admin queue entry
    await expect(page.locator('[data-testid="hidden-comment-2"]')).toHaveClass(/hidden/);
    
    // Verify artist can hide/delete comments on own content within policy limits
    await page.click('[data-testid="hide-comment-2"]');
    await expect(page.locator('[data-testid="comment-2"]')).not.toBeVisible();
  });

  test('TC-ART-COMM-06: Backer bulk broadcast (message) - opt-out compliance', async ({ page }) => {
    // Given project backer segment exists and some users have message opt-out
    await page.goto('/artist/dashboard');
    await page.click('[data-testid="broadcast-management-tab"]');
    
    // When artist page → broadcast writing → target 'This project backers' → send
    await page.click('[data-testid="create-broadcast-button"]');
    await page.fill('[data-testid="broadcast-subject"]', 'Important Project Update');
    await page.fill('[data-testid="broadcast-content"]', 'Thank you for your support! Here is an important update about our project.');
    await page.selectOption('[data-testid="broadcast-target"]', 'PROJECT_BACKERS');
    await page.click('[data-testid="send-broadcast-button"]');
    
    // Then message sent only to opt-in users
    const broadcastResults = await page.evaluate(() => 
      window.localStorage.getItem('broadcast_results')
    );
    const results = JSON.parse(broadcastResults || '{}');
    expect(results.sent).toBeGreaterThan(0);
    expect(results.optOut).toBeGreaterThan(0);
    
    // Verify send result report with success/failure/opt-out count aggregation
    await expect(page.locator('[data-testid="broadcast-report"]')).toContainText(`Sent: ${results.sent}`);
    await expect(page.locator('[data-testid="broadcast-report"]')).toContainText(`Opt-out: ${results.optOut}`);
    
    // Verify link click/open events aggregated and reflected in dashboard
    await page.goto('/artist/dashboard');
    await expect(page.locator('[data-testid="broadcast-stats"]')).toBeVisible();
    await expect(page.locator('[data-testid="click-rate"]')).toContainText('15%');
  });

  test('TC-ART-COMM-07: Media gallery (private original) upload → backer only disclosure', async ({ page }) => {
    // Given storage with pre-signed URL policy applied
    await page.goto('/artist/dashboard');
    await page.click('[data-testid="media-gallery-tab"]');
    
    // When high-resolution original image/clip upload → 'Backer Only' posting
    await page.setInputFiles('[data-testid="media-upload"]', 'test-files/high-res-image.jpg');
    await page.selectOption('[data-testid="media-visibility"]', 'BACKERS_ONLY');
    await page.fill('[data-testid="media-title"]', 'Behind the Scenes');
    await page.click('[data-testid="upload-media-button"]');
    
    // Then non-backer URL access attempt results in 403 (signature expired/no permission)
    await page.context().clearCookies();
    const mediaUrl = await page.locator('[data-testid="media-url"]').textContent();
    
    const response = await page.request.get(mediaUrl || '');
    expect(response.status()).toBe(403);
    
    // Verify backer can view normally in page embed
    await page.goto('/auth/signin');
    await page.fill('[data-testid="email-input"]', 'fan_ko@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');
    
    await page.goto('/projects/1/media');
    await expect(page.locator('[data-testid="backer-media-gallery"]')).toBeVisible();
    await expect(page.locator('[data-testid="media-player"]')).toBeVisible();
  });

  test('TC-ART-COMM-08: Live announcement (urgent delay/change) - multi-channel notification', async ({ page }) => {
    // Given shipping delay or performance schedule change occurs
    await page.goto('/artist/dashboard');
    await page.click('[data-testid="urgent-announcement-tab"]');
    
    // When artist page → "Urgent Announcement" → channel (in-app/email/push) selection
    await page.click('[data-testid="create-urgent-announcement"]');
    await page.fill('[data-testid="announcement-title"]', 'Performance Date Changed');
    await page.fill('[data-testid="announcement-content"]', 'Due to unforeseen circumstances, our performance date has been changed to next week.');
    await page.check('[data-testid="channel-in-app"]');
    await page.check('[data-testid="channel-email"]');
    await page.check('[data-testid="channel-push"]');
    await page.click('[data-testid="send-urgent-announcement"]');
    
    // Then immediate send to selected channels, announcement post pinned at top
    await expect(page.locator('[data-testid="announcement-sent"]')).toBeVisible();
    
    // Verify announcement post pinned at top
    await page.goto('/projects/1/community');
    await expect(page.locator('[data-testid="pinned-announcement"]')).toBeVisible();
    
    // Verify only reward holders/ticket holders targeted
    const targetingResults = await page.evaluate(() => 
      window.localStorage.getItem('announcement_targeting')
    );
    expect(targetingResults).toContain('reward_holders');
    expect(targetingResults).toContain('ticket_holders');
    
    // Verify open/click tracking and unread reminder scheduling
    await page.goto('/artist/dashboard');
    await expect(page.locator('[data-testid="announcement-stats"]')).toBeVisible();
    await expect(page.locator('[data-testid="open-rate"]')).toContainText('85%');
  });

  test('TC-ART-COMM-09: Membership tier (support tier) exclusive posts', async ({ page }) => {
    // Given membership/tier feature exists (e.g., Silver/Gold)
    await page.goto('/artist/dashboard');
    await page.click('[data-testid="membership-management-tab"]');
    
    // When 'Gold Only' post creation
    await page.click('[data-testid="create-tier-post"]');
    await page.fill('[data-testid="post-title"]', 'Gold Member Exclusive Content');
    await page.fill('[data-testid="post-content"]', 'This is exclusive content for Gold members only.');
    await page.selectOption('[data-testid="tier-restriction"]', 'GOLD_ONLY');
    await page.click('[data-testid="publish-tier-post"]');
    
    // Then Gold+ can view fully, Silver sees teaser only or access restriction
    await page.goto('/artist/artist_ko/posts');
    await expect(page.locator('[data-testid="gold-exclusive-post"]')).toBeVisible();
    
    // Simulate Silver member access
    await page.evaluate(() => {
      window.localStorage.setItem('user_tier', 'SILVER');
    });
    
    await page.reload();
    await expect(page.locator('[data-testid="tier-restricted-post"]')).toBeVisible();
    await expect(page.locator('[data-testid="upgrade-prompt"]')).toBeVisible();
    
    // Verify tier change immediately reflects permission (cache invalidation)
    await page.evaluate(() => {
      window.localStorage.setItem('user_tier', 'GOLD');
    });
    
    await page.reload();
    await expect(page.locator('[data-testid="gold-exclusive-post"]')).toBeVisible();
  });

  test('TC-ART-COMM-10: Fan participation production log - transparency card', async ({ page }) => {
    // Given production log/evidence disclosure feature active
    await page.goto('/artist/dashboard');
    await page.click('[data-testid="production-log-tab"]');
    
    // When artist posts production log cards (expense items, samples, studio cuts) sequentially
    await page.click('[data-testid="create-log-card"]');
    await page.fill('[data-testid="log-title"]', 'Studio Recording Session');
    await page.fill('[data-testid="log-description"]', 'Recording vocals for the new track');
    await page.fill('[data-testid="log-expense"]', '₩500,000');
    await page.setInputFiles('[data-testid="log-evidence"]', 'test-files/studio-receipt.jpg');
    await page.click('[data-testid="publish-log-card"]');
    
    // Then fans can check production progress in timeline
    await page.goto('/projects/1/production-log');
    await expect(page.locator('[data-testid="production-timeline"]')).toBeVisible();
    await expect(page.locator('[data-testid="log-card-1"]')).toBeVisible();
    
    // Verify sensitive values (detailed amounts/contracts) are summarized or masked
    await expect(page.locator('[data-testid="log-expense"]')).toContainText('₩500,000');
    await expect(page.locator('[data-testid="detailed-breakdown"]')).not.toBeVisible();
    
    // Verify linked to settlement tab for trust indicator increase event recording
    await page.click('[data-testid="view-settlement-link"]');
    await expect(page).toHaveURL('/projects/1/settlement');
    await expect(page.locator('[data-testid="transparency-score"]')).toContainText('+10');
  });

  test('TC-ART-COMM-11: Offline fan meeting invitation - ticket/QR integration', async ({ page }) => {
    // Given fan meeting event creation possible
    await page.goto('/artist/dashboard');
    await page.click('[data-testid="events-management-tab"]');
    
    // When invite target 'Top 100 backers' → invite send → first-come-first-served registration
    await page.click('[data-testid="create-fan-meeting"]');
    await page.fill('[data-testid="event-title"]', 'Exclusive Fan Meeting');
    await page.fill('[data-testid="event-description"]', 'Meet the artist in person!');
    await page.fill('[data-testid="event-date"]', '2024-12-31');
    await page.selectOption('[data-testid="invite-target"]', 'TOP_100_BACKERS');
    await page.click('[data-testid="send-invitations"]');
    
    // Simulate registration process
    await page.evaluate(() => {
      window.localStorage.setItem('simulate_fan_registrations', JSON.stringify([
        { user: 'fan1', rank: 1, registered: true },
        { user: 'fan2', rank: 2, registered: true },
        { user: 'fan3', rank: 3, registered: false }
      ]));
    });
    
    // Then registered users get dedicated QR
    await page.goto('/my-events');
    await expect(page.locator('[data-testid="fan-meeting-qr"]')).toBeVisible();
    
    // Verify on-site check-in with single pass, transfer prohibition policy violation → block
    await page.click('[data-testid="qr-code"]');
    await expect(page.locator('[data-testid="check-in-success"]')).toBeVisible();
    
    // Try to use QR again (should fail)
    await page.click('[data-testid="qr-code"]');
    await expect(page.locator('[data-testid="qr-already-used"]')).toBeVisible();
  });

  test('TC-ART-COMM-12: Spam/bot defense - rate limit & content filter', async ({ page }) => {
    // Given same account/fingerprint repeated posting attempts
    await page.goto('/artist/dashboard');
    await page.click('[data-testid="write-post-button"]');
    
    // When multiple posts/comments/DM attempts in short time
    for (let i = 0; i < 5; i++) {
      await page.fill('[data-testid="post-title"]', `Spam Post ${i}`);
      await page.fill('[data-testid="post-content"]', 'This is spam content');
      await page.click('[data-testid="publish-post-button"]');
      
      if (i < 3) {
        // First few should succeed
        await expect(page.locator('[data-testid="post-success"]')).toBeVisible();
      } else {
        // Later attempts should be rate limited
        await expect(page.locator('[data-testid="rate-limit-error"]')).toBeVisible();
      }
    }
    
    // Then rate limit blocks and cooldown message
    await expect(page.locator('[data-testid="cooldown-message"]')).toContainText('Please wait');
    
    // Verify profanity/personal info filter blocks submission, fake adult content link blocks
    await page.fill('[data-testid="post-content"]', 'This contains profanity: fuck');
    await page.click('[data-testid="publish-post-button"]');
    await expect(page.locator('[data-testid="content-filter-error"]')).toBeVisible();
  });

  test('TC-ART-COMM-13: Moderation collaboration - artist unit action + admin escalation', async ({ page }) => {
    // Given artist has 1st level moderation authority for own community
    await page.goto('/projects/1/community');
    
    // When problematic comment hide/delete → 'Admin review request' click
    await page.click('[data-testid="hide-comment-1"]');
    await page.click('[data-testid="request-admin-review"]');
    await page.fill('[data-testid="review-reason"]', 'Inappropriate content');
    await page.click('[data-testid="submit-review-request"]');
    
    // Then admin queue case creation, status REVIEWING
    await expect(page.locator('[data-testid="review-request-sent"]')).toBeVisible();
    
    // Simulate admin review
    await page.evaluate(() => {
      window.localStorage.setItem('simulate_admin_review', JSON.stringify({
        caseId: 1,
        status: 'REVIEWING',
        adminAction: 'WARNED'
      }));
    });
    
    // Verify admin action result sent back to artist as feedback
    await page.goto('/artist/dashboard');
    await page.click('[data-testid="moderation-feedback-tab"]');
    await expect(page.locator('[data-testid="admin-feedback-1"]')).toBeVisible();
    await expect(page.locator('[data-testid="admin-action"]')).toContainText('WARNED');
  });

  test('TC-ART-COMM-14: Communication performance dashboard (retention metrics)', async ({ page }) => {
    // Given artist dashboard has communication metrics widget
    await page.goto('/artist/dashboard');
    await page.click('[data-testid="analytics-tab"]');
    
    // When last 30 days range selected
    await page.selectOption('[data-testid="date-range"]', '30_days');
    
    // Then post reach/engagement (likes/comments/saves), follower growth, notification open/click, vote participation rate displayed
    await expect(page.locator('[data-testid="post-reach-metric"]')).toBeVisible();
    await expect(page.locator('[data-testid="engagement-rate"]')).toContainText('15%');
    await expect(page.locator('[data-testid="follower-growth"]')).toContainText('+25');
    await expect(page.locator('[data-testid="notification-open-rate"]')).toContainText('85%');
    await expect(page.locator('[data-testid="vote-participation"]')).toContainText('60%');
    
    // Verify backer-only content re-engagement conversion rate aggregated separately
    await expect(page.locator('[data-testid="backer-reengagement"]')).toBeVisible();
    await expect(page.locator('[data-testid="backer-conversion-rate"]')).toContainText('40%');
  });
});
