import { NextRequest, NextResponse } from 'next/server';

import { requireApiUser } from '@/lib/auth/guards';
import {
  deleteProjectUpdate,
  ProjectUpdateAccessDeniedError,
  ProjectUpdateNotFoundError,
  ProjectUpdateRecord,
  ProjectUpdateValidationError,
  updateProjectUpdate
} from '@/lib/server/project-updates';

const serializeUpdate = (update: ProjectUpdateRecord) => ({
  ...update,
  createdAt: update.createdAt.toISOString(),
  updatedAt: update.updatedAt.toISOString()
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; updateId: string } }
) {
  const authContext = { headers: request.headers };

  try {
    const user = await requireApiUser({ roles: ['CREATOR', 'ADMIN'] }, authContext);
    const body = await request.json();
    const hasMilestoneField = Object.prototype.hasOwnProperty.call(body, 'milestoneId');

    const input = {
      title: body.title !== undefined ? String(body.title) : undefined,
      content: body.content !== undefined ? String(body.content) : undefined,
      // visibility:
      //   typeof body.visibility === 'string' && ['PUBLIC', 'SUPPORTERS', 'PRIVATE'].includes(body.visibility)
      //     ? (body.visibility as 'PUBLIC' | 'SUPPORTERS' | 'PRIVATE')
      //     : undefined,
      attachments: Array.isArray(body.attachments) ? body.attachments : undefined,
      milestoneId: hasMilestoneField
        ? body.milestoneId === null
          ? undefined
          : String(body.milestoneId)
        : undefined
    };

    const update = await updateProjectUpdate(params.updateId, input, user);
    return NextResponse.json(serializeUpdate(update));
  } catch (error) {
    if (error instanceof ProjectUpdateValidationError) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    if (error instanceof ProjectUpdateAccessDeniedError) {
      return NextResponse.json({ message: error.message }, { status: 403 });
    }

    if (error instanceof ProjectUpdateNotFoundError) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }

    console.error('Failed to update project update', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; updateId: string } }
) {
  const authContext = { headers: request.headers };

  try {
    const user = await requireApiUser({ roles: ['CREATOR', 'ADMIN'] }, authContext);
    await deleteProjectUpdate(params.updateId, user);
    return NextResponse.json({ message: 'Deleted' });
  } catch (error) {
    if (error instanceof ProjectUpdateAccessDeniedError) {
      return NextResponse.json({ message: error.message }, { status: 403 });
    }

    if (error instanceof ProjectUpdateNotFoundError) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }

    console.error('Failed to delete project update', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
