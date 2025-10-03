import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { requireUser } from '@/lib/auth/guards';
import { prisma } from '@/lib/prisma';
import { UserRole, ModerationStatus } from '@/types/prisma';

const updateReportSchema = z.object({
  reportId: z.string(),
  action: z.enum(['blind', 'dismiss', 'reviewing']),
  reason: z.string().optional()
});

export async function PATCH(req: NextRequest) {
  try {
    const { user } = await requireUser({
      roles: [UserRole.ADMIN],
      redirectTo: '/admin'
    });

    const body = await req.json();
    const { reportId, action, reason } = updateReportSchema.parse(body);

    // 신고 정보 조회
    const report = await prisma.moderationReport.findUnique({
      where: { id: reportId }
    });

    if (!report) {
      return NextResponse.json({ error: '신고를 찾을 수 없습니다.' }, { status: 404 });
    }

    const updateData: any = {
      status: action === 'reviewing' ? ModerationStatus.REVIEWING : 
              action === 'blind' ? ModerationStatus.ACTION_TAKEN :
              ModerationStatus.DISMISSED,
      reviewedAt: new Date(),
      reviewedBy: user.id,
      reviewReason: reason
    };

    // 블라인드 처리인 경우 게시글/댓글 숨김 처리
    if (action === 'blind') {
      if (report.targetType === 'POST') {
        await prisma.post.update({
          where: { id: report.targetId },
          data: { isHidden: true }
        });
      } else if (report.targetType === 'COMMENT') {
        await prisma.comment.update({
          where: { id: report.targetId },
          data: { isHidden: true }
        });
      }
    }

    // 신고 상태 업데이트
    const updatedReport = await prisma.moderationReport.update({
      where: { id: reportId },
      data: updateData,
      include: {
        reporter: {
          select: { id: true, name: true }
        }
      }
    });

    return NextResponse.json({
      success: true,
      report: updatedReport
    });

  } catch (error) {
    console.error('신고 처리 중 오류:', error);
    return NextResponse.json(
      { error: '신고 처리에 실패했습니다.' },
      { status: 500 }
    );
  }
}
