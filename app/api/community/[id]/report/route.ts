import { ModerationTargetType } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json().catch(() => ({}));
  const reporterId = typeof body.reporterId === 'string' ? body.reporterId : undefined;
  const reason = typeof body.reason === 'string' ? body.reason.trim() : undefined;

  if (!reporterId) {
    return NextResponse.json({ message: 'Reporter is required.' }, { status: 400 });
  }

  try {
    const report = await prisma.moderationReport.create({
      data: {
        reporter: { connect: { id: reporterId } },
        targetType: ModerationTargetType.POST,
        targetId: params.id,
        reason: reason && reason.length > 0 ? reason : undefined
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
    console.error('Failed to create moderation report', error);
    return NextResponse.json({ message: 'Unable to submit report.' }, { status: 500 });
  }
}
