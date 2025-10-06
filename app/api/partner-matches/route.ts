import { NextRequest, NextResponse } from 'next/server';
import { PartnerMatchStatus } from '@/types/drizzle';
import { withAuth, parsePaginationParams } from '@/lib/server/api-utils';
import { createPartnerMatch, getPartnerMatches } from '@/lib/server/partner-service';

export async function POST(request: NextRequest) {
  return withAuth(async (user, req) => {
    const body = await req.json();
    const { projectId, partnerId, requirements, notes } = body;

    return await createPartnerMatch({
      projectId,
      partnerId,
      requirements,
      notes
    }, user.id);
  }, request);
}

export async function GET(request: NextRequest) {
  const pagination = parsePaginationParams(request);
  const { searchParams } = new URL(request.url);
  
  const filters = {
    projectId: searchParams.get('projectId') || undefined,
    partnerId: searchParams.get('partnerId') || undefined,
    status: searchParams.get('status') as PartnerMatchStatus || undefined,
    userId: searchParams.get('userId') || undefined,
    page: pagination.page,
    limit: pagination.limit
  };

  const result = await getPartnerMatches(filters);
  
  if (result.success && 'data' in result) {
    return NextResponse.json(result.data);
  } else {
    return NextResponse.json(
      { message: result.message },
      { status: ('statusCode' in result ? result.statusCode : 400) }
    );
  }
}
