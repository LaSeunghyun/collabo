import { NextRequest, NextResponse } from 'next/server';
import { getServerAuthSession } from '@/lib/auth/session';

const unauthorized = () =>
  NextResponse.json({ message: 'Authentication required to follow artists.' }, { status: 401 });

const cannotFollowSelf = () =>
  NextResponse.json({ message: 'You cannot follow yourself.' }, { status: 400 });

const getFollowerCount = () => Promise.resolve(0);

const notFound = () => NextResponse.json({ message: 'Artist not found' }, { status: 404 });

const ensureArtistExists = async () => {
  // 아티스트 존재 확인 기능은 추후 구현 예정
  return true;
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

  if (!(await ensureArtistExists())) {
    return notFound();
  }

  try {
    // 팔로우 기능은 추후 구현 예정
    console.log('Follow artist:', { artistId: params.id, userId: session.user.id });
  } catch (error) {
    console.error('Failed to follow artist', error);
    return NextResponse.json({ message: 'Could not follow artist.' }, { status: 500 });
  }

  const followerCount = await getFollowerCount();
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

  if (!(await ensureArtistExists())) {
    return notFound();
  }

  try {
    // 언팔로우 기능은 추후 구현 예정
    console.log('Unfollow artist:', { artistId: params.id, userId: session.user.id });
  } catch (error) {
    console.error('Failed to unfollow artist', error);
    return NextResponse.json({ message: 'Could not unfollow artist.' }, { status: 500 });
  }

  const followerCount = await getFollowerCount();
  return NextResponse.json({ followerCount, isFollowing: false });
}
