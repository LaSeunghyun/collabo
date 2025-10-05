import { NextRequest, NextResponse } from 'next/server';
import { withAuth, parsePaginationParams } from '@/lib/server/api-utils';
import { createPost, getPosts } from '@/lib/server/community-service';

export async function POST(request: NextRequest) {
  return withAuth(async (user, req) => {
    const body = await req.json();
    const { title, content, category, projectId, isAnonymous, attachments } = body;

    return await createPost({
      title,
      content,
      category,
      projectId,
      isAnonymous,
      attachments,
      authorId: user.id
    });
  }, request);
}

export async function GET(request: NextRequest) {
  const pagination = parsePaginationParams(request);
  const { searchParams } = new URL(request.url);
  
  const filters = {
    projectId: searchParams.get('projectId') || undefined,
    authorId: searchParams.get('authorId') || undefined,
    category: searchParams.get('category') as any || undefined,
    status: searchParams.get('status') as any || undefined,
    search: searchParams.get('search') || undefined,
    page: pagination.page,
    limit: pagination.limit
  };

  const result = await getPosts(filters);
  
  if (result.success && 'data' in result) {
    return NextResponse.json(result.data);
  } else {
    return NextResponse.json(
      { message: result.message },
      { status: ('statusCode' in result ? result.statusCode : 400) }
    );
  }
}