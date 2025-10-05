import { NextRequest, NextResponse } from 'next/server';
import { requireApiUser } from '@/lib/auth/guards';
import { UserRole, ProjectStatus } from '@/types/prisma';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const user = await requireApiUser({ roles: [UserRole.CREATOR] });
    const body = await request.json();

    const {
      title,
      description,
      category,
      targetAmount,
      endDate,
      currency = 'KRW',
      rewards = [],
      budget,
      needsPartner = false,
      partnerRequirements,
      agreements
    } = body;

    // 필수 필드 검증
    if (!title || !description || !category || !targetAmount || !endDate) {
      return NextResponse.json(
        { message: '필수 필드가 누락되었습니다.' },
        { status: 400 }
      );
    }

    // 동의 확인
    if (!agreements?.copyright || !agreements?.portrait || !agreements?.refund) {
      return NextResponse.json(
        { message: '모든 약관에 동의해야 합니다.' },
        { status: 400 }
      );
    }

    // 프로젝트 생성
    const project = await prisma.project.create({
      data: {
        title,
        description,
        category,
        targetAmount,
        currency,
        status: ProjectStatus.DRAFT,
        endDate: new Date(endDate),
        ownerId: user.id,
        metadata: {
          budget,
          needsPartner,
          partnerRequirements,
          agreements
        }
      }
    });

    // 리워드 생성
    if (rewards.length > 0) {
      await Promise.all(
        rewards.map((reward: any) =>
          prisma.reward.create({
            data: {
              projectId: project.id,
              title: reward.title,
              description: reward.description,
              price: reward.price,
              stock: reward.stock,
              deliveryType: reward.deliveryType,
              estimatedDelivery: reward.estimatedDelivery ? new Date(reward.estimatedDelivery) : null,
              isEarlyBird: reward.isEarlyBird,
              options: reward.options
            }
          })
        )
      );
    }

    // 파트너 매칭 요청 생성
    if (needsPartner && partnerRequirements) {
      await prisma.partnerMatch.create({
        data: {
          projectId: project.id,
          partnerId: null, // 아직 매칭되지 않음
          status: 'PENDING',
          requirements: partnerRequirements
        }
      });
    }

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error('Failed to create project:', error);
    return NextResponse.json(
      { message: '프로젝트 생성에 실패했습니다.' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const where: any = {};
    if (status) where.status = status;
    if (category) where.category = category;

    const projects = await prisma.project.findMany({
      where,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            avatarUrl: true
          }
        },
        rewards: true,
        _count: {
          select: {
            fundings: true,
            rewards: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    });

    const total = await prisma.project.count({ where });

    return NextResponse.json({
      projects,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Failed to fetch projects:', error);
    return NextResponse.json(
      { message: '프로젝트 목록을 불러올 수 없습니다.' },
      { status: 500 }
    );
  }
}