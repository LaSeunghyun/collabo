import { NextRequest, NextResponse } from 'next/server';
import { withAuth, parsePaginationParams } from '@/lib/server/api-utils';
import { createProject, getProjects } from '@/lib/server/project-service';

export async function POST(request: NextRequest) {

  return withAuth(async (user, req) => {
    const body = await req.json();
    const {
      title,
      description,
      category,
      targetAmount,
      endDate,
      currency = 'KRW',
      thumbnail,
      metadata
    } = body;

    return await createProject({
      title,
      description,
      category,
      targetAmount: parseInt(targetAmount),
      currency,
      endDate: endDate ? new Date(endDate) : undefined,
      thumbnail,
      metadata,
      ownerId: user.id
    });
  }, request);
}

export async function GET(request: NextRequest) {
  const pagination = parsePaginationParams(request);
  const { searchParams } = new URL(request.url);
  
  const filters = {
    status: searchParams.get('status') as any || undefined,
    category: searchParams.get('category') || undefined,
    ownerId: searchParams.get('ownerId') || undefined,
    search: searchParams.get('search') || undefined,
    page: pagination.page,
    limit: pagination.limit
  };

  const result = await getProjects(filters);
  
  if (result.success && 'data' in result) {
    // getProjects??{ projects, pagination } ?•íƒœë¡?ë°˜í™˜?˜ë?ë¡?projects ë°°ì—´ë§?ë°˜í™˜
    return NextResponse.json(result.data?.projects || []);
  } else {
    return NextResponse.json(
      { message: result.message },
      { status: ('statusCode' in result ? result.statusCode : 400) }
    );
  }
}
