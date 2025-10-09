import { NextRequest, NextResponse } from 'next/server';
import { eq, and, count } from 'drizzle-orm';
import { randomUUID } from 'crypto';

import { getDbClient } from '@/lib/db/client';
import { userFollows, users } from '@/lib/db/schema';
import { getServerAuthSession } from '@/lib/auth/session';

const unauthorized = () =>
  NextResponse.json({ message: 'Authentication required to follow artists.' }, { status: 401 });

const cannotFollowSelf = () =>
  NextResponse.json({ message: 'You cannot follow yourself.' }, { status: 400 });

const notFound = () => NextResponse.json({ message: 'Artist not found' }, { status: 404 });

const ensureArtistExists = async (artistId: string) => {
  const db = await getDbClient();
  const artist = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, artistId))
    .limit(1);
  
  return artist.length > 0;
};

const getFollowerCount = async (artistId: string) => {
  const db = await getDbClient();
  const result = await db
    .select({ count: count() })
    .from(userFollows)
    .where(eq(userFollows.followingId, artistId));
  
  return result[0]?.count || 0;
};

const isFollowing = async (userId: string, artistId: string) => {
  const db = await getDbClient();
  const follow = await db
    .select({ id: userFollows.id })
    .from(userFollows)
    .where(and(
      eq(userFollows.followerId, userId),
      eq(userFollows.followingId, artistId)
    ))
    .limit(1);
  
  return follow.length > 0;
};

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  // CSRF 보호는 미들웨어에서 처리됨
  const session = await getServerAuthSession();

  if (!session?.user?.id) {
    return unauthorized();
  }

  const artistId = params.id;

  if (session.user.id === artistId) {
    return cannotFollowSelf();
  }

  if (!(await ensureArtistExists(artistId))) {
    return notFound();
  }

  try {
    const db = await getDbClient();
    
    // 이미 팔로우 중인지 확인
    const alreadyFollowing = await isFollowing(session.user.id, artistId);
    if (alreadyFollowing) {
      const followerCount = await getFollowerCount(artistId);
      return NextResponse.json({ 
        message: 'Already following this artist',
        followerCount, 
        isFollowing: true 
      });
    }

    // 팔로우 관계 생성
    const now = new Date().toISOString();
    await db
      .insert(userFollows)
      .values({
        id: randomUUID(),
        followerId: session.user.id,
        followingId: artistId,
        createdAt: now
      });

    const followerCount = await getFollowerCount(artistId);
    return NextResponse.json({ 
      message: 'Successfully followed artist',
      followerCount, 
      isFollowing: true 
    });
  } catch (error) {
    console.error('Failed to follow artist', error);
    return NextResponse.json({ message: 'Could not follow artist.' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  // CSRF 보호는 미들웨어에서 처리됨
  const session = await getServerAuthSession();

  if (!session?.user?.id) {
    return unauthorized();
  }

  const artistId = params.id;

  if (session.user.id === artistId) {
    return cannotFollowSelf();
  }

  if (!(await ensureArtistExists(artistId))) {
    return notFound();
  }

  try {
    const db = await getDbClient();
    
    // 팔로우 관계가 존재하는지 확인
    const isCurrentlyFollowing = await isFollowing(session.user.id, artistId);
    if (!isCurrentlyFollowing) {
      const followerCount = await getFollowerCount(artistId);
      return NextResponse.json({ 
        message: 'Not following this artist',
        followerCount, 
        isFollowing: false 
      });
    }

    // 팔로우 관계 삭제
    await db
      .delete(userFollows)
      .where(and(
        eq(userFollows.followerId, session.user.id),
        eq(userFollows.followingId, artistId)
      ));

    const followerCount = await getFollowerCount(artistId);
    return NextResponse.json({ 
      message: 'Successfully unfollowed artist',
      followerCount, 
      isFollowing: false 
    });
  } catch (error) {
    console.error('Failed to unfollow artist', error);
    return NextResponse.json({ message: 'Could not unfollow artist.' }, { status: 500 });
  }
}
