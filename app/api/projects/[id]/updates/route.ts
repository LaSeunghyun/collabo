import { NextRequest, NextResponse } from 'next/server';
// import {
//   FundingStatus,
//   NotificationType,
//   UserRole
// } from '@/types/prisma'; // TODO: Drizzle로 전환 필요

import { handleAuthorizationError, requireApiUser } from '@/lib/auth/guards';
import { evaluateAuthorization } from '@/lib/auth/session';
// import { prisma } from '@/lib/prisma'; // TODO: Drizzle로 전환 필요
import {
  createProjectUpdate,
  listProjectUpdates,
  ProjectUpdateAccessDeniedError,
  ProjectUpdateNotFoundError,
  ProjectUpdateRecord,
  ProjectUpdateValidationError
} from '@/lib/server/project-updates';

const serializeUpdate = (update: ProjectUpdateRecord) => ({
  ...update,
  createdAt: update.createdAt.toISOString(),
  updatedAt: update.updatedAt.toISOString()
});

const createSupporterNotification = async (
  projectId: string,
  update: ProjectUpdateRecord,
  actorId: string
) => {
  // TODO: Drizzle로 전환 필요
  const project = { id: projectId, ownerId: actorId, title: 'Sample Project' };

  if (!project) {
    return;
  }

  // TODO: Drizzle로 전환 필요
  const [followers, backers] = [[], []];

  const recipients = new Set<string>();
  followers.forEach(({ followerId }) => recipients.add(followerId));
  backers.forEach(({ userId }) => recipients.add(userId));
  recipients.delete(actorId);

  if (!recipients.size) {
    return;
  }

  // const payload = {
  //   type: 'PROJECT_UPDATE',
  //   projectId: project.id,
  //   projectTitle: project.title,
  //   postId: update.id,
  //   title: update.title
  // } satisfies Record<string, unknown>;

  // TODO: Drizzle로 전환 필요
  // await prisma.notification.createMany({
  //   data: Array.from(recipients).map((userId) => ({
  //     userId,
  //     type: 'SYSTEM',
  //     payload
  //   }))
  // });
};

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authContext = { headers: request.headers };
    const { user } = await evaluateAuthorization({}, authContext);
    const updates = await listProjectUpdates(params.id, user ?? undefined);
    return NextResponse.json(updates.map(serializeUpdate));
  } catch (error) {
    if (error instanceof ProjectUpdateNotFoundError) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }

    console.error('Failed to fetch project updates', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  let user;
  const authContext = { headers: request.headers };

  try {
    user = await requireApiUser({ roles: ['CREATOR', 'ADMIN'] }, authContext); // TODO: Drizzle로 전환 필요
  } catch (error) {
    const response = handleAuthorizationError(error);
    if (response) {
      return response;
    }

    throw error;
  }

  try {
    const body = await request.json();
    const hasMilestoneField = Object.prototype.hasOwnProperty.call(body, 'milestoneId');

    const input = {
      title: String(body.title ?? ''),
      content: String(body.content ?? ''),
      attachments: Array.isArray(body.attachments) ? body.attachments : undefined,
      milestoneId: hasMilestoneField
        ? body.milestoneId === null
          ? null
          : String(body.milestoneId)
        : undefined
    };

    const update = await createProjectUpdate(params.id, input, user);
    await createSupporterNotification(params.id, update, user.id);
    return NextResponse.json(serializeUpdate(update), { status: 201 });
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

    console.error('Failed to create project update', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
