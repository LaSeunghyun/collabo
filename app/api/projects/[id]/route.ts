import { NextRequest, NextResponse } from 'next/server';
// import { userRole } from '@/drizzle/schema';

import { handleAuthorizationError, requireApiUser } from '@/lib/auth/guards';
import {
  deleteProject,
  getProjectSummaryById,
  ProjectAccessDeniedError,
  ProjectNotFoundError,
  ProjectValidationError,
  updateProject
} from '@/lib/server/projects';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const project = await getProjectSummaryById(params.id);
  if (!project) {
    return NextResponse.json({ message: 'Project not found' }, { status: 404 });
  }

  return NextResponse.json(project);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  let user;
  const authContext = { headers: request.headers };

  try {
    user = await requireApiUser({ roles: ['CREATOR', 'ADMIN'] }, authContext);
  } catch (error) {
    const response = handleAuthorizationError(error);
    if (response) {
      return response;
    }

    throw error;
  }

  try {
    const body = await request.json();
    const project = await updateProject(params.id, body, user);

    if (!project) {
      return NextResponse.json({ message: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json(project);
  } catch (error) {
    if (error instanceof ProjectValidationError) {
      return NextResponse.json(
        { message: error.message, issues: error.issues },
        { status: 400 }
      );
    }

    if (error instanceof ProjectNotFoundError) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }

    if (error instanceof ProjectAccessDeniedError) {
      return NextResponse.json({ message: error.message }, { status: 403 });
    }

    console.error('Failed to update project', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  let user;
  const authContext = { headers: request.headers };

  try {
    user = await requireApiUser({ roles: ['CREATOR', 'ADMIN'] }, authContext);
  } catch (error) {
    const response = handleAuthorizationError(error);
    if (response) {
      return response;
    }

    throw error;
  }

  try {
    await deleteProject(params.id, user);
    return NextResponse.json({ message: 'Deleted' }, { status: 200 });
  } catch (error) {
    if (error instanceof ProjectNotFoundError) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }

    if (error instanceof ProjectAccessDeniedError) {
      return NextResponse.json({ message: error.message }, { status: 403 });
    }

    console.error('Failed to delete project', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
