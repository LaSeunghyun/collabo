import { NextRequest, NextResponse } from 'next/server';

import { handleAuthorizationError, requireApiUser } from '@/lib/auth/guards';
import type { SessionUser } from '@/lib/auth/session';

function formatComment(comment: {
  id: string;
  postId: string;
  content: string;
  createdAt: Date;
  author?: { name: string | null } | null;
}) {
  return {
    id: comment.id,
    postId: comment.postId,
    content: comment.content,
    authorName: comment.author?.name ?? 'Guest',
    createdAt: comment.createdAt.toISOString()
  };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id } = params;
  try {
    // 댓글 조회 기능은 추후 구현 예정
    const comments: any[] = [];

    return NextResponse.json(comments.map((comment: { id: string; postId: string; content: string; createdAt: Date; author?: { name: string | null } | null }) => formatComment(comment)));
  } catch (error) {
    console.error('Failed to load comments from database.', error);
    return NextResponse.json({ message: 'Unable to load comments.' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  let sessionUser: SessionUser;
  const authContext = { headers: request.headers };

  try {
    sessionUser = await requireApiUser({}, authContext);
  } catch (error) {
    const response = handleAuthorizationError(error);
    if (response) {
      return response;
    }

    throw error;
  }

  const body = await request.json();
  const content = body.content?.trim();

  if (!content) {
    return NextResponse.json({ message: 'Content is required.' }, { status: 400 });
  }

  try {
    // 게시글 확인 (추후 구현 예정)
    const post = { id: params.id };
    if (!post) {
      return NextResponse.json({ message: 'Post not found.' }, { status: 404 });
    }

    // 댓글 생성 (추후 구현 예정)
    const comment = {
      id: 'temp-comment-id',
      content,
      postId: params.id,
      authorId: sessionUser.id,
      createdAt: new Date(),
      author: { name: 'Guest' }
    };

    return NextResponse.json(formatComment(comment), { status: 201 });
  } catch (error) {
    console.error('Failed to create comment in database.', error);
    return NextResponse.json({ message: 'Unable to create comment.' }, { status: 500 });
  }
}
