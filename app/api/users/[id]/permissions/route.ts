import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';

import { requireApiUser } from '@/lib/auth/guards';
import { GuardRequirement } from '@/lib/auth/session';
import { getDbClient } from '@/lib/db/client';
import { permissions, userPermissions, users } from '@/lib/db/schema';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireApiUser(
      {} as GuardRequirement,
      { headers: request.headers }
    );
    const db = await getDbClient();

    // 본인 또는 관리자만 조회 가능
    if (params.id !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: '권한이 없습니다.' },
        { status: 403 }
      );
    }

    const userPermissionsList = await db
      .select({
        id: userPermissions.id,
        userId: userPermissions.userId,
        permissionId: userPermissions.permissionId,
        assignedAt: userPermissions.assignedAt,
        permission: {
          id: permissions.id,
          key: permissions.key,
          description: permissions.description,
          createdAt: permissions.createdAt,
        },
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
      })
      .from(userPermissions)
      .innerJoin(permissions, eq(userPermissions.permissionId, permissions.id))
      .innerJoin(users, eq(userPermissions.userId, users.id))
      .where(eq(userPermissions.userId, params.id));

    return NextResponse.json(userPermissionsList);
  } catch (error) {
    console.error('사용자 권한 조회 실패:', error);
    return NextResponse.json(
      { error: '사용자 권한을 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireApiUser(
      {} as GuardRequirement,
      { headers: request.headers }
    );
    const db = await getDbClient();

    // 관리자만 권한 부여 가능
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: '권한이 없습니다.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { permissionId } = body;

    if (!permissionId) {
      return NextResponse.json(
        { error: '권한 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // 사용자 존재 확인
    const [targetUser] = await db
      .select({ id: users.id, name: users.name, email: users.email })
      .from(users)
      .where(eq(users.id, params.id))
      .limit(1);

    if (!targetUser) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 권한 존재 확인
    const [permission] = await db
      .select({
        id: permissions.id,
        key: permissions.key,
        description: permissions.description,
        createdAt: permissions.createdAt,
      })
      .from(permissions)
      .where(eq(permissions.id, permissionId))
      .limit(1);

    if (!permission) {
      return NextResponse.json(
        { error: '권한을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 기존 권한 확인
    const [existingUserPermission] = await db
      .select({ id: userPermissions.id })
      .from(userPermissions)
      .where(
        and(
          eq(userPermissions.userId, params.id),
          eq(userPermissions.permissionId, permissionId)
        )
      )
      .limit(1);

    if (existingUserPermission) {
      return NextResponse.json(
        { error: '사용자가 이미 이 권한을 가지고 있습니다.' },
        { status: 400 }
      );
    }

    // 사용자 권한 부여
    const now = new Date().toISOString();
    const [created] = await db
      .insert(userPermissions)
      .values({
        id: randomUUID(),
        userId: params.id,
        permissionId,
        assignedAt: now,
      })
      .returning({ id: userPermissions.id });

    const [userPermission] = await db
      .select({
        id: userPermissions.id,
        userId: userPermissions.userId,
        permissionId: userPermissions.permissionId,
        assignedAt: userPermissions.assignedAt,
        permission: {
          id: permissions.id,
          key: permissions.key,
          description: permissions.description,
          createdAt: permissions.createdAt,
        },
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
      })
      .from(userPermissions)
      .innerJoin(permissions, eq(userPermissions.permissionId, permissions.id))
      .innerJoin(users, eq(userPermissions.userId, users.id))
      .where(eq(userPermissions.id, created.id))
      .limit(1);

    if (!userPermission) {
      throw new Error('생성된 사용자 권한을 불러올 수 없습니다.');
    }

    return NextResponse.json(userPermission, { status: 201 });
  } catch (error) {
    console.error('사용자 권한 부여 실패:', error);
    return NextResponse.json(
      { error: '사용자 권한 부여에 실패했습니다.' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireApiUser(
      {} as GuardRequirement,
      { headers: request.headers }
    );
    const { searchParams } = new URL(request.url);
    const permissionId = searchParams.get('permissionId');

    if (!permissionId) {
      return NextResponse.json(
        { error: '권한 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // 관리자만 권한 제거 가능
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: '권한이 없습니다.' },
        { status: 403 }
      );
    }

    const db = await getDbClient();

    // 사용자 권한 제거
    await db
      .delete(userPermissions)
      .where(
        and(
          eq(userPermissions.userId, params.id),
          eq(userPermissions.permissionId, permissionId)
        )
      );

    return NextResponse.json({ message: '권한이 성공적으로 제거되었습니다.' });
  } catch (error) {
    console.error('사용자 권한 제거 실패:', error);
    return NextResponse.json(
      { error: '사용자 권한 제거에 실패했습니다.' },
      { status: 500 }
    );
  }
}