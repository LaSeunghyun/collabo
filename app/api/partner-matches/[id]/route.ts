import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/server/api-utils';
import { respondToPartnerMatch } from '@/lib/server/partner-service';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(async (user, req) => {
    const body = await req.json();
    const { status, quote, settlementShare, contractUrl, responseMessage, notes } = body;

    return await respondToPartnerMatch(params.id, {
      status,
      quote,
      settlementShare,
      contractUrl,
      responseMessage,
      notes
    }, user.id);
  }, request);
}
