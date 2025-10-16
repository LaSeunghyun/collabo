import type { NextRequest } from 'next/server';

import { POST as reportPost } from '@/app/api/community/[id]/report/route';
import { POST as blockPost } from '@/app/api/community/[id]/block/route';

jest.mock('@/lib/prisma', () => {
  const prismaMocks = {
    moderationReportCreate: jest.fn(),
    moderationReportFindFirst: jest.fn(),
    postFindUnique: jest.fn(),
    userFindUnique: jest.fn(),
    userBlockUpsert: jest.fn()
  };

  (globalThis as unknown as { __prismaMocks?: typeof prismaMocks }).__prismaMocks = prismaMocks;

  return {
    prisma: {
      moderationReport: {
        create: (...args: unknown[]) => prismaMocks.moderationReportCreate(...args),
        findFirst: (...args: unknown[]) => prismaMocks.moderationReportFindFirst(...args)
      },
      post: {
        findUnique: (...args: unknown[]) => prismaMocks.postFindUnique(...args)
      },
      user: {
        findUnique: (...args: unknown[]) => prismaMocks.userFindUnique(...args)
      },
      userBlock: {
        upsert: (...args: unknown[]) => prismaMocks.userBlockUpsert(...args)
      }
    }
  };
});

const {
  moderationReportCreate: mockModerationReportCreate,
  moderationReportFindFirst: mockModerationReportFindFirst,
  postFindUnique: mockPostFindUnique,
  userFindUnique: mockUserFindUnique,
  userBlockUpsert: mockUserBlockUpsert
} = (globalThis as unknown as { __prismaMocks: {
  moderationReportCreate: jest.Mock;
  moderationReportFindFirst: jest.Mock;
  postFindUnique: jest.Mock;
  userFindUnique: jest.Mock;
  userBlockUpsert: jest.Mock;
}; }).__prismaMocks;

describe('community moderation endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockPostFindUnique.mockResolvedValue({ id: 'post-1' });
    mockUserFindUnique.mockResolvedValue({ id: 'user-1' });
    mockModerationReportFindFirst.mockResolvedValue(null);
  });

  describe('POST /api/community/[id]/report', () => {
    it('returns 400 when reporterId is missing', async () => {
      const request = new Request('http://localhost/api/community/post-1/report', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await reportPost(request as unknown as NextRequest, { params: { id: 'post-1' } });
      expect(response.status).toBe(400);
    });

    it('creates a moderation report with the provided payload', async () => {
      mockModerationReportFindFirst.mockResolvedValue(null);

      const request = new Request('http://localhost/api/community/post-1/report', {
        method: 'POST',
        body: JSON.stringify({ reporterId: 'user-1', reason: 'spam' }),
        headers: { 'Content-Type': 'application/json' }
      });

      const created = {
        id: 'report-1',
        status: 'PENDING',
        createdAt: new Date()
      } as const;
      mockModerationReportCreate.mockResolvedValue(created);

      const response = await reportPost(request as unknown as NextRequest, { params: { id: 'post-1' } });
      const json = await response.json();

      expect(response.status).toBe(201);
      expect(mockModerationReportCreate).toHaveBeenCalledWith({
        data: {
          reporter: { connect: { id: 'user-1' } },
          targetType: expect.any(String),
          targetId: 'post-1',
          reason: 'spam'
        }
      });
      expect(json).toMatchObject({ id: 'report-1', status: 'PENDING' });
    });
  });

  describe('POST /api/community/[id]/block', () => {
    it('requires a blockerId in the payload', async () => {
      const request = new Request('http://localhost/api/community/post-1/block', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await blockPost(request as unknown as NextRequest, { params: { id: 'post-1' } });
      expect(response.status).toBe(400);
    });

    it('returns 404 when the post cannot be found', async () => {
      mockPostFindUnique.mockResolvedValue(null);

      const request = new Request('http://localhost/api/community/post-1/block', {
        method: 'POST',
        body: JSON.stringify({ blockerId: 'user-1' }),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await blockPost(request as unknown as NextRequest, { params: { id: 'post-1' } });
      expect(response.status).toBe(404);
    });

    it('creates a block entry for the post author', async () => {
      mockPostFindUnique.mockResolvedValue({ authorId: 'user-2' });
      mockUserBlockUpsert.mockResolvedValue({
        id: 'block-1',
        blockerId: 'user-1',
        blockedUserId: 'user-2',
        createdAt: new Date()
      });

      const request = new Request('http://localhost/api/community/post-1/block', {
        method: 'POST',
        body: JSON.stringify({ blockerId: 'user-1' }),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await blockPost(request as unknown as NextRequest, { params: { id: 'post-1' } });
      const json = await response.json();

      expect(response.status).toBe(201);
      expect(mockUserBlockUpsert).toHaveBeenCalledWith({
        where: {
          blockerId_blockedUserId: { blockerId: 'user-1', blockedUserId: 'user-2' }
        },
        create: {
          blockerId: 'user-1',
          blockedUserId: 'user-2'
        },
        update: {}
      });
      expect(json).toMatchObject({ blockerId: 'user-1', blockedUserId: 'user-2' });
    });
  });
});
