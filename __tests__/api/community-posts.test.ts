import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { NextRequest } from 'next/server';

// Mock the database and auth modules
jest.mock('@/lib/db/drizzle', () => ({
  db: {
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    returning: jest.fn().mockResolvedValue([{
      id: 'test-post-id',
      title: 'Test Post',
      content: 'Test content',
      authorId: 'test-user-id',
      scope: 'GLOBAL',
      status: 'PUBLISHED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }]),
  },
}));

jest.mock('@/lib/auth/guards', () => ({
  requireApiUser: jest.fn().mockResolvedValue({
    id: 'test-user-id',
    name: 'Test User',
    role: 'PARTICIPANT',
  }),
}));

// Import the route handler after mocking
import { GET, POST } from '@/app/api/community/posts/route';

describe('/api/community/posts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('should return posts with pagination', async () => {
      const mockPosts = [
        {
          id: 'post-1',
          title: 'Test Post 1',
          content: 'Content 1',
          authorName: 'User 1',
          categoryName: '자유',
          viewCount: 10,
          likeCount: 5,
          commentCount: 3,
          createdAt: new Date().toISOString(),
        },
      ];

      // Mock the database response
      const mockDb = require('@/lib/db/drizzle').db;
      mockDb.select.mockResolvedValue(mockPosts);

      const request = new NextRequest('http://localhost:3000/api/community/posts');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.posts).toBeDefined();
      expect(data.pagination).toBeDefined();
    });

    it('should handle search query', async () => {
      const request = new NextRequest('http://localhost:3000/api/community/posts?search=test');
      const response = await GET(request);
      
      expect(response.status).toBe(200);
    });

    it('should handle category filter', async () => {
      const request = new NextRequest('http://localhost:3000/api/community/posts?category=test-category');
      const response = await GET(request);
      
      expect(response.status).toBe(200);
    });

    it('should handle sort options', async () => {
      const request = new NextRequest('http://localhost:3000/api/community/posts?sort=popular');
      const response = await GET(request);
      
      expect(response.status).toBe(200);
    });
  });

  describe('POST', () => {
    it('should create a new post', async () => {
      const postData = {
        title: 'New Post',
        content: 'New content',
        categoryId: 'test-category-id',
      };

      const request = new NextRequest('http://localhost:3000/api/community/posts', {
        method: 'POST',
        body: JSON.stringify(postData),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.post).toBeDefined();
    });

    it('should validate required fields', async () => {
      const invalidData = {
        title: '', // Empty title
        content: 'Content',
      };

      const request = new NextRequest('http://localhost:3000/api/community/posts', {
        method: 'POST',
        body: JSON.stringify(invalidData),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
    });

    it('should validate content length', async () => {
      const invalidData = {
        title: 'Test',
        content: 'a'.repeat(10001), // Too long
      };

      const request = new NextRequest('http://localhost:3000/api/community/posts', {
        method: 'POST',
        body: JSON.stringify(invalidData),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
    });
  });
});
