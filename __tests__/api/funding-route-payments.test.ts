import { describe, expect, it, beforeEach } from '@jest/globals';
import { NextRequest } from 'next/server';
import Stripe from 'stripe';

import { POST } from '@/app/api/funding/route';
import { AuthorizationError, requireApiUser } from '@/lib/auth/guards';
import { ProjectStatus, FundingStatus } from '@/types/prisma';
import { createSettlementIfTargetReached } from '@/lib/server/funding-settlement';
import { createPrismaMock, type MockPrisma } from '../helpers/prisma-mock';

const paymentIntentsCreate = jest.fn();
const paymentIntentsRetrieve = jest.fn();
const checkoutSessionsCreate = jest.fn();
const checkoutSessionsRetrieve = jest.fn();

jest.mock('stripe', () =>
  jest.fn().mockImplementation(() => ({
    paymentIntents: {
      create: paymentIntentsCreate,
      retrieve: paymentIntentsRetrieve
    },
    checkout: {
      sessions: {
        create: checkoutSessionsCreate,
        retrieve: checkoutSessionsRetrieve
      }
    }
  }))
);

jest.mock('@/lib/prisma', () => ({
  prisma: createPrismaMock() as MockPrisma
}));

const prismaMock = (jest.requireMock('@/lib/prisma') as { prisma: MockPrisma }).prisma;
jest.mock('@/lib/auth/guards', () => {
  const actual = jest.requireActual('@/lib/auth/guards');
  return {
    ...actual,
    requireApiUser: jest.fn()
  };
});

jest.mock('@/lib/server/funding-settlement', () => ({
  createSettlementIfTargetReached: jest.fn()
}));

describe('Funding API payments', () => {
  const requireApiUserMock = requireApiUser as jest.MockedFunction<typeof requireApiUser>;
  const settlementMock = createSettlementIfTargetReached as jest.MockedFunction<
    typeof createSettlementIfTargetReached
  >;

  const resetMocks = () => {
    const fresh = createPrismaMock();
    Object.assign(prismaMock, fresh);

    requireApiUserMock.mockReset();
    paymentIntentsCreate.mockReset();
    paymentIntentsRetrieve.mockReset();
    checkoutSessionsCreate.mockReset();
    checkoutSessionsRetrieve.mockReset();
    settlementMock.mockReset();
  };

  beforeEach(() => {
    resetMocks();
    process.env.STRIPE_SECRET_KEY = 'sk_test_key';
    jest.clearAllMocks();
  });
