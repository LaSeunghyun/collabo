import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/server/api-utils';
import { processSettlementPayout } from '@/lib/server/settlement-service';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(async (user, req) => {
    const body = await req.json();
    const { status, notes } = body;

    return await processSettlementPayout(params.id, status, user.id, user.role, notes);
  }, request);
}
