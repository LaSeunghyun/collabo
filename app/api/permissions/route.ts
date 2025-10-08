import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { count, desc, eq } from 'drizzle-orm';

import { permissions } from '@/lib/db/schema';
import { getDb } from '@/lib/db/client';
import { requireApiUser } from '@/lib/auth/guards';
import { GuardRequirement } from '@/lib/auth/session';

export async function GET(request: NextRequest) {
  try {
    const user = await requireApiUser(request as NextRequest & GuardRequirement);
    const db = await getDb();

    // 관리자�?권한 목록 조회 가??
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    // 권한 목록 조회
    const permissionsList = await db
      .select({
        id: permissions.id,
        key: permissions.key,
        description: permissions.description,
        createdAt: permissions.createdAt
      })
      .from(permissions)
      .orderBy(desc(permissions.createdAt))
      .limit(limit)
      .offset(offset);

    // ?�체 개수 조회
    const totalResult = await db
      .select({ count: count() })
      .from(permissions);
    
    const total = totalResult[0]?.count || 0;

    return NextResponse.json({
      permissions: permissionsList,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Failed to fetch permissions:', error);
    return NextResponse.json(
      { message: 'Failed to fetch permissions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireApiUser(request as NextRequest & GuardRequirement);
    const db = await getDb();

    // 관리자�?권한 ?�성 가??
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { key, description } = body;

    if (!key) {
      return NextResponse.json(
        { message: 'Permission key is required' },
        { status: 400 }
      );
    }

    const [existingPermission] = await db
      .select({ id: permissions.id })
      .from(permissions)
      .where(eq(permissions.key, key))
      .limit(1);

    if (existingPermission) {
      return NextResponse.json(
        { message: 'Permission key already exists' },
        { status: 400 }
      );
    }

    const [permission] = await db
      .insert(permissions)
      .values({
        id: randomUUID(),
        key,
        description: description ?? null,
      })
      .returning({
        id: permissions.id,
        key: permissions.key,
        description: permissions.description,
        createdAt: permissions.createdAt,
      });

    return NextResponse.json(permission, { status: 201 });
  } catch (error) {
    console.error('Failed to create permission:', error);
    return NextResponse.json(
      { message: 'Failed to create permission' },
      { status: 500 }
    );
  }
}
