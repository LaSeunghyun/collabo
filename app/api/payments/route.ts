import { NextRequest, NextResponse } from 'next/server';
import { requireApiUser } from '@/lib/auth/guards';
import { UserRole, OrderStatus, PaymentProvider } from '@/types/prisma';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const user = await requireApiUser({ roles: [UserRole.PARTICIPANT] });
    const body = await request.json();

    const {
      orderId,
      paymentMethod,
      paymentData
    } = body;

    if (!orderId || !paymentMethod) {
      return NextResponse.json(
        { message: '주문 ID와 결제 방법이 필요합니다.' },
        { status: 400 }
      );
    }

    // 주문 확인
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        project: true,
        orderItems: {
          include: {
            reward: true
          }
        }
      }
    });

    if (!order) {
      return NextResponse.json(
        { message: '주문을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    if (order.userId !== user.id) {
      return NextResponse.json(
        { message: '권한이 없습니다.' },
        { status: 403 }
      );
    }

    if (order.status !== OrderStatus.PENDING) {
      return NextResponse.json(
        { message: '이미 처리된 주문입니다.' },
        { status: 400 }
      );
    }

    // 결제 처리 (실제 결제 게이트웨이 연동은 추후 구현)
    const paymentResult = await processPayment({
      orderId,
      amount: order.totalAmount,
      paymentMethod,
      paymentData
    });

    if (!paymentResult.success) {
      return NextResponse.json(
        { message: paymentResult.error || '결제에 실패했습니다.' },
        { status: 400 }
      );
    }

    // 결제 기록 생성
    const payment = await prisma.paymentTransaction.create({
      data: {
        orderId,
        amount: order.totalAmount,
        provider: paymentMethod === 'CARD' ? PaymentProvider.STRIPE : PaymentProvider.TOSS,
        status: 'SUCCEEDED',
        transactionId: paymentResult.transactionId,
        metadata: {
          paymentData,
          processedAt: new Date().toISOString()
        }
      }
    });

    // 주문 상태 업데이트
    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.PAID,
        paidAt: new Date()
      }
    });

    // 프로젝트 성공 여부 확인
    await checkProjectSuccess(order.projectId);

    return NextResponse.json({
      paymentId: payment.id,
      status: 'SUCCEEDED',
      message: '결제가 완료되었습니다.'
    });

  } catch (error) {
    console.error('Failed to process payment:', error);
    return NextResponse.json(
      { message: '결제 처리에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// 결제 처리 함수 (실제 구현은 결제 게이트웨이에 따라 달라짐)
async function processPayment({
  orderId,
  amount,
  paymentMethod,
  paymentData
}: {
  orderId: string;
  amount: number;
  paymentMethod: string;
  paymentData: any;
}) {
  // 실제 환경에서는 Stripe, Toss Payments 등과 연동
  // 여기서는 시뮬레이션
  
  try {
    // 결제 검증 로직
    if (amount <= 0) {
      return { success: false, error: '잘못된 결제 금액입니다.' };
    }

    // 카드 정보 검증 (실제로는 PCI DSS 준수 필요)
    if (paymentMethod === 'CARD' && !paymentData.cardNumber) {
      return { success: false, error: '카드 정보가 필요합니다.' };
    }

    // 결제 시뮬레이션 (90% 성공률)
    const isSuccess = Math.random() > 0.1;
    
    if (!isSuccess) {
      return { success: false, error: '결제가 거절되었습니다.' };
    }

    return {
      success: true,
      transactionId: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  } catch (error) {
    return { success: false, error: '결제 처리 중 오류가 발생했습니다.' };
  }
}

// 프로젝트 성공 여부 확인
async function checkProjectSuccess(projectId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId }
  });

  if (!project) return;

  // 목표 금액 달성 확인
  if (project.currentAmount >= project.targetAmount && project.status === 'LIVE') {
    await prisma.project.update({
      where: { id: projectId },
      data: {
        status: 'SUCCEEDED',
        succeededAt: new Date()
      }
    });

    // 성공 알림 로직 (추후 구현)
    console.log(`프로젝트 ${projectId}가 성공했습니다!`);
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireApiUser({ roles: [UserRole.PARTICIPANT] });
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json(
        { message: '주문 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    const payments = await prisma.paymentTransaction.findMany({
      where: {
        order: {
          id: orderId,
          userId: user.id
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ payments });
  } catch (error) {
    console.error('Failed to fetch payments:', error);
    return NextResponse.json(
      { message: '결제 내역을 불러올 수 없습니다.' },
      { status: 500 }
    );
  }
}