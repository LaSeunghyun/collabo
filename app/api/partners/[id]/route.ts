import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/server/api-utils';
import { getPartner, updatePartner } from '@/lib/server/partner-service';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const result = await getPartner(params.id);
  
  if (result.success && 'data' in result) {
    return NextResponse.json(result.data);
  } else {
    return NextResponse.json(
      { message: result.message },
      { status: ('statusCode' in result ? result.statusCode : 404) }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(async (user, req) => {
    const body = await req.json();
    const { name, description, services, pricingModel, contactInfo, location, portfolioUrl, verified } = body;

    return await updatePartner(params.id, {
      name,
      description,
      services,
      pricingModel,
      contactInfo,
      location,
      portfolioUrl,
      verified
    }, user.id);
  }, request);
}