import { NextRequest, NextResponse } from 'next/server';
import { eq, and, count } from 'drizzle-orm';

import { userFollows, users } from '@/lib/db/schema';
import { getDb } from '@/lib/db/client';
import { getServerAuthSession } from '@/lib/auth/session';

const unauthorized = () =>
  NextResponse.json({ message: 'Authentication required to follow artists.' }, { status: 401 });

const cannotFollowSelf = () =>
  NextResponse.json({ message: 'You cannot follow yourself.' }, { status: 400 });

const notFound = () => NextResponse.json({ message: 'Artist not found' }, { status: 404 });

const getFollowerCount = async (artistId: string) => {
  const db = await getDb();
  const [result] = await db
    .select({ count: count() })
    .from(userFollows)
    .where(eq(userFollows.followingId, artistId));
  return result?.count || 0;
};

const ensureArtistExists = async (artistId: string) => {
  const db = await getDb();
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, artistId))
    .limit(1);
  return Boolean(user);
};

export async function POST(_request: NextRequest, { params }: { params: { id: string } }) {
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
    const db = await getDb();

    // 중복 팔로우 확인
    const existingFollow = await db
      .select({ id: userFollows.id })
      .from(userFollows)
      .where(and(
        eq(userFollows.followerId, session.user.id),
        eq(userFollows.followingId, artistId)
      ))
      .limit(1);

    if (existingFollow[0]) {
      const followerCount = await getFollowerCount(artistId);
      return NextResponse.json({ followerCount, isFollowing: true });
    }

    // 팔로우 생성
    await db
      .insert(userFollows)
      .values({
        id: crypto.randomUUID(),
        followerId: session.user.id,
        followingId: artistId,
        createdAt: new Date().toISOString()
      });

    const followerCount = await getFollowerCount(artistId);
    return NextResponse.json({ followerCount, isFollowing: true });
  } catch (error) {
    console.error('Failed to follow artist', error);
    return NextResponse.json({ message: 'Could not follow artist.' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
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
    const db = await getDb();

    // 팔로우 삭제
    await db
      .delete(userFollows)
      .where(and(
        eq(userFollows.followerId, session.user.id),
        eq(userFollows.followingId, artistId)
      ));

    const followerCount = await getFollowerCount(artistId);
    return NextResponse.json({ followerCount, isFollowing: false });
  } catch (error) {
    console.error('Failed to unfollow artist', error);
    return NextResponse.json({ message: 'Could not unfollow artist.' }, { status: 500 });
  }
}
