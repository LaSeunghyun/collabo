import { NextRequest, NextResponse } from 'next/server';

import { demoCommunityPosts } from '@/lib/data/community';

export async function GET() {
  return NextResponse.json(demoCommunityPosts);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  return NextResponse.json({ ...body, id: crypto.randomUUID(), likes: 0, comments: 0 }, { status: 201 });
}
