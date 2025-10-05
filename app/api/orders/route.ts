import { NextRequest, NextResponse } from 'next/server';
import { requireApiUser } from '@/lib/auth/guards';
import { UserRole, OrderStatus } from '@/types/prisma';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const user = await requireApiUser({ roles: [UserRole.PARTICIPANT] });
    const body = await request.json();

    const {
      projectId,
      rewardId,
      quantity = 1,
      options = {},
      shippingAddress,
      paymentMethod = 'CARD'
    } = body;

    // 필수 필드 검증
    if (!projectId || !rewardId) {
      return NextResponse.json(
        { message: '프로젝트 ID와 리워드 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // 프로젝트와 리워드 확인
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        rewards: {
          where: { id: rewardId }
        }
      }
    });

    if (!project) {
      return NextResponse.json(
        { message: '프로젝트를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    if (project.status !== 'LIVE') {
      return NextResponse.json(
        { message: '진행중인 프로젝트가 아닙니다.' },
        { status: 400 }
      );
    }

    const reward = project.rewards[0];
    if (!reward) {
      return NextResponse.json(
        { message: '리워드를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 재고 확인
    if (reward.stock && (reward.claimed + quantity) > reward.stock) {
      return NextResponse.json(
        { message: '재고가 부족합니다.' },
        { status: 400 }
      );
    }

    // 주문 생성
    const order = await prisma.order.create({
      data: {
        userId: user.id,
        projectId,
        status: OrderStatus.PENDING,
        totalAmount: reward.price * quantity,
        metadata: {
          shippingAddress,
          paymentMethod,
          options
        }
      }
    });

    // 주문 아이템 생성
    const orderItem = await prisma.orderItem.create({
      data: {
        orderId: order.id,
        rewardId,
        quantity,
        unitPrice: reward.price,
        totalPrice: reward.price * quantity,
        options
      }
    });

    // 리워드 claimed 수량 업데이트
    await prisma.reward.update({
      where: { id: rewardId },
      data: {
        claimed: {
          increment: quantity
        }
      }
    });

    // 프로젝트 현재 모금액 업데이트
    await prisma.project.update({
      where: { id: projectId },
      data: {
        currentAmount: {
          increment: reward.price * quantity
        }
      }
    });

    return NextResponse.json({
      orderId: order.id,
      status: order.status,
      totalAmount: order.totalAmount,
      message: '주문이 생성되었습니다. 결제를 진행해주세요.'
    }, { status: 201 });

  } catch (error) {
    console.error('Failed to create order:', error);
    return NextResponse.json(
      { message: '주문 생성에 실패했습니다.' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireApiUser({ roles: [UserRole.PARTICIPANT] });
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const where: any = { userId: user.id };
    if (status) where.status = status;

    const orders = await prisma.order.findMany({
      where,
      include: {
        project: {
          select: {
            id: true,
            title: true,
            thumbnail: true
          }
        },
        orderItems: {
          include: {
            reward: {
              select: {
                id: true,
                title: true,
                price: true,
                deliveryType: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    });

    const total = await prisma.order.count({ where });

    return NextResponse.json({
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Failed to fetch orders:', error);
    return NextResponse.json(
      { message: '주문 목록을 불러올 수 없습니다.' },
      { status: 500 }
    );
  }
}