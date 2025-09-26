import { NextRequest, NextResponse } from 'next/server';

import prisma from '@/lib/prisma';

import { addDemoCommunityPost, listDemoCommunityPosts } from '@/lib/data/community';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sortParam = searchParams.get('sort');
  const sort = sortParam === 'popular' ? 'popular' : 'recent';
  const projectId = searchParams.get('projectId') ?? undefined;

  try {
    const posts = await prisma.post.findMany({
      where: projectId ? { projectId } : undefined,
      include: {
        _count: { select: { likes: true, comments: true } }
      },
      orderBy:
        sort === 'popular'
          ? {
            likes: {
              _count: 'desc'
            }
          }
          : { createdAt: 'desc' }
    });

    return NextResponse.json(
      posts.map((post: { id: string; title: string; content: string; _count: { likes: number; comments: number }; projectId: string | undefined; createdAt: Date }) => ({
        id: post.id,
        title: post.title,
        content: post.content,
        likes: post._count.likes,
        comments: post._count.comments,
        projectId: post.projectId ?? undefined,
        createdAt: post.createdAt.toISOString(),
        liked: false
      }))
    );
  } catch (error) {
    console.error('Failed to fetch posts from database, using demo data instead.', error);
    return NextResponse.json(listDemoCommunityPosts(projectId, sort));
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const title = body.title?.trim();
  const content = body.content?.trim();
  const projectId = body.projectId ? String(body.projectId) : undefined;
  const authorId = body.authorId ? String(body.authorId) : undefined;

  if (!title || !content) {
    return NextResponse.json({ message: 'Title and content are required.' }, { status: 400 });
  }

  try {
    if (!authorId) {
      throw new Error('Missing authorId for persistent post creation.');
    }

    const post = await prisma.post.create({
      data: {
        title,
        content,
        ...(projectId
          ? {
            project: {
              connect: { id: projectId }
            }
          }
          : {}),
        author: {
          connect: { id: authorId }
        }
      }
    });

    return NextResponse.json(
      {
        id: post.id,
        title: post.title,
        content: post.content,
        likes: 0,
        comments: 0,
        projectId: post.projectId ?? undefined,
        createdAt: post.createdAt.toISOString(),
        liked: false
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Failed to create post in database, falling back to demo store.', error);

    const fallbackPost = addDemoCommunityPost({
      id: crypto.randomUUID(),
      title,
      content,
      likes: 0,
      comments: 0,
      projectId,
      createdAt: new Date().toISOString(),
      liked: false
    });

    return NextResponse.json(fallbackPost, { status: 201 });
  }
}
