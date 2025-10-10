import { describe, expect, it, beforeEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';

// AuthorizationError 클래스 정의
class AuthorizationError extends Error {
  constructor(message: string, public statusCode: number) {
    super(message);
    this.name = 'AuthorizationError';
  }
}

// requireApiUser 모킹
const mockRequireApiUser = jest.fn();

jest.mock('@/lib/auth/guards', () => ({
  requireApiUser: mockRequireApiUser,
  AuthorizationError: AuthorizationError
}));

import { POST } from '@/app/api/funding/route';

describe('Funding API authentication', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when session is not authenticated', async () => {
    // requireApiUser가 AuthorizationError를 던지도록 설정
    mockRequireApiUser.mockImplementation(() => {
      const error = new AuthorizationError('인증이 필요합니다.', 401);
      return Promise.reject(error);
    });

    const request = new NextRequest('http://localhost:3000/api/funding', {
      method: 'POST',
      body: JSON.stringify({ projectId: 'test-project' })
    });

    const response = await POST(request);
    expect(response.status).toBe(401);

    const json = await response.json();
    expect(json.error).toBe('인증이 필요합니다.');

    expect(mockRequireApiUser).toHaveBeenCalledTimes(1);
  });
});
