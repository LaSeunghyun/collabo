import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/server/api-utils';
import { updateShipmentStatus } from '@/lib/server/reward-fulfillment-service';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(async (user, req) => {
    const body = await req.json();
    const { status, trackingNumber, notes } = body;

    return await updateShipmentStatus(params.id, status, trackingNumber, notes);
  }, request);
}
