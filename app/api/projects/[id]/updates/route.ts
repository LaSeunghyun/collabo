import { NextRequest, NextResponse } from 'next/server';
import {
  FundingStatus,
  NotificationType,
  POST_VISIBILITY_VALUES,
  PostVisibility,
  UserRole
} from '@/types/prisma';

import { handleAuthorizationError, requireApiUser } from '@/lib/auth/guards';
import { evaluateAuthorization } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
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
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, ownerId: true, title: true }
  });

  if (!project) {
    return;
  }

  const [followers, backers] = await Promise.all([
    prisma.userFollow.findMany({
      where: { followingId: project.ownerId },
      select: { followerId: true }
    }),
    prisma.funding.findMany({
      where: {
        projectId,
        paymentStatus: FundingStatus.SUCCEEDED
      },
      distinct: ['userId'],
      select: { userId: true }
    })
  ]);

  const recipients = new Set<string>();
  followers.forEach(({ followerId }) => recipients.add(followerId));
  backers.forEach(({ userId }) => recipients.add(userId));
  recipients.delete(actorId);

  if (!recipients.size) {
    return;
  }

  const payload = {
    type: 'PROJECT_UPDATE',
    projectId: project.id,
    projectTitle: project.title,
    postId: update.id,
    title: update.title,
    visibility: update.visibility
  } satisfies Record<string, unknown>;

  await prisma.notification.createMany({
    data: Array.from(recipients).map((userId) => ({
      userId,
      type: NotificationType.SYSTEM,
      payload
    }))
  });
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
    const hasMilestoneField = Object.prototype.hasOwnProperty.call(body, 'milestoneId');

    const rawVisibility =
      typeof body.visibility === 'string' ? body.visibility.toUpperCase() : undefined;
    const visibility =
      POST_VISIBILITY_VALUES.find((value) => value === rawVisibility) ?? PostVisibility.PUBLIC;

    const input = {
      title: String(body.title ?? ''),
      content: String(body.content ?? ''),
      visibility,
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
