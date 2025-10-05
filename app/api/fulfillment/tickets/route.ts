import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/server/api-utils';
import { createTicketFulfillment } from '@/lib/server/reward-fulfillment-service';

export async function POST(request: NextRequest) {
  return withAuth(async (user, req) => {
    const body = await req.json();
    const { orderItemId, rewardId, eventDate, venue, seat, notes } = body;

    return await createTicketFulfillment({
      orderItemId,
      rewardId,
      eventDate: new Date(eventDate),
      venue,
      seat,
      notes
    });
  }, request);
}
