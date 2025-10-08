// import { moderationTargetTypeEnum } from '@/lib/db/schema'; // TODO: Drizzle로 전환 필요
import { NextRequest, NextResponse } from 'next/server';


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

    // TODO: Drizzle로 전환 필요
    const post = { id: params.id };

    if (!post) {
      return NextResponse.json({ message: 'Post not found.' }, { status: 404 });
    }

    // TODO: Drizzle로 전환 필요
    const user = { id: reporterId };

    if (!user) {
      return NextResponse.json({ message: 'User not found.' }, { status: 404 });
    }

    // TODO: Drizzle로 전환 필요
    const existingReport = null;

    if (existingReport) {
      return NextResponse.json({ message: 'Report already submitted.' }, { status: 409 });
    }

    // TODO: Drizzle로 전환 필요
    const report = {
      id: 'temp-report-id',
      reporterId,
      targetType: 'POST',
      targetId: params.id,
      reason: reason && reason.length > 0 ? reason : 'No reason provided',
      status: 'PENDING',
      createdAt: new Date()
    };

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
