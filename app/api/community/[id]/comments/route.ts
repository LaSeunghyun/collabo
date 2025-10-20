import { NextRequest, NextResponse } from 'next/server';
import { eq, and, desc } from 'drizzle-orm';
import { randomUUID } from 'crypto';

import { comments, posts, users } from '@/lib/db/schema';
import { getDb } from '@/lib/db/client';
import { handleAuthorizationError, requireApiUser } from '@/lib/auth/guards';
import type { SessionUser } from '@/lib/auth/session';

function formatComment(comment: {
  id: string;
  postId: string;
  content: string;
  createdAt: Date | string;
  author?: { name: string | null } | null;
}) {
  return {
    id: comment.id,
    postId: comment.postId,
    content: comment.content,
    authorName: comment.author?.name ?? 'Guest',
    createdAt: (comment.createdAt instanceof Date)
      ? comment.createdAt.toISOString()
      : new Date(comment.createdAt).toISOString()
  };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  try {
    const db = await getDb();

    // 게시글 존재 여부 확인
    const postExists = await db
      .select({ id: posts.id })
      .from(posts)
      .where(eq(posts.id, id))
      .limit(1);

    if (!postExists[0]) {
      return NextResponse.json({ message: 'Post not found.' }, { status: 404 });
    }

    // 댓글 조회 (작성자 정보 포함)
    const commentsResult = await db
      .select({
        id: comments.id,
        postId: comments.postId,
        content: comments.content,
        createdAt: comments.createdAt,
        author: {
          name: users.name
        }
      })
      .from(comments)
      .leftJoin(users, eq(comments.authorId, users.id))
      .where(and(
        eq(comments.postId, id),
        eq(comments.isDeleted, false)
      ))
      .orderBy(desc(comments.createdAt));

    return NextResponse.json(commentsResult.map(formatComment));
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
    const db = await getDb();

    // 게시글 존재 여부 확인
    const postExists = await db
      .select({ id: posts.id })
      .from(posts)
      .where(eq(posts.id, params.id))
      .limit(1);

    if (!postExists[0]) {
      return NextResponse.json({ message: 'Post not found.' }, { status: 404 });
    }

    // 댓글 생성
    const [newComment] = await db
      .insert(comments)
      .values({
        id: randomUUID(),
        postId: params.id,
        authorId: sessionUser.id,
        content,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isDeleted: false
      })
      .returning({
        id: comments.id,
        postId: comments.postId,
        content: comments.content,
        createdAt: comments.createdAt
      });

    // 작성자 정보 조회
    const [author] = await db
      .select({
        name: users.name
      })
      .from(users)
      .where(eq(users.id, sessionUser.id))
      .limit(1);

    const commentWithAuthor = {
      ...newComment,
      author: { name: author?.name || 'Unknown' }
    };

    return NextResponse.json(formatComment(commentWithAuthor), { status: 201 });
  } catch (error) {
    console.error('Failed to create comment in database.', error);
    return NextResponse.json({ message: 'Unable to create comment.' }, { status: 500 });
  }
}
