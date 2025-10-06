import { NextRequest, NextResponse } from 'next/server';
import { withAuth, parsePaginationParams } from '@/lib/server/api-utils';
import { createSettlement, getSettlements, autoCreateSettlement } from '@/lib/server/settlement-service';

export async function POST(request: NextRequest) {
  return withAuth(async (user, req) => {
    const body = await req.json();
    const { projectId, netAmount, platformFee, stakeholders, metadata } = body;

    // 자동 정산 생성인지 확인
    if (body.autoCreate && projectId) {
      return await autoCreateSettlement(projectId);
    }

    return await createSettlement({
      projectId,
      netAmount,
      platformFee,
      stakeholders,
      metadata
    });
  }, request);
}

export async function GET(request: NextRequest) {
  const pagination = parsePaginationParams(request);
  const { searchParams } = new URL(request.url);
  
  const filters = {
    projectId: searchParams.get('projectId') || undefined,
    status: searchParams.get('status') || undefined,
    stakeholderId: searchParams.get('stakeholderId') || undefined,
    page: pagination.page,
    limit: pagination.limit
  };

  const result = await getSettlements(filters);
  
  if (result.success && 'data' in result) {
    return NextResponse.json(result.data);
  } else {
    return NextResponse.json(
      { message: result.message },
      { status: ('statusCode' in result ? result.statusCode : 400) }
    );
  }
}
