import { NextRequest, NextResponse } from 'next/server';
import { withAuth, parsePaginationParams } from '@/lib/server/api-utils';
import { createOrder, getOrders } from '@/lib/server/order-service';

export async function POST(request: NextRequest) {
  return withAuth(async (user, req) => {
    const body = await req.json();
    const { projectId, items, shippingInfo, metadata } = body;

    return await createOrder({
      userId: user.id,
      projectId,
      items,
      shippingInfo,
      metadata
    });
  }, request);
}

export async function GET(request: NextRequest) {
  const pagination = parsePaginationParams(request);
  const { searchParams } = new URL(request.url);
  
  const filters = {
    userId: searchParams.get('userId') || undefined,
    projectId: searchParams.get('projectId') || undefined,
    orderStatus: searchParams.get('orderStatus') as any || undefined,
    page: pagination.page,
    limit: pagination.limit
  };

  const result = await getOrders(filters);
  
  if (result.success && 'data' in result) {
    return NextResponse.json(result.data);
  } else {
    return NextResponse.json(
      { message: result.message },
      { status: ('statusCode' in result ? result.statusCode : 400) }
    );
  }
}
