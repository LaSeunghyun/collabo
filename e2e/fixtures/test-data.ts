// Test data fixtures for E2E tests
export const testUsers = {
  fan_ko: {
    email: 'fan_ko@example.com',
    password: 'password123',
    role: 'FAN',
    name: 'Test Fan'
  },
  artist_ko: {
    email: 'artist_ko@example.com',
    password: 'password123',
    role: 'ARTIST',
    name: 'Test Artist'
  },
  partner_studio: {
    email: 'partner_studio@example.com',
    password: 'password123',
    role: 'PARTNER',
    name: 'Studio A',
    type: 'STUDIO'
  },
  partner_venue: {
    email: 'partner_venue@example.com',
    password: 'password123',
    role: 'PARTNER',
    name: 'Venue B',
    type: 'VENUE'
  },
  admin_root: {
    email: 'admin_root@example.com',
    password: 'admin123',
    role: 'ADMIN',
    name: 'Admin User',
    mfaEnabled: true
  }
};

export const testProjects = {
  music_project: {
    id: 1,
    title: 'New Album Release',
    description: 'Support my new album with exclusive rewards',
    goal: 1000000,
    currentAmount: 750000,
    status: 'LIVE',
    category: 'MUSIC',
    rewards: [
      {
        id: 1,
        title: 'Digital Album',
        description: 'Early access to digital album',
        price: 15000,
        type: 'DIGITAL',
        inventory: 1000
      },
      {
        id: 2,
        title: 'Physical CD + Digital',
        description: 'Physical CD with digital download',
        price: 25000,
        type: 'PHYSICAL',
        inventory: 500
      },
      {
        id: 3,
        title: 'VIP Concert Ticket',
        description: 'VIP ticket to album release concert',
        price: 100000,
        type: 'EXPERIENCE',
        inventory: 50
      }
    ]
  },
  exhibition_project: {
    id: 2,
    title: 'Art Exhibition',
    description: 'Support my art exhibition with various rewards',
    goal: 2000000,
    currentAmount: 500000,
    status: 'LIVE',
    category: 'ART',
    rewards: [
      {
        id: 4,
        title: 'Exhibition Catalog',
        description: 'Limited edition exhibition catalog',
        price: 30000,
        type: 'PHYSICAL',
        inventory: 200
      },
      {
        id: 5,
        title: 'Private Viewing',
        description: 'Private viewing with artist',
        price: 150000,
        type: 'EXPERIENCE',
        inventory: 20
      }
    ]
  }
};

export const testPartners = {
  studio_a: {
    id: 1,
    name: 'Studio A',
    type: 'STUDIO',
    facilities: ['Recording Studio', 'Mixing Room', 'Mastering Suite'],
    rates: {
      hourly: 50000,
      daily: 400000
    },
    availability: {
      monday: { start: '09:00', end: '18:00' },
      tuesday: { start: '09:00', end: '18:00' },
      wednesday: { start: '09:00', end: '18:00' },
      thursday: { start: '09:00', end: '18:00' },
      friday: { start: '09:00', end: '18:00' }
    },
    status: 'APPROVED'
  },
  venue_b: {
    id: 2,
    name: 'Venue B',
    type: 'VENUE',
    facilities: ['Concert Hall', 'Green Room', 'Sound System'],
    rates: {
      hourly: 100000,
      daily: 800000
    },
    availability: {
      saturday: { start: '14:00', end: '22:00' },
      sunday: { start: '14:00', end: '22:00' }
    },
    status: 'PENDING'
  }
};

export const testSettlements = {
  settlement_1: {
    id: 1,
    projectId: 1,
    totalRaised: 1000000,
    paymentFees: 30000,
    platformFees: 50000,
    taxes: 20000,
    reserve: 100000,
    netPayable: 800000,
    status: 'SETTLING',
    distribution: {
      artist: { percent: 60, amount: 480000 },
      collaborator: { percent: 20, amount: 160000 },
      platform: { percent: 10, amount: 80000 },
      reserve: { percent: 10, amount: 80000 }
    }
  },
  settlement_2: {
    id: 2,
    projectId: 2,
    totalRaised: 2000000,
    paymentFees: 60000,
    platformFees: 100000,
    taxes: 40000,
    reserve: 200000,
    netPayable: 1600000,
    status: 'EXECUTING',
    distribution: {
      artist: { percent: 70, amount: 1120000 },
      collaborator: { percent: 15, amount: 240000 },
      platform: { percent: 10, amount: 160000 },
      reserve: { percent: 5, amount: 80000 }
    }
  }
};

