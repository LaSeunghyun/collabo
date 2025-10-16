import { NextRequest, NextResponse } from 'next/server';

import { listFeaturedArtists } from '@/lib/server/artists';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limitParam = Number.parseInt(searchParams.get('limit') ?? '12', 10);
  const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 24) : 12;
  const artists = await listFeaturedArtists();
  return NextResponse.json({ artists: artists.slice(0, limit) });
}
