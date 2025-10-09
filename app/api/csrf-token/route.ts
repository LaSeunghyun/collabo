import { NextRequest } from 'next/server';
import { getCSRFToken } from '@/lib/auth/csrf';

export async function GET(request: NextRequest) {
  return getCSRFToken(request);
}
