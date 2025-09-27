import { NextRequest, NextResponse } from 'next/server';

import { getArtistProfile } from '@/lib/server/artists';
import { getServerAuthSession } from '@/lib/auth/session';

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerAuthSession();
  const profile = await getArtistProfile(params.id, session?.user ?? null);

  if (!profile) {
    return NextResponse.json({ message: 'Artist not found' }, { status: 404 });
  }

  return NextResponse.json(profile);
}