export const testContent = {
  posts: [
    {
      id: 1,
      title: 'Project Update #1',
      content: 'Thank you for your support! We are making great progress.',
      author: 'artist_ko',
      visibility: 'PUBLIC',
      category: 'UPDATE'
    },
    {
      id: 2,
      title: 'Behind the Scenes',
      content: 'Check out this behind the scenes content from our recording session.',
      author: 'artist_ko',
      visibility: 'BACKERS_ONLY',
      category: 'UPDATE'
    }
  ],
  comments: [
    {
      id: 1,
      content: 'Great project! Looking forward to the album.',
      author: 'fan_ko',
      postId: 1,
      status: 'ACTIVE'
    },
    {
      id: 2,
      content: 'This is spam content',
      author: 'fan_ko',
      postId: 1,
      status: 'HIDDEN'
    }
  ]
};

export const testSafetyRules = {
  profanity: [
    {
      word: 'fuck',
      category: 'PROFANITY',
      severity: 'HIGH',
      action: 'BLOCK',
      language: 'en'
    },
    {
      word: 'damn',
      category: 'PROFANITY',
      severity: 'MEDIUM',
      action: 'QUARANTINE',
      language: 'en'
    }
  ],
  advertising: [
    {
      word: 'buy now',
      category: 'ADVERTISING',
      severity: 'MEDIUM',
      action: 'QUARANTINE',
      language: 'en'
    }
  ],
  pii: [
    {
      pattern: '\\d{3}-\\d{4}-\\d{4}',
      type: 'PHONE',
      action: 'MASK'
    },
    {
      pattern: '\\d{3}-\\d{6}-\\d{6}',
      type: 'ACCOUNT',
      action: 'BLOCK'
    }
  ]
};

export const testOverfunding = {
  thresholds: [
    {
      percent: 100,
      action: 'BANNER',
      requireStretchGoal: false,
      paymentRestriction: false,
      bannerTemplate: 'goal-achieved'
    },
    {
      percent: 150,
      action: 'STRETCH_GOAL_REQUIRED',
      requireStretchGoal: true,
      paymentRestriction: true,
      bannerTemplate: 'stretch-goal-required'
    },
    {
      percent: 200,
      action: 'MANDATORY_ANNOUNCEMENT',
      requireStretchGoal: false,
      paymentRestriction: false,
      bannerTemplate: 'overfunding-warning'
    }
  ],
  stretchGoals: [
    {
      id: 1,
      projectId: 1,
      title: 'Enhanced Album Package',
      description: 'If we reach 200%, we will include bonus tracks and enhanced packaging',
      budget: 500000,
      timeline: '3 months',
      status: 'PENDING'
    }
  ],
  exceptions: [
    {
      id: 1,
      projectId: 1,
      type: 'PAYMENT_RESTRICTION',
      expiresAt: '2024-12-31',
      reason: 'Special circumstances approved',
      status: 'ACTIVE'
    }
  ]
};

export const testNotifications = {
  email: [
    {
      type: 'PROJECT_APPROVED',
      recipient: 'artist_ko@example.com',
      subject: 'Your project has been approved',
      content: 'Congratulations! Your project is now live.'
    },
    {
      type: 'PAYMENT_SUCCESS',
      recipient: 'fan_ko@example.com',
      subject: 'Payment successful',
      content: 'Thank you for your support!'
    }
  ],
  push: [
    {
      type: 'GOAL_ACHIEVED',
      recipient: 'fan_ko',
      title: 'Goal Achieved!',
      body: 'The project you supported has reached its goal!'
    }
  ],
  inApp: [
    {
      type: 'UPDATE_PUBLISHED',
      recipient: 'fan_ko',
      title: 'New Update',
      body: 'Artist posted a new update'
    }
  ]
};

export const testFiles = {
  images: [
    'test-files/sample-image.jpg',
    'test-files/high-res-image.jpg',
    'test-files/studio-receipt.jpg'
  ],
  documents: [
    'test-files/copyright-claim.pdf',
    'test-files/invoice.pdf',
    'test-files/contract.pdf'
  ]
};

export const testApiResponses = {
  payment: {
    success: {
      status: 'succeeded',
      id: 'pi_1234567890',
      amount: 25000,
      currency: 'krw'
    },
    failure: {
      status: 'failed',
      error: {
        code: 'card_declined',
        message: 'Your card was declined.'
      }
    }
  },
  auth: {
    tokenRefresh: {
      access_token: 'new_access_token',
      refresh_token: 'new_refresh_token',
      expires_in: 900
    }
  }
};

export const testConfig = {
  baseUrl: 'http://localhost:3000',
  apiUrl: 'http://localhost:3000/api',
  testTimeout: 30000,
  retryAttempts: 3,
  screenshotPath: 'test-results/screenshots',
  videoPath: 'test-results/videos'
};
