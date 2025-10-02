import { NextRequest, NextResponse } from 'next/server';

import { requireApiUser } from '@/lib/auth/guards';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const user = await requireApiUser(request);
    
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

    const [permissions, total] = await Promise.all([
      prisma.permission.findMany({
        include: {
          users: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          }
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.permission.count()
    ]);

    return NextResponse.json({
      permissions,
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
    const user = await requireApiUser(request);
    
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

    // 권한 키 중복 확인
    const existingPermission = await prisma.permission.findUnique({
      where: { key }
    });

    if (existingPermission) {
      return NextResponse.json(
        { message: 'Permission key already exists' },
        { status: 400 }
      );
    }

    // 권한 생성
    const permission = await prisma.permission.create({
      data: {
        key,
        description
      }
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
