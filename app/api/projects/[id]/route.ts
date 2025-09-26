import { NextRequest, NextResponse } from 'next/server';
import { UserRole } from '@prisma/client';

import { handleAuthorizationError, requireApiUser } from '@/lib/auth/guards';
import { getProjectSummaryById } from '@/lib/server/projects';

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
  try {
    await requireApiUser({ roles: [UserRole.CREATOR, UserRole.ADMIN] });
  } catch (error) {
    const response = handleAuthorizationError(error);
    if (response) {
      return response;
    }

    throw error;
  }

  const body = await request.json();
  const project = await getProjectSummaryById(params.id);
  if (!project) {
    return NextResponse.json({ message: 'Project not found' }, { status: 404 });
  }

  return NextResponse.json({ ...project, ...body });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireApiUser({ roles: [UserRole.CREATOR, UserRole.ADMIN] });
  } catch (error) {
    const response = handleAuthorizationError(error);
    if (response) {
      return response;
    }

    throw error;
  }

  const project = await getProjectSummaryById(params.id);
  if (!project) {
    return NextResponse.json({ message: 'Project not found' }, { status: 404 });
  }

  return NextResponse.json({ message: 'Deleted' });
}
