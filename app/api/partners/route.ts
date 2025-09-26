import { NextRequest, NextResponse } from 'next/server';
import { UserRole } from '@prisma/client';

import { handleAuthorizationError, requireApiUser } from '@/lib/auth/guards';

const partners = [
  {
    id: 'studio-1',
    name: 'Studio Aurora',
    type: 'studio',
    contactInfo: 'hello@aurora.studio',
    status: 'approved'
  },
  {
    id: 'venue-1',
    name: 'Wonder Hall',
    type: 'venue',
    contactInfo: 'booking@wonderhall.kr',
    status: 'review'
  }
];

export async function GET() {
  return NextResponse.json(partners);
}

export async function POST(request: NextRequest) {
  try {
    await requireApiUser({ roles: [UserRole.PARTNER, UserRole.ADMIN], permissions: ['partner:manage'] });
  } catch (error) {
    const response = handleAuthorizationError(error);
    if (response) {
      return response;
    }

    throw error;
  }

  const body = await request.json();
  return NextResponse.json({ ...body, id: crypto.randomUUID(), status: 'review' }, { status: 201 });
}
