import { NextRequest, NextResponse } from 'next/server';

import { measureApiTime } from '@/lib/utils/performance';
import { API_LIMITS, CACHE_TTL as CONFIG_CACHE_TTL } from '@/lib/constants/app-config';
import { listFeaturedArtists } from '@/lib/server/artists';

// 캐싱 설정
export const revalidate = CONFIG_CACHE_TTL.ARTISTS / 1000; // 초 단위로 변환

export async function GET(request: NextRequest) {
  return measureApiTime('artists-api', async () => {
    const { searchParams } = new URL(request.url);
    const limitParam = Number.parseInt(searchParams.get('limit') ?? String(API_LIMITS.ARTISTS.DEFAULT_LIMIT), 10);
    const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, API_LIMITS.ARTISTS.MAX_LIMIT) : API_LIMITS.ARTISTS.DEFAULT_LIMIT;
    
    try {
      // 실제 DB에서 아티스트 조회
      const artists = await listFeaturedArtists();
      
      // 응답 형식을 기존 프론트엔드와 호환되도록 매핑
      const mappedArtists = artists.slice(0, limit).map(artist => ({
        id: artist.id,
        name: artist.name,
        bio: artist.bio,
        avatarUrl: artist.avatarUrl,
        projectCount: artist.projectCount,
        followerCount: artist.followerCount
      }));
      
      const response = { artists: mappedArtists };
      
      return NextResponse.json(response, {
        headers: {
          'Cache-Control': `public, s-maxage=${CONFIG_CACHE_TTL.ARTISTS / 1000}, stale-while-revalidate=${CONFIG_CACHE_TTL.ARTISTS / 500}`,
          'X-Cache-Status': 'HIT'
        }
      });
    } catch (error) {
      console.error('Failed to load artists', error);
      return NextResponse.json(
        { message: 'Failed to load artists', error: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      );
    }
  });
}
