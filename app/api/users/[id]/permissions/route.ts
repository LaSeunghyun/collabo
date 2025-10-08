import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';

import { requireApiUser } from '@/lib/auth/guards';
import { GuardRequirement } from '@/lib/auth/session';
import { getDb } from '@/lib/db/client';
import { permissions, userPermissions, users } from '@/lib/db/schema';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireApiUser(request as NextRequest & GuardRequirement);
    const db = await getDb();

    // 본인 또는 관리자만 조회 가능
    if (params.id !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Unauthorized' },
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
    console.error('Failed to fetch user permissions:', error);
    return NextResponse.json(
      { message: 'Failed to fetch user permissions' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireApiUser(request as NextRequest & GuardRequirement);
    const db = await getDb();

    // 관리자만 권한 부여 가능
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { permissionId } = body;

    if (!permissionId) {
      return NextResponse.json(
        { message: 'Permission ID is required' },
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
        { message: 'User not found' },
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
        { message: 'Permission not found' },
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
        { message: 'User already has this permission' },
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
      throw new Error('Failed to load created user permission');
    }

    return NextResponse.json(userPermission, { status: 201 });
  } catch (error) {
    console.error('Failed to grant user permission:', error);
    return NextResponse.json(
      { message: 'Failed to grant user permission' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireApiUser(request as NextRequest & GuardRequirement);
    const { searchParams } = new URL(request.url);
    const permissionId = searchParams.get('permissionId');

    if (!permissionId) {
      return NextResponse.json(
        { message: 'Permission ID is required' },
        { status: 400 }
      );
    }

    // 관리자만 권한 제거 가능
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 403 }
      );
    }

    const db = await getDb();

    // 사용자 권한 제거
    await db
      .delete(userPermissions)
      .where(
        and(
          eq(userPermissions.userId, params.id),
          eq(userPermissions.permissionId, permissionId)
        )
      );

    return NextResponse.json({ message: 'Permission removed successfully' });
  } catch (error) {
    console.error('Failed to remove user permission:', error);
    return NextResponse.json(
      { message: 'Failed to remove user permission' },
      { status: 500 }
    );
  }
}
