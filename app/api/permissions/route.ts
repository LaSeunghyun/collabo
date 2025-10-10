import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { count, desc } from 'drizzle-orm';

import { permissions } from '@/lib/db/schema';
import { getDbClient } from '@/lib/db/client';
import { requireApiUser } from '@/lib/auth/guards';
import { GuardRequirement } from '@/lib/auth/session';

export async function GET(request: NextRequest) {
  try {
    const user = await requireApiUser(
      {} as GuardRequirement,
      { headers: request.headers }
    );
    const db = await getDbClient();

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
    console.error('권한 목록 조회 오류 발생:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      userId: request.headers.get('user-id') || 'unknown'
    });
    
    return NextResponse.json(
      { 
        error: '권한 목록을 불러오는데 실패했습니다.',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireApiUser(
      {} as GuardRequirement,
      { headers: request.headers }
    );
    const db = await getDbClient();

    // 관리자만 권한 생성 가능
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 403 }
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: '잘못된 요청 본문입니다.' },
        { status: 400 }
      );
    }

    const { key, description } = body as {
      key?: string;
      description?: string;
    };

    if (!key || !description) {
      return NextResponse.json(
        { error: '권한 키와 설명은 필수입니다.' },
        { status: 400 }
      );
    }

    // 권한 생성
    const newPermission = await db
      .insert(permissions)
      .values({
        id: randomUUID(),
        key,
        description
      })
      .returning();

    if (!newPermission[0]) {
      throw new Error('권한 생성에 실패했습니다.');
    }

    return NextResponse.json(newPermission[0], { status: 201 });
  } catch (error) {
    console.error('권한 생성 오류 발생:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      userId: request.headers.get('user-id') || 'unknown'
    });
    
    return NextResponse.json(
      { 
        error: '권한 생성에 실패했습니다.',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}