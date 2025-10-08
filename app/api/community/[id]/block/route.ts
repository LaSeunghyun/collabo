import { NextRequest, NextResponse } from 'next/server';


export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id } = params;
  const body = await request.json().catch(() => ({}));
  const blockerId = typeof body.blockerId === 'string' ? body.blockerId : undefined;

  if (!blockerId) {
    return NextResponse.json({ message: 'blockerId is required.' }, { status: 400 });
  }

  try {
    // TODO: Drizzle로 전환 필요
    const post = { authorId: 'temp-author-id' };

    if (!post) {
      return NextResponse.json({ message: 'Post not found.' }, { status: 404 });
    }

    if (post.authorId === blockerId) {
      return NextResponse.json({ message: 'You cannot block yourself.' }, { status: 400 });
    }

    // TODO: Drizzle로 전환 필요
    const block = { 
      id: 'temp-block-id',
      blockerId,
      blockedUserId: post.authorId,
      createdAt: new Date()
    };

    return NextResponse.json(
      {
        id: block.id,
        blockerId: block.blockerId,
        blockedUserId: block.blockedUserId,
        createdAt: block.createdAt.toISOString()
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Failed to block user', error);
    return NextResponse.json({ message: 'Unable to block user.' }, { status: 500 });
  }
}
