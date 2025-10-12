import { NextRequest, NextResponse } from 'next/server';
import { eq, and, desc, count } from 'drizzle-orm';

import { projectMilestones, projects } from '@/lib/db/schema';
import { getDb } from '@/lib/db/client';
import { requireApiUser } from '@/lib/auth/guards';
import { GuardRequirement } from '@/lib/auth/session';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireApiUser(request as NextRequest & GuardRequirement);
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as string | null;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    const db = await getDb();

    // 프로젝트 존재 확인
    const [project] = await db
      .select({
        id: projects.id,
        title: projects.title,
        ownerId: projects.ownerId
      })
      .from(projects)
      .where(eq(projects.id, params.id))
      .limit(1);

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

    // WHERE 조건 구성
    const whereConditions = [eq(projectMilestones.projectId, params.id)];
    if (status) {
      whereConditions.push(eq(projectMilestones.status, status as any));
    }

    // 마일스톤 조회
    const milestones = await db
      .select({
        id: projectMilestones.id,
        projectId: projectMilestones.projectId,
        title: projectMilestones.title,
        description: projectMilestones.description,
        dueDate: projectMilestones.dueDate,
        status: projectMilestones.status,
        createdAt: projectMilestones.createdAt,
        updatedAt: projectMilestones.updatedAt
      })
      .from(projectMilestones)
      .where(and(...whereConditions))
      .orderBy(desc(projectMilestones.createdAt))
      .limit(limit)
      .offset(offset);

    // 전체 개수 조회
    const [totalResult] = await db
      .select({ count: count() })
      .from(projectMilestones)
      .where(and(...whereConditions));

    const total = totalResult?.count || 0;

    return NextResponse.json({
      milestones: milestones.map(milestone => ({
        ...milestone,
        dueDate: milestone.dueDate,
        createdAt: milestone.createdAt,
        updatedAt: milestone.updatedAt
      })),
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

    const db = await getDb();

    // 프로젝트 소유자인지 확인
    const [project] = await db
      .select({
        id: projects.id,
        title: projects.title,
        ownerId: projects.ownerId
      })
      .from(projects)
      .where(eq(projects.id, params.id))
      .limit(1);

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

    // 마일스톤 생성
    const [milestone] = await db
      .insert(projectMilestones)
      .values({
        id: crypto.randomUUID(),
        projectId: params.id,
        title,
        description: description || null,
        dueDate: new Date(dueDate).toISOString(),
        status: (status || 'PLANNED') as any,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .returning({
        id: projectMilestones.id,
        projectId: projectMilestones.projectId,
        title: projectMilestones.title,
        description: projectMilestones.description,
        dueDate: projectMilestones.dueDate,
        status: projectMilestones.status,
        createdAt: projectMilestones.createdAt,
        updatedAt: projectMilestones.updatedAt
      });

    return NextResponse.json({
      ...milestone,
      dueDate: milestone.dueDate,
      createdAt: milestone.createdAt,
      updatedAt: milestone.updatedAt
    }, { status: 201 });
  } catch (error) {
    console.error('Failed to create project milestone:', error);
    return NextResponse.json(
      { message: 'Failed to create project milestone' },
      { status: 500 }
    );
  }
}
