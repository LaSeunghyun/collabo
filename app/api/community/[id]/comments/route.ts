import { NextRequest, NextResponse } from 'next/server';
import { eq, desc } from 'drizzle-orm';
import { randomUUID } from 'crypto';

import { getDbClient } from '@/lib/db/client';
import { comments, communityPosts, users } from '@/lib/db/schema';
import { handleAuthorizationError, requireApiUser } from '@/lib/auth/guards';
import type { SessionUser } from '@/lib/auth/session';


export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  
  try {
    const db = await getDbClient();
    
    // 게시글 존재 여부 확인
    const post = await db
      .select({ id: communityPosts.id })
      .from(communityPosts)
      .where(eq(communityPosts.id, id))
      .limit(1);
    
    if (!post[0]) {
      return NextResponse.json({ message: 'Post not found' }, { status: 404 });
    }
    
    // 댓글 목록 조회
    const commentsList = await db
      .select({
        id: comments.id,
        postId: comments.postId,
        content: comments.content,
        createdAt: comments.createdAt,
        author: {
          id: users.id,
          name: users.name,
          avatarUrl: users.avatarUrl
        }
      })
      .from(comments)
      .leftJoin(users, eq(comments.authorId, users.id))
      .where(eq(comments.postId, id))
      .orderBy(desc(comments.createdAt));

    return NextResponse.json(commentsList.map(comment => ({
      id: comment.id,
      postId: comment.postId,
      content: comment.content,
      authorName: comment.author?.name || 'Unknown',
      authorAvatar: comment.author?.avatarUrl || null,
      createdAt: comment.createdAt
    })));
  } catch (error) {
    console.error('Failed to load comments from database.', error);
    return NextResponse.json({ message: 'Unable to load comments.' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // CSRF 보호는 미들웨어에서 처리됨
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

  if (content.length < 1 || content.length > 1000) {
    return NextResponse.json({ 
      message: 'Content must be between 1 and 1000 characters.' 
    }, { status: 400 });
  }

  try {
    const db = await getDbClient();
    
    // 게시글 존재 여부 확인
    const post = await db
      .select({ id: communityPosts.id })
      .from(communityPosts)
      .where(eq(communityPosts.id, params.id))
      .limit(1);
    
    if (!post[0]) {
      return NextResponse.json({ message: 'Post not found.' }, { status: 404 });
    }

    // 댓글 생성
    const now = new Date().toISOString();
    const [newComment] = await db
      .insert(comments)
      .values({
        id: randomUUID(),
        postId: params.id,
        authorId: sessionUser.id,
        content: content,
        createdAt: now,
        updatedAt: now
      })
      .returning();

    if (!newComment) {
      throw new Error('Failed to create comment');
    }

    // 게시글의 댓글 수 증가 (현재 댓글 수 + 1)
    const currentPost = await db
      .select({ commentsCount: communityPosts.commentsCount })
      .from(communityPosts)
      .where(eq(communityPosts.id, params.id))
      .limit(1);
    
    if (currentPost[0]) {
      await db
        .update(communityPosts)
        .set({ 
          commentsCount: currentPost[0].commentsCount + 1,
          updatedAt: now
        })
        .where(eq(communityPosts.id, params.id));
    }

    // 작성자 정보 조회
    const author = await db
      .select({
        id: users.id,
        name: users.name,
        avatarUrl: users.avatarUrl
      })
      .from(users)
      .where(eq(users.id, sessionUser.id))
      .limit(1);

    return NextResponse.json({
      id: newComment.id,
      postId: newComment.postId,
      content: newComment.content,
      authorName: author[0]?.name || 'Unknown',
      authorAvatar: author[0]?.avatarUrl || null,
      createdAt: newComment.createdAt
    }, { status: 201 });
  } catch (error) {
    console.error('Failed to create comment in database.', error);
    return NextResponse.json({ message: 'Unable to create comment.' }, { status: 500 });
  }
}
