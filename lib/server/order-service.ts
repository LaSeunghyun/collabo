import { OrderStatus, UserRole } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { responses } from './api-responses';

export interface OrderCreateData {
  userId: string;
  projectId?: string;
  items: Array<{
    productId?: string;
    rewardId?: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    options?: any;
  }>;
  shippingInfo?: any;
  metadata?: any;
}

export interface OrderUpdateData {
  orderStatus?: OrderStatus;
  shippingInfo?: any;
  metadata?: any;
}

export interface OrderFilters {
  userId?: string;
  projectId?: string;
  orderStatus?: OrderStatus;
  page?: number;
  limit?: number;
}

/**
 * 주문 생성
 */
export async function createOrder(data: OrderCreateData) {
  try {
    const { userId, projectId, items, shippingInfo, metadata } = data;

    // 총 금액 계산
    const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
    const shippingCost = 0; // 기본 배송비
    const taxAmount = 0; // 기본 세금
    const totalPrice = subtotal + shippingCost + taxAmount;

    const order = await prisma.order.create({
      data: {
        userId,
        projectId,
        totalPrice,
        subtotal,
        shippingCost,
        taxAmount,
        shippingInfo,
        metadata,
        orderStatus: OrderStatus.PENDING,
        items: {
          create: items.map(item => ({
            productId: item.productId,
            rewardId: item.rewardId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            options: item.options
          }))
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true
          }
        },
        project: {
          select: {
            id: true,
            title: true,
            status: true
          }
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                images: true,
                metadata: true
              }
            },
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
      }
    });

    return responses.success(order, '주문이 생성되었습니다.');
  } catch (error) {
    console.error('주문 생성 실패:', error);
    return responses.error('주문 생성에 실패했습니다.');
  }
}

/**
 * 주문 수정
 */
export async function updateOrder(orderId: string, data: OrderUpdateData, userId: string, userRole: UserRole) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      return responses.notFound('주문');
    }

    // 주문자 또는 관리자만 수정 가능
    if (order.userId !== userId && userRole !== UserRole.ADMIN) {
      return responses.forbidden();
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true
          }
        },
        project: {
          select: {
            id: true,
            title: true,
            status: true
          }
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                images: true,
                metadata: true
              }
            },
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
      }
    });

    return responses.success(updatedOrder, '주문이 수정되었습니다.');
  } catch (error) {
    console.error('주문 수정 실패:', error);
    return responses.error('주문 수정에 실패했습니다.');
  }
}

/**
 * 주문 목록 조회
 */
export async function getOrders(filters: OrderFilters) {
  try {
    const { userId, projectId, orderStatus, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};
    
    if (userId) where.userId = userId;
    if (projectId) where.projectId = projectId;
    if (orderStatus) where.orderStatus = orderStatus;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true
            }
          },
          project: {
            select: {
              id: true,
              title: true,
              status: true
            }
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  price: true,
                  images: true,
                metadata: true
                }
              },
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
        orderBy: { createdAt: 'desc' }
      }),
      prisma.order.count({ where })
    ]);

    return responses.success({
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('주문 목록 조회 실패:', error);
    return responses.error('주문 목록을 불러올 수 없습니다.');
  }
}

/**
 * 주문 상세 조회
 */
export async function getOrder(orderId: string) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true
          }
        },
        project: {
          select: {
            id: true,
            title: true,
            status: true,
            endDate: true,
            thumbnail: true
          }
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                images: true,
                metadata: true
              }
            },
            reward: {
              select: {
                id: true,
                title: true,
                price: true,
                deliveryType: true,
                estimatedDelivery: true
              }
            },
            tickets: {
              select: {
                id: true,
                qrCode: true,
                seat: true,
                eventDate: true,
                status: true
              }
            },
            shipments: {
              select: {
                id: true,
                carrier: true,
                trackingNo: true,
                status: true,
                shippedAt: true,
                deliveredAt: true
              }
            }
          }
        },
        payments: {
          select: {
            id: true,
            amount: true,
            status: true,
            createdAt: true
          }
        }
      }
    });

    if (!order) {
      return responses.notFound('주문');
    }

    return responses.success(order);
  } catch (error) {
    console.error('주문 조회 실패:', error);
    return responses.error('주문 정보를 불러올 수 없습니다.');
  }
}

/**
 * 주문 상태 변경
 */
export async function updateOrderStatus(
  orderId: string, 
  orderStatus: OrderStatus, 
  userId: string, 
  userRole: UserRole
) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      return responses.notFound('주문');
    }

    // 주문자 또는 관리자만 상태 변경 가능
    if (order.userId !== userId && userRole !== UserRole.ADMIN) {
      return responses.forbidden();
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { orderStatus },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true
          }
        },
        project: {
          select: {
            id: true,
            title: true,
            status: true
          }
        }
      }
    });

    return responses.success(updatedOrder, '주문 상태가 변경되었습니다.');
  } catch (error) {
    console.error('주문 상태 변경 실패:', error);
    return responses.error('주문 상태 변경에 실패했습니다.');
  }
}
