import { NextRequest, NextResponse } from 'next/server';
import { eq, and, count, desc } from 'drizzle-orm';

import { permissions, userPermissions, users } from '@/lib/db/schema';
import { getDb } from '@/lib/db/client';
import { requireApiUser } from '@/lib/auth/guards';
import { GuardRequirement } from '@/lib/auth/session';

export async function GET(request: NextRequest) {
  try {
    const user = await requireApiUser(request as NextRequest & GuardRequirement);
    
    // 관리자만 권한 목록 조회 가능
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

    // 전체 개수 조회
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
    
    // 관리자만 권한 생성 가능
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

    // TODO: Drizzle로 전환 필요
    // 권한 키 중복 확인
    const existingPermission = null;

    if (existingPermission) {
      return NextResponse.json(
        { message: 'Permission key already exists' },
        { status: 400 }
      );
    }

    // TODO: Drizzle로 전환 필요
    // 권한 생성
    const permission = {
      id: 'temp-permission-id',
      key,
      description
    };

    return NextResponse.json(permission, { status: 201 });
  } catch (error) {
    console.error('Failed to create permission:', error);
    return NextResponse.json(
      { message: 'Failed to create permission' },
      { status: 500 }
    );
  }
}
