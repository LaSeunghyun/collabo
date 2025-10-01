import { ModerationTargetType } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json().catch(() => ({}));
    const reporterId = typeof body.reporterId === 'string' ? body.reporterId : undefined;
    const reason = typeof body.reason === 'string' ? body.reason.trim() : undefined;

    if (!reporterId) {
      return NextResponse.json({ message: 'Reporter is required.' }, { status: 400 });
    }

    if (!params.id) {
      return NextResponse.json({ message: 'Post ID is required.' }, { status: 400 });
    }

    const post = await prisma.post.findUnique({
      where: { id: params.id },
      select: { id: true }
    });

    if (!post) {
      return NextResponse.json({ message: 'Post not found.' }, { status: 404 });
    }

    const user = await prisma.user.findUnique({
      where: { id: reporterId },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ message: 'User not found.' }, { status: 404 });
    }

    const existingReport = await prisma.moderationReport.findFirst({
      where: {
        reporterId,
        targetId: params.id,
        targetType: ModerationTargetType.POST
      }
    });

    if (existingReport) {
      return NextResponse.json({ message: 'Report already submitted.' }, { status: 409 });
    }

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

    if (error && typeof error === 'object' && 'code' in error) {
      const prismaError = error as { code?: string };

      if (prismaError.code === 'P2002') {
        return NextResponse.json({ message: 'Report already submitted.' }, { status: 409 });
      }

      if (prismaError.code === 'P2003') {
        return NextResponse.json({ message: 'User not found.' }, { status: 404 });
      }
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      { message: 'Unable to submit report.', error: errorMessage },
      { status: 500 }
    );
  }
}
