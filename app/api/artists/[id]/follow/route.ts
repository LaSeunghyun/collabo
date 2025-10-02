import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';

import { getServerAuthSession } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';

const unauthorized = () =>
  NextResponse.json({ message: 'Authentication required to follow artists.' }, { status: 401 });

const cannotFollowSelf = () =>
  NextResponse.json({ message: 'You cannot follow yourself.' }, { status: 400 });

const getFollowerCount = (artistId: string) => prisma.userFollow.count({ where: { followingId: artistId } });

const notFound = () => NextResponse.json({ message: 'Artist not found' }, { status: 404 });

const ensureArtistExists = async (artistId: string) => {
  const exists = await prisma.user.findUnique({ where: { id: artistId }, select: { id: true } });
  return Boolean(exists);
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
    await prisma.userFollow.create({
      data: {
        followerId: session.user.id,
        followingId: artistId
      }
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      // Already following ??ignore duplicate.
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
    await prisma.userFollow.delete({
      where: {
        followerId_followingId: {
          followerId: session.user.id,
          followingId: artistId
        }
      }
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      // Not following ??ignore.
    } else {
      console.error('Failed to unfollow artist', error);
      return NextResponse.json({ message: 'Could not unfollow artist.' }, { status: 500 });
    }
  }

  const followerCount = await getFollowerCount(artistId);
  return NextResponse.json({ followerCount, isFollowing: false });
}
