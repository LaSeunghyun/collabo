import { NextRequest, NextResponse } from 'next/server';
import { PartnerType } from '@prisma/client';
import { withAuth, parsePaginationParams } from '@/lib/server/api-utils';
import { createPartner, getPartners } from '@/lib/server/partner-service';

export async function POST(request: NextRequest) {
  return withAuth(async (user, req) => {
    const body = await req.json();
    const { type, name, description, services, pricingModel, contactInfo, location, portfolioUrl } = body;

    return await createPartner({
      userId: user.id,
      type,
      name,
      description,
      services,
      pricingModel,
      contactInfo,
      location,
      portfolioUrl
    });
  }, request);
}

export async function GET(request: NextRequest) {
  const pagination = parsePaginationParams(request);
  const { searchParams } = new URL(request.url);
  
  const filters = {
    type: searchParams.get('type') as PartnerType || undefined,
    verified: searchParams.get('verified') === 'true' ? true : searchParams.get('verified') === 'false' ? false : undefined,
    location: searchParams.get('location') || undefined,
    search: searchParams.get('search') || undefined,
    page: pagination.page,
    limit: pagination.limit
  };

  const result = await getPartners(filters);
  
  if (result.success && 'data' in result) {
    return NextResponse.json(result.data);
  } else {
    return NextResponse.json(
      { message: result.message },
      { status: ('statusCode' in result ? result.statusCode : 400) }
    );
  }
}