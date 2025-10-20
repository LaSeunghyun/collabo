import { NextRequest, NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';

import { handleAuthorizationError, requireApiUser } from '@/lib/auth/guards';
import { evaluateAuthorization } from '@/lib/auth/session';
import {
  createProjectUpdate,
  listProjectUpdates,
  ProjectUpdateAccessDeniedError,
  ProjectUpdateNotFoundError,
  ProjectUpdateRecord,
  ProjectUpdateValidationError
} from '@/lib/server/project-updates';
import { getDb } from '@/lib/db/client';
import { project, userFollow, funding, notification } from '@/drizzle/schema';

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
  const db = await getDb();
  
  // 프로젝트 정보 조회
  const [projectData] = await db
    .select({
      id: project.id,
      title: project.title,
      ownerId: project.ownerId
    })
    .from(project)
    .where(eq(project.id, projectId))
    .limit(1);

  if (!projectData) {
    return;
  }

  // 팔로워 목록 조회 (프로젝트 소유자를 팔로우하는 사용자들)
  const followers = await db
    .select({
      followerId: userFollow.followerId
    })
    .from(userFollow)
    .where(eq(userFollow.followingId, projectData.ownerId));

  // 후원자 목록 조회 (해당 프로젝트에 후원한 사용자들)
  const backers = await db
    .select({
      userId: funding.userId
    })
    .from(funding)
    .where(and(
      eq(funding.projectId, projectId),
      eq(funding.paymentStatus, 'SUCCEEDED')
    ));

  const recipients = new Set<string>();
  followers.forEach(({ followerId }) => recipients.add(followerId));
  backers.forEach(({ userId }) => recipients.add(userId));
  recipients.delete(actorId); // 작성자는 제외

  if (!recipients.size) {
    return;
  }

  const payload = {
    type: 'PROJECT_UPDATE',
    projectId: projectData.id,
    projectTitle: projectData.title,
    postId: update.id,
    title: update.title
  } satisfies Record<string, unknown>;

  // 알림 일괄 생성
  await db.insert(notification).values(
    Array.from(recipients).map((userId) => ({
      id: crypto.randomUUID(),
      userId,
      type: 'SYSTEM',
      payload,
      read: false
    }))
  );
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
      visibility: body.visibility ? String(body.visibility) : undefined,
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
