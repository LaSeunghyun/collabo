import { NextRequest, NextResponse } from 'next/server';

// import { milestoneStatusEnum } from '@/lib/db/schema'; // TODO: Drizzle로 전환 필요
import { requireApiUser } from '@/lib/auth/guards';
import { GuardRequirement } from '@/lib/auth/session';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireApiUser(request as NextRequest & GuardRequirement);
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as string | null; // TODO: Drizzle로 전환 필요
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // TODO: Drizzle로 전환 필요
    // 프로젝트 존재 확인
    const project = { id: params.id, title: 'Sample Project', ownerId: user.id };

    if (!project) {
      return NextResponse.json(
        { message: 'Project not found' },
        { status: 404 }
      );
    }

    // 프로젝트 소유자 또는 관리자만 조회 가능
    if (project.ownerId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 403 }
      );
    }

    const where: any = { projectId: params.id };
    if (status) where.status = status;

    // TODO: Drizzle로 전환 필요
    const [milestones, total] = [[], 0];

    return NextResponse.json({
      milestones,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Failed to fetch project milestones:', error);
    return NextResponse.json(
      { message: 'Failed to fetch project milestones' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireApiUser(request as NextRequest & GuardRequirement);
    const body = await request.json();
    const { title, description, dueDate, status } = body;

    if (!title || !dueDate) {
      return NextResponse.json(
        { message: 'Title and due date are required' },
        { status: 400 }
      );
    }

    // TODO: Drizzle로 전환 필요
    // 프로젝트 소유자인지 확인
    const project = { id: params.id, title: 'Sample Project', ownerId: user.id };

    if (!project) {
      return NextResponse.json(
        { message: 'Project not found' },
        { status: 404 }
      );
    }

    if (project.ownerId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 403 }
      );
    }

    // TODO: Drizzle로 전환 필요
    // 마일스톤 생성
    const milestone = {
      id: 'temp-milestone-id',
      projectId: params.id,
      title,
      description,
      dueDate: new Date(dueDate),
      status: status || 'PLANNED'
    };

    return NextResponse.json(milestone, { status: 201 });
  } catch (error) {
    console.error('Failed to create project milestone:', error);
    return NextResponse.json(
      { message: 'Failed to create project milestone' },
      { status: 500 }
    );
  }
}
