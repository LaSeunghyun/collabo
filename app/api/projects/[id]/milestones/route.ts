import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { eq, desc } from 'drizzle-orm';

import { requireApiUser } from '@/lib/auth/guards';
import { GuardRequirement } from '@/lib/auth/session';
import { getDbClient } from '@/lib/db/client';
import { projects, projectMilestones } from '@/lib/db/schema';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = await getDbClient();
    
    // 프로젝트 존재 확인
    const [project] = await db
      .select({
        id: projects.id,
        title: projects.title,
        ownerId: projects.ownerId,
        status: projects.status
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

    // 마일스톤 목록 조회
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
      .where(eq(projectMilestones.projectId, params.id))
      .orderBy(desc(projectMilestones.createdAt));

    return NextResponse.json(milestones);
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
    const user = await requireApiUser(
      {} as GuardRequirement,
      { headers: request.headers }
    );
    const db = await getDbClient();
    
    const body = await request.json();
    const { title, description, dueDate, status } = body;

    if (!title || !dueDate) {
      return NextResponse.json(
        { message: 'Title and due date are required' },
        { status: 400 }
      );
    }

    // 프로젝트 소유자인지 확인
    const [project] = await db
      .select({
        id: projects.id,
        title: projects.title,
        ownerId: projects.ownerId,
        status: projects.status
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
    const now = new Date().toISOString();
    const [milestone] = await db
      .insert(projectMilestones)
      .values({
        id: randomUUID(),
        projectId: params.id,
        title,
        description: description || null,
        dueDate: new Date(dueDate).toISOString(),
        status: status || 'PLANNED',
        createdAt: now,
        updatedAt: now
      })
      .returning();

    if (!milestone) {
      throw new Error('Failed to create milestone');
    }

    return NextResponse.json(milestone, { status: 201 });
  } catch (error) {
    console.error('Failed to create project milestone:', error);
    return NextResponse.json(
      { message: 'Failed to create project milestone' },
      { status: 500 }
    );
  }
}