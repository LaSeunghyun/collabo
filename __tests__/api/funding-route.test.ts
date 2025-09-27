import { describe, expect, it, beforeEach } from '@jest/globals';
import { NextRequest } from 'next/server';

import { POST } from '@/app/api/funding/route';
import { AuthorizationError, requireApiUser } from '@/lib/auth/guards';

jest.mock('@/lib/auth/guards', () => {
  const actual = jest.requireActual('@/lib/auth/guards');
  return {
    ...actual,
    requireApiUser: jest.fn()
  };
});

describe('Funding API authentication', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when session is not authenticated', async () => {
    const mockRequireApiUser = requireApiUser as jest.MockedFunction<typeof requireApiUser>;
    mockRequireApiUser.mockRejectedValueOnce(new AuthorizationError('인증이 필요합니다.', 401));

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
