import { NextRequest, NextResponse } from 'next/server';
import { parsePaginationParams } from '@/lib/server/api-utils';
import { getFulfillmentStatus } from '@/lib/server/reward-fulfillment-service';

export async function GET(request: NextRequest) {
  const pagination = parsePaginationParams(request);
  const { searchParams } = new URL(request.url);
  
  const filters = {
    orderId: searchParams.get('orderId') || undefined,
    projectId: searchParams.get('projectId') || undefined,
    status: searchParams.get('status') || undefined,
    deliveryType: searchParams.get('deliveryType') as any || undefined,
    page: pagination.page,
    limit: pagination.limit
  };

  const result = await getFulfillmentStatus(filters);
  
  if (result.success) {
    return NextResponse.json((result as any).data);
  } else {
    return NextResponse.json(
      { message: result.message },
      { status: (result as any).statusCode || 400 }
    );
  }
}
