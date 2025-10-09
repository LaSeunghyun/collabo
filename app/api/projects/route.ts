import { NextRequest, NextResponse } from 'next/server';
import { UserRole } from '@/types/shared';

import { handleAuthorizationError, requireApiUser } from '@/lib/auth/guards';
import { createProject, ProjectValidationError } from '@/lib/server/projects';

export async function GET() {
  try {
    // 간단한 기본 응답으로 시작
    return NextResponse.json([]);
  } catch (error) {
    console.error('Failed to load projects', error);

    // 상세한 에러 정보 제공
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
    user = await requireApiUser(authContext as any);
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