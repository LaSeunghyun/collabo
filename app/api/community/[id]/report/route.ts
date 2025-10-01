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

    // 기본 유효성 검사
    if (!reporterId) {
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

    if (!user) {
      return NextResponse.json({ message: 'User not found.' }, { status: 404 });
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
    
    // 더 자세한 에러 정보 제공
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      { 
        message: 'Unable to submit report.',
        error: errorMessage
      }, 
      { status: 500 }
    );
  }
}
