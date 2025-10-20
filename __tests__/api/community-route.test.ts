import { describe, expect, it, beforeEach } from '@jest/globals';
import { NextRequest } from 'next/server';
import { createPrismaMock, resetPrismaMock, type MockPrisma } from '../helpers/prisma-mock';

type SessionModule = typeof import('@/lib/auth/session');

type PrismaModule = { prisma: MockPrisma };

jest.mock('@/lib/db/client', () => ({
  getDb: jest.fn()
}));

jest.mock('@/lib/auth/session', () => ({
  evaluateAuthorization: jest.fn().mockResolvedValue({ user: null })
}));

const { getDb } = jest.requireMock('@/lib/db/client') as {
  getDb: jest.MockedFunction<typeof import('@/lib/db/client').getDb>;
};
const { evaluateAuthorization } = require('@/lib/auth/session') as SessionModule & {
  evaluateAuthorization: jest.MockedFunction<SessionModule['evaluateAuthorization']>;
};
const { GET } = require('@/app/api/community/route');

// Mock database
const mockDb = {
  select: jest.fn().mockReturnThis(),
  from: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  innerJoin: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  and: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  desc: jest.fn().mockReturnThis(),
  count: jest.fn().mockReturnThis(),
  groupBy: jest.fn().mockReturnThis()
};

getDb.mockResolvedValue(mockDb as any);

describe('Community feed API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    evaluateAuthorization.mockResolvedValue({ user: null } as any);
  });

  const buildPost = (overrides: Partial<any> = {}) => ({
    id: 'post-1',
    title: 'Post Title',
    content: 'Content',
    category: 'GENERAL',
    projectId: null,
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-02T00:00:00.000Z'),
    isPinned: false,
    author: { id: 'user-1', name: 'Author', avatarUrl: null },
    _count: { likes: 10, comments: 5 },
    ...overrides
  });

  const setupDbSequence = () => {
    // Mock total count query
    mockDb.select.mockResolvedValueOnce([{ count: 1 }]);
    
    // Mock feed posts query
    mockDb.limit.mockResolvedValueOnce([buildPost({ id: 'initial-1' })]);
    
    // Mock pinned posts query
    mockDb.limit.mockResolvedValueOnce([]);
    
    // Mock popular posts query
    mockDb.limit.mockResolvedValueOnce([buildPost({ id: 'popular-1', _count: { likes: 6, comments: 3 } })]);
    
    // Mock likes/dislikes queries
    mockDb.select.mockResolvedValueOnce([]); // postLikes
    mockDb.select.mockResolvedValueOnce([]); // postDislikes
    mockDb.groupBy.mockResolvedValueOnce([]); // moderation reports
  };

  const invoke = async (url: string) => {
    const request = new NextRequest(url);
    const response = await GET(request);
    const json = await response.json();
    return { response, json };
  };

  it('returns 200 for popular feed without prisma order errors', async () => {
    setupDbSequence();

    const { response } = await invoke('http://localhost/api/community?sort=popular&limit=5');

    expect(response.status).toBe(200);
    expect(mockDb.select).toHaveBeenCalled();
  });

  it('returns 200 for trending feed when aggregating counts', async () => {
    setupDbSequence();

    const { response, json } = await invoke('http://localhost/api/community?sort=trending&limit=5');

    expect(response.status).toBe(200);
    expect(Array.isArray(json.posts)).toBe(true);
  });

  it('marks posts as liked when viewer has liked them', async () => {
    setupDbSequence();
    evaluateAuthorization.mockResolvedValue({ user: { id: 'viewer-1' } } as any);
    // Mock liked posts query
    mockDb.select.mockResolvedValueOnce([{ postId: 'initial-1' }]);

    const { json } = await invoke('http://localhost/api/community?limit=5');

    expect(json.posts[0].liked).toBe(true);
  });

  it('returns 500 and error payload when database throws', async () => {
    mockDb.select.mockRejectedValueOnce(new Error('database failure'));

    const { response, json } = await invoke('http://localhost/api/community');

    expect(response.status).toBe(500);
    expect(json).toHaveProperty('message', 'Unable to load community posts');
  });
});
