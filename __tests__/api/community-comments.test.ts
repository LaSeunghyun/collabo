import { describe, beforeEach, afterEach, it, expect, jest } from '@jest/globals';
import { NextRequest } from 'next/server';

import { POST } from '@/app/api/community/[id]/comments/route';
import { AuthorizationError } from '@/lib/auth/guards';

jest.mock('@/lib/auth/guards', () => {
  const actual = jest.requireActual('@/lib/auth/guards');
  return {
    ...actual,
    requireApiUser: jest.fn()
  };
});

jest.mock('@/lib/prisma', () => {
  const mockPrisma = {
    post: {
      findUnique: jest.fn()
    },
    comment: {
      create: jest.fn(),
      findMany: jest.fn()
    }
  };

  return {
    __esModule: true,
    prisma: mockPrisma,
    default: mockPrisma
  };
});

const { prisma: mockPrisma } = jest.requireMock('@/lib/prisma') as {
  prisma: {
    post: { findUnique: jest.Mock };
    comment: { create: jest.Mock; findMany: jest.Mock };
  };
};

describe('Community comments API', () => {
  const requireApiUser = jest.requireMock('@/lib/auth/guards').requireApiUser as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when the user is not authenticated', async () => {
    requireApiUser.mockRejectedValueOnce(new AuthorizationError('인증이 필요합니다.', 401));

    const request = new NextRequest('http://localhost/api/community/post-1/comments', {
      method: 'POST',
      body: JSON.stringify({ content: 'Hello world' })
    });

    const response = await POST(request, { params: { id: 'post-1' } });

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: '인증이 필요합니다.' });
    expect(mockPrisma.comment.create).not.toHaveBeenCalled();
  });

  it('creates a comment for the authenticated user', async () => {
    requireApiUser.mockResolvedValueOnce({
      id: 'user-1',
      name: 'Alice',
      email: 'alice@example.com',
      role: 'PARTICIPANT',
      permissions: []
    });

    mockPrisma.post.findUnique.mockResolvedValueOnce({ id: 'post-1' });
    const createdAt = new Date('2024-01-01T00:00:00Z');
    mockPrisma.comment.create.mockResolvedValueOnce({
      id: 'comment-1',
      postId: 'post-1',
      content: 'Hello world',
      createdAt,
      author: { name: 'Alice' }
    });

    const request = new NextRequest('http://localhost/api/community/post-1/comments', {
      method: 'POST',
      body: JSON.stringify({ content: 'Hello world' })
    });

    const response = await POST(request, { params: { id: 'post-1' } });
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(mockPrisma.comment.create).toHaveBeenCalledWith({
      data: {
        content: 'Hello world',
        postId: 'post-1',
        authorId: 'user-1'
      },
      include: { author: true }
    });
    expect(data).toEqual({
      id: 'comment-1',
      postId: 'post-1',
      content: 'Hello world',
      authorName: 'Alice',
      createdAt: createdAt.toISOString()
    });
  });
});
