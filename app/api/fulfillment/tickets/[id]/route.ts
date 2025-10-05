import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/server/api-utils';
import { updateTicketStatus } from '@/lib/server/reward-fulfillment-service';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(async (user, req) => {
    const body = await req.json();
    const { status, notes } = body;

    return await updateTicketStatus(params.id, status, notes);
  }, request);
}
