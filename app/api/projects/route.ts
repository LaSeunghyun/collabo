import { NextRequest, NextResponse } from 'next/server';
import { UserRole } from '@/types/shared';

import { handleAuthorizationError, requireApiUser } from '@/lib/auth/guards';
import { createProject, ProjectValidationError } from '@/lib/server/projects';

export async function GET() {
  try {
    // 간단??기본 ?�답?�로 ?�작
    return NextResponse.json([]);
  } catch (error) {
    console.error('Failed to load projects', error);

    // ???�세???�러 ?�보 ?�공
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
      return NextResponse.json({ message: '?�로?�트 ?�성???�패?�습?�다.' }, { status: 500 });
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
