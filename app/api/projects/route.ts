import { NextRequest, NextResponse } from 'next/server';
import { UserRole } from '@/types/prisma';

import { handleAuthorizationError, requireApiUser } from '@/lib/auth/guards';
import { createProject, getProjectSummaries, ProjectValidationError } from '@/lib/server/projects';

export async function GET() {
  try {
    const projects = await getProjectSummaries();
    return NextResponse.json(projects);
  } catch (error) {
    console.error('Failed to load projects', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  let user;

  try {
    user = await requireApiUser({ roles: [UserRole.CREATOR, UserRole.ADMIN] });
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
