import { NextRequest, NextResponse } from 'next/server';
import { PartnerType, UserRole } from '@/types/prisma';

import { handleAuthorizationError, requireApiUser } from '@/lib/auth/guards';
import {
  PartnerOwnerNotFoundError,
  PartnerProfileExistsError,
  PartnerValidationError,
  createPartnerProfile,
  listPartners
} from '@/lib/server/partners';
import { PARTNER_TYPE_VALUES } from '@/lib/validators/partners';

const PARTNER_TYPE_SET = new Set(PARTNER_TYPE_VALUES);

const parseBoolean = (value: string | null): boolean | undefined => {
  if (value === null) {
    return undefined;
  }

  if (value === 'true') {
    return true;
  }

  if (value === 'false') {
    return false;
  }

  return undefined;
};

const parsePartnerType = (value: string | null): PartnerType | undefined => {
  if (!value) {
    return undefined;
  }

  if (PARTNER_TYPE_SET.has(value as PartnerType)) {
    return value as PartnerType;
  }

  return undefined;
};

const parseLimit = (value: string | null): number | undefined => {
  if (!value) {
    return undefined;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
};

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const result = await listPartners({
      type: parsePartnerType(searchParams.get('type')),
      search: searchParams.get('q') ?? undefined,
      cursor: searchParams.get('cursor') ?? undefined,
      limit: parseLimit(searchParams.get('limit')),
      includeUnverified: parseBoolean(searchParams.get('includeUnverified')) ?? false,
      verified: parseBoolean(searchParams.get('verified'))
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to load partners', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  let sessionUser;

  try {
    sessionUser = await requireApiUser({
      roles: [UserRole.PARTICIPANT, UserRole.PARTNER, UserRole.ADMIN]
    });
  } catch (error) {
    const response = handleAuthorizationError(error);
    if (response) {
      return response;
    }

    throw error;
  }

  try {
    const body = await request.json();
    const partner = await createPartnerProfile(body, sessionUser);
    return NextResponse.json(partner, { status: 201 });
  } catch (error) {
    if (error instanceof PartnerValidationError) {
      return NextResponse.json({ message: error.message, issues: error.issues }, { status: 400 });
    }

    if (error instanceof PartnerProfileExistsError) {
      return NextResponse.json({ message: error.message }, { status: 409 });
    }

    if (error instanceof PartnerOwnerNotFoundError) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }

    console.error('Failed to create partner profile', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
