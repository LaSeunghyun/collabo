import { NextRequest, NextResponse } from 'next/server';
import { UserRole } from '@/types/shared';

import { handleAuthorizationError, requireApiUser } from '@/lib/auth/guards';
import { createProject, ProjectValidationError, getProjectSummaries } from '@/lib/server/projects';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    // 필터 옵션 구성
    const options: any = {
      take: Math.min(limit, 100)
    };

    if (status) {
      options.statuses = [status];
    }

    const projects = await getProjectSummaries(options);
    return NextResponse.json(projects);
  } catch (error) {
    console.error('프로젝트 로드 실패', error);

    // 상세한 오류 정보 제공
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
    const errorStack = error instanceof Error ? error.stack : undefined;

    return NextResponse.json({
      error: '프로젝트를 불러오는데 실패했습니다.',
      details: errorMessage,
      ...(process.env.NODE_ENV === 'development' && { stack: errorStack })
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  let user;
  const authContext = { headers: request.headers };

  try {
    user = await requireApiUser(
      {} as GuardRequirement,
      authContext
    );
  } catch (error) {
    return handleAuthorizationError(error);
  }

  if (user.role !== UserRole.CREATOR && user.role !== UserRole.ADMIN) {
    return NextResponse.json(
      { error: '프로젝트 생성 권한이 없습니다.' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const project = await createProject(body, user.id);

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error('프로젝트 생성 실패:', error);

    if (error instanceof ProjectValidationError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: '프로젝트 생성에 실패했습니다.' },
      { status: 500 }
    );
  }
}