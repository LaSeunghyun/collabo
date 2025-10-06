import { NextRequest, NextResponse } from 'next/server';

import { getArtistProfile } from '@/lib/server/artists';
import { getServerAuthSession } from '@/lib/auth/session';
import { responses } from '@/lib/server/api-responses';

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerAuthSession();
  const profile = await getArtistProfile(params.id, session?.user as any ?? null);

  if (!profile) {
    return NextResponse.json(responses.notFound('Artist'), { status: 404 });
  }

  return NextResponse.json(responses.success(profile));
}
