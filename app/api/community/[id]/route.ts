import { NextRequest, NextResponse } from 'next/server';

import { demoCommunityPosts } from '@/lib/data/community';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const post = demoCommunityPosts.find((item) => item.id === params.id);
  if (!post) {
    return NextResponse.json({ message: 'Post not found' }, { status: 404 });
  }

  return NextResponse.json(post);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const post = demoCommunityPosts.find((item) => item.id === params.id);
  if (!post) {
    return NextResponse.json({ message: 'Post not found' }, { status: 404 });
  }

  const body = await request.json();
  return NextResponse.json({ ...post, ...body });
}
