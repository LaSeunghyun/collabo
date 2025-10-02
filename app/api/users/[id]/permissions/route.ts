import { NextRequest, NextResponse } from 'next/server';

import { requireApiUser } from '@/lib/auth/guards';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireApiUser(request);
    
    // 본인 또는 관리자만 조회 가능
    if (params.id !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 403 }
      );
    }

    const userPermissions = await prisma.userPermission.findMany({
      where: { userId: params.id },
      include: {
        permission: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json(userPermissions);
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
    const user = await requireApiUser(request);
    
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
    const targetUser = await prisma.user.findUnique({
      where: { id: params.id },
      select: { id: true, name: true, email: true }
    });

    if (!targetUser) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    // 권한 존재 확인
    const permission = await prisma.permission.findUnique({
      where: { id: permissionId }
    });

    if (!permission) {
      return NextResponse.json(
        { message: 'Permission not found' },
        { status: 404 }
      );
    }

    // 기존 권한 확인
    const existingUserPermission = await prisma.userPermission.findUnique({
      where: {
        userId_permissionId: {
          userId: params.id,
          permissionId
        }
      }
    });

    if (existingUserPermission) {
      return NextResponse.json(
        { message: 'User already has this permission' },
        { status: 400 }
      );
    }

    // 사용자 권한 부여
    const userPermission = await prisma.userPermission.create({
      data: {
        userId: params.id,
        permissionId
      },
      include: {
        permission: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

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
    const user = await requireApiUser(request);
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

    // 사용자 권한 제거
    await prisma.userPermission.delete({
      where: {
        userId_permissionId: {
          userId: params.id,
          permissionId
        }
      }
    });

    return NextResponse.json({ message: 'Permission removed successfully' });
  } catch (error) {
    console.error('Failed to remove user permission:', error);
    return NextResponse.json(
      { message: 'Failed to remove user permission' },
      { status: 500 }
    );
  }
}
