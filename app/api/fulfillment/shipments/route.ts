import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/server/api-utils';
import { createRewardFulfillment } from '@/lib/server/reward-fulfillment-service';

export async function POST(request: NextRequest) {
  return withAuth(async (user, req) => {
    const body = await req.json();
    const { orderItemId, rewardId, deliveryType, shippingInfo, trackingNumber, estimatedDelivery, notes } = body;

    return await createRewardFulfillment({
      orderItemId,
      rewardId,
      deliveryType,
      shippingInfo,
      trackingNumber,
      estimatedDelivery,
      notes
    }) as any;
  }, request);
}
