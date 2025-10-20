import { NextRequest, NextResponse } from 'next/server';
import { UserRole } from '@/types/prisma';

import { handleAuthorizationError, requireApiUser } from '@/lib/auth/guards';
import { createProject, ProjectValidationError, getProjectSummaries } from '@/lib/server/projects';

// 캐싱 설정
export const revalidate = 60; // 1분마다 재검증

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const limit = Number.parseInt(searchParams.get('limit') ?? '10', 10);

    // 필터 옵션 구성
    const options: any = {
      take: Math.min(limit, 50) // 최대 50개로 제한
    };

    if (category && category !== 'all') {
      // 카테고리 필터링은 getProjectSummaries에서 직접 처리하지 않으므로
      // 여기서는 모든 프로젝트를 가져온 후 필터링
    }

    if (status) {
      options.statuses = [status];
    }

    // 실제 DB에서 프로젝트 조회
    const projects = await getProjectSummaries(options);

    // 카테고리 필터링 (DB에서 직접 필터링이 어려운 경우)
    const filteredProjects = category && category !== 'all' 
      ? projects.filter(project => project.category === category)
      : projects;

    return NextResponse.json(filteredProjects, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        'X-Cache-Status': 'HIT'
      }
    });
  } catch (error) {
    console.error('Failed to load projects', error);

    // 더 자세한 에러 정보 제공
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;

    return NextResponse.json({
      message: 'Failed to load projects',
      error: errorMessage,
      ...(process.env.NODE_ENV === 'development' && { stack: errorStack })
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  let user;
  const authContext = { headers: request.headers };

  try {
    user = await requireApiUser({ roles: [UserRole.CREATOR, UserRole.ADMIN] }, authContext);
  } catch (error) {
    const response = handleAuthorizationError(error);
    if (response) {
      return response;
    }

    throw error;
  }

  try {
    const body = await request.json();
    const project = await createProject(body, user);

    if (!project) {
      return NextResponse.json({ message: '프로젝트 생성에 실패했습니다.' }, { status: 500 });
    }

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    if (error instanceof ProjectValidationError) {
      return NextResponse.json(
        { message: error.message, issues: error.issues },
        { status: 400 }
      );
    }

    console.error('Failed to create project', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
