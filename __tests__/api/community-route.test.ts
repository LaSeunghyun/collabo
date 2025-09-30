import { describe, expect, it, beforeEach } from '@jest/globals';
import { NextRequest } from 'next/server';
import { createPrismaMock, resetPrismaMock, type MockPrisma } from '../helpers/prisma-mock';

type SessionModule = typeof import('@/lib/auth/session');

type PrismaModule = { prisma: MockPrisma };

jest.mock('@/lib/prisma', () => {
  const { createPrismaMock: factory } = require('../helpers/prisma-mock');
  return { prisma: factory() } as PrismaModule;
});

jest.mock('@/lib/auth/session', () => ({
  evaluateAuthorization: jest.fn().mockResolvedValue({ user: null })
}));

const prismaMock = (jest.requireMock('@/lib/prisma') as PrismaModule).prisma;
const { evaluateAuthorization } = require('@/lib/auth/session') as SessionModule & {
  evaluateAuthorization: jest.MockedFunction<SessionModule['evaluateAuthorization']>;
};
const { GET } = require('@/app/api/community/route');

describe('Community feed API', () => {
  beforeEach(() => {
    resetPrismaMock(prismaMock);
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

  const setupPrismaSequence = () => {
    prismaMock.post.findMany
      .mockResolvedValueOnce([buildPost({ id: 'initial-1' })])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([buildPost({ id: 'popular-1', _count: { likes: 6, comments: 3 } })])
      .mockResolvedValueOnce([buildPost({ id: 'trending-1', createdAt: new Date() })]);

    prismaMock.postLike.findMany.mockResolvedValue([]);
    prismaMock.moderationReport.groupBy.mockResolvedValue([]);
    prismaMock.post.count.mockResolvedValue(1);
  };

  const invoke = async (url: string) => {
    const request = new NextRequest(url);
    const response = await GET(request);
    const json = await response.json();
    return { response, json };
  };

  it('returns 200 for popular feed without prisma order errors', async () => {
    setupPrismaSequence();

    const { response } = await invoke('http://localhost/api/community?sort=popular&limit=5');

    expect(response.status).toBe(200);
    expect(prismaMock.post.findMany).toHaveBeenCalled();
  });

  it('returns 200 for trending feed when aggregating counts', async () => {
    setupPrismaSequence();

    const { response, json } = await invoke('http://localhost/api/community?sort=trending&limit=5');

    expect(response.status).toBe(200);
    expect(Array.isArray(json.posts)).toBe(true);
  });

  it('marks posts as liked when viewer has liked them', async () => {
    setupPrismaSequence();
    evaluateAuthorization.mockResolvedValue({ user: { id: 'viewer-1' } } as any);
    prismaMock.postLike.findMany.mockResolvedValue([{ postId: 'initial-1' }]);

    const { json } = await invoke('http://localhost/api/community?limit=5');

    expect(json.posts[0].liked).toBe(true);
  });

  it('returns 500 and error payload when prisma throws', async () => {
    prismaMock.post.findMany.mockRejectedValueOnce(new Error('database failure'));

    const { response, json } = await invoke('http://localhost/api/community');

    expect(response.status).toBe(500);
    expect(json).toHaveProperty('message', 'Unable to load community posts');
  });
});
