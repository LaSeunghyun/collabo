import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { users, userFollows } from '@/lib/db/schema';
import { eq, and, count } from 'drizzle-orm';
import { getServerAuthSession } from '@/lib/auth/session';

const unauthorized = () =>
  NextResponse.json({ message: 'Authentication required to follow artists.' }, { status: 401 });

const cannotFollowSelf = () =>
  NextResponse.json({ message: 'You cannot follow yourself.' }, { status: 400 });

const notFound = () => NextResponse.json({ message: 'Artist not found' }, { status: 404 });

const getFollowerCount = async (artistId: string): Promise<number> => {
  const [result] = await db
    .select({ count: count() })
    .from(userFollows)
    .where(eq(userFollows.followingId, artistId));
  
  return result?.count ?? 0;
};

const ensureArtistExists = async (artistId: string): Promise<boolean> => {
  const [artist] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, artistId))
    .limit(1);
  
  return !!artist;
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
    await db.insert(userFollows).values({
      followerId: session.user.id,
      followingId: artistId
    });
  } catch (error: any) {
    // Check if it's a unique constraint violation (already following)
    if (error?.code === '23505') {
      // Already following - ignore duplicate
    } else {
      console.error('Failed to follow artist', error);
      return NextResponse.json({ message: 'Could not follow artist.' }, { status: 500 });
    }
  }

  const followerCount = await getFollowerCount(artistId);
  return NextResponse.json({ followerCount, isFollowing: true });
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
    await db
      .delete(userFollows)
      .where(and(
        eq(userFollows.followerId, session.user.id),
        eq(userFollows.followingId, artistId)
      ));
  } catch (error: any) {
    // Check if it's a not found error (not following)
    if (error?.code === 'P2025') {
      // Not following - ignore
    } else {
      console.error('Failed to unfollow artist', error);
      return NextResponse.json({ message: 'Could not unfollow artist.' }, { status: 500 });
    }
  }

  const followerCount = await getFollowerCount(artistId);
  return NextResponse.json({ followerCount, isFollowing: false });
}
