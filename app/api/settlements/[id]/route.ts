import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/server/api-utils';
import { getSettlement, updateSettlementStatus } from '@/lib/server/settlement-service';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const result = await getSettlement(params.id);
  
  if (result.success && 'data' in result) {
    return NextResponse.json(result.data);
  } else {
    return NextResponse.json(
      { message: result.message },
      { status: ('statusCode' in result ? result.statusCode : 404) }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(async (user, req) => {
    const body = await req.json();
    const { status } = body;

    return await updateSettlementStatus(params.id, status, user.id, user.role);
  }, request);
}
