import { describe, it, expect, beforeEach } from '@jest/globals';
import { NextRequest } from 'next/server';

// Mock the database and auth modules
jest.mock('@/lib/db/drizzle', () => ({
  db: {
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    returning: jest.fn().mockResolvedValue([{
      id: 'test-category-id',
      slug: 'test-category',
      name: 'Test Category',
      description: 'Test description',
      displayOrder: 1,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }]),
  },
}));

jest.mock('@/lib/auth/guards', () => ({
  requireApiUser: jest.fn().mockResolvedValue({
    id: 'test-user-id',
    name: 'Test User',
    role: 'ADMIN',
    permissions: ['community:moderate'],
  }),
}));

// Import the route handlers after mocking
import { GET, POST } from '@/app/api/community/categories/route';

describe('/api/community/categories', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('should return active categories', async () => {
      const mockCategories = [
        {
          id: 'cat-1',
          slug: 'free',
          name: '자유',
          description: '일반 소통, 잡담',
          displayOrder: 1,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      const mockDb = require('@/lib/db/drizzle').db;
      mockDb.select.mockResolvedValue(mockCategories);

      const request = new NextRequest('http://localhost:3000/api/community/categories');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.categories).toBeDefined();
      expect(Array.isArray(data.categories)).toBe(true);
    });
  });

  describe('POST', () => {
    it('should create a new category', async () => {
      const categoryData = {
        slug: 'new-category',
        name: 'New Category',
        description: 'New category description',
        displayOrder: 5,
      };

      const request = new NextRequest('http://localhost:3000/api/community/categories', {
        method: 'POST',
        body: JSON.stringify(categoryData),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.category).toBeDefined();
    });

    it('should validate required fields', async () => {
      const invalidData = {
        slug: '', // Empty slug
        name: 'Test Category',
      };

      const request = new NextRequest('http://localhost:3000/api/community/categories', {
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

    it('should check for duplicate slug', async () => {
      const mockDb = require('@/lib/db/drizzle').db;
      mockDb.select.mockResolvedValue([{ id: 'existing-category' }]); // Existing category found

      const categoryData = {
        slug: 'existing-slug',
        name: 'Existing Category',
        description: 'This slug already exists',
        displayOrder: 1,
      };

      const request = new NextRequest('http://localhost:3000/api/community/categories', {
        method: 'POST',
        body: JSON.stringify(categoryData),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('이미 존재하는 슬러그');
    });
  });
});
