import { ModerationTargetType } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 요청 본문 파싱
    const body = await request.json().catch(() => ({}));
    const reporterId = typeof body.reporterId === 'string' ? body.reporterId : undefined;
    const reason = typeof body.reason === 'string' ? body.reason.trim() : undefined;

    console.log('Report request:', { reporterId, reason, postId: params.id });

    // 기본 유효성 검사
    if (!reporterId) {
      console.log('Missing reporterId in request body');
      return NextResponse.json({ message: 'Reporter is required.' }, { status: 400 });
    }

    if (!params.id) {
      return NextResponse.json({ message: 'Post ID is required.' }, { status: 400 });
    }

    // 게시글이 존재하는지 확인
    const post = await prisma.post.findUnique({
      where: { id: params.id },
      select: { id: true }
    });

    if (!post) {
      return NextResponse.json({ message: 'Post not found.' }, { status: 404 });
    }

    // 사용자가 존재하는지 확인
    const user = await prisma.user.findUnique({
      where: { id: reporterId },
      select: { id: true }
    });

    console.log('User lookup result:', { reporterId, userFound: !!user });

    if (!user) {
      console.log('User not found in database:', reporterId);
      return NextResponse.json({
        message: 'User not found.',
        details: `User with ID ${reporterId} does not exist in the database`
      }, { status: 404 });
    }

    // 중복 신고 확인
    const existingReport = await prisma.moderationReport.findFirst({
      where: {
        reporterId: reporterId,
        targetId: params.id,
        targetType: ModerationTargetType.POST
      }
    });

    if (existingReport) {
      return NextResponse.json({ message: 'Report already submitted.' }, { status: 409 });
    }

    // 신고 생성
    const report = await prisma.moderationReport.create({
      data: {
        reporter: { connect: { id: reporterId } },
        targetType: ModerationTargetType.POST,
        targetId: params.id,
        reason: reason && reason.length > 0 ? reason : 'No reason provided'
      }
    });

    return NextResponse.json(
      {
        id: report.id,
        status: report.status,
        createdAt: report.createdAt.toISOString()
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Failed to create moderation report:', error);

    // Prisma 오류 처리
    if (error && typeof error === 'object' && 'code' in error) {
      const prismaError = error as any;
      console.log('Prisma error:', { code: prismaError.code, message: prismaError.message });

      if (prismaError.code === 'P2002') {
        return NextResponse.json({ message: 'Report already submitted.' }, { status: 409 });
      }
      if (prismaError.code === 'P2003') {
        return NextResponse.json({
          message: 'User not found.',
          details: 'Foreign key constraint failed - user does not exist'
        }, { status: 404 });
      }
    }

    // 더 자세한 에러 정보 제공
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.log('General error:', { errorMessage, error });

    return NextResponse.json(
      {
        message: 'Unable to submit report.',
        error: errorMessage,
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
