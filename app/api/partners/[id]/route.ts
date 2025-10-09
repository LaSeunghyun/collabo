import { NextRequest, NextResponse } from 'next/server';
// import { userRole } from '@/drizzle/schema';

import { handleAuthorizationError, requireApiUser } from '@/lib/auth/guards';
import {
  PartnerAccessDeniedError,
  PartnerNotFoundError,
  PartnerValidationError,
  getPartnerById,
  updatePartnerProfile
} from '@/lib/server/partners';

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const partner = await getPartnerById(params.id);

    if (!partner) {
      return NextResponse.json({ message: '파트너를 찾을 수 없습니다.' }, { status: 404 });
    }

    return NextResponse.json(partner);
  } catch (error) {
    console.error('Failed to fetch partner profile', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  let sessionUser;
  const authContext = { headers: request.headers };

  try {
    sessionUser = await requireApiUser({ roles: ['PARTNER', 'ADMIN'] }, authContext);
  } catch (error) {
    const response = handleAuthorizationError(error);
    if (response) {
      return response;
    }

    throw error;
  }

  try {
    const body = await request.json();
    const partner = await updatePartnerProfile(params.id, body, sessionUser);
    return NextResponse.json(partner);
  } catch (error) {
    if (error instanceof PartnerValidationError) {
      return NextResponse.json({ message: error.message, issues: error.issues }, { status: 400 });
    }

    if (error instanceof PartnerNotFoundError) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }

    if (error instanceof PartnerAccessDeniedError) {
      return NextResponse.json({ message: error.message }, { status: 403 });
    }

    console.error('Failed to update partner profile', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
