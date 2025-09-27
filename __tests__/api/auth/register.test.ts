import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/auth/register/route';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@/types/prisma';
import { hash } from 'bcryptjs';

jest.mock('@/lib/prisma', () => ({
    prisma: {
        user: {
            findUnique: jest.fn(),
            create: jest.fn(),
        },
    },
}));

jest.mock('bcryptjs', () => ({
    hash: jest.fn(),
}));

describe('POST /api/auth/register', () => {
    const mockedPrisma = prisma as unknown as {
        user: {
            findUnique: jest.Mock;
            create: jest.Mock;
        };
    };
    const mockedHash = hash as unknown as jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('ignores incoming role values and stores user as PARTICIPANT', async () => {
        mockedPrisma.user.findUnique.mockResolvedValue(null);
        mockedPrisma.user.create.mockResolvedValue({
            id: 'user-1',
            name: '테스트 사용자',
            email: 'test@example.com',
            role: UserRole.PARTICIPANT,
            createdAt: new Date(),
        });
        mockedHash.mockResolvedValue('hashed-password');

        const request = new NextRequest('http://localhost:3000/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: '테스트 사용자',
                email: 'test@example.com',
                password: 'password123',
                role: UserRole.CREATOR,
            }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(mockedPrisma.user.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    role: UserRole.PARTICIPANT,
                }),
            })
        );
        expect(data.user.role).toBe(UserRole.PARTICIPANT);
    });
});
