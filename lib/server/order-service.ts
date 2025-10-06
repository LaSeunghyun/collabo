import { OrderStatus, UserRole } from '@/types/drizzle';
import { prisma } from '@/lib/drizzle';
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
 * 주문 ?�성
 */
export async function createOrder(data: OrderCreateData) {
  try {
    const { userId, projectId, items, shippingInfo, metadata } = data;

    // �?금액 계산
    const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
    const shippingCost = 0; // 기본 배송�?
    const taxAmount = 0; // 기본 ?�금
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

    return responses.success(order, '주문???�성?�었?�니??');
  } catch (error) {
    console.error('주문 ?�성 ?�패:', error);
    return responses.error('주문 ?�성???�패?�습?�다.');
  }
}

/**
 * 주문 ?�정
 */
export async function updateOrder(orderId: string, data: OrderUpdateData, userId: string, userRole: UserRole) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      return responses.notFound('주문');
    }

    // 주문???�는 관리자�??�정 가??
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

    return responses.success(updatedOrder, '주문???�정?�었?�니??');
  } catch (error) {
    console.error('주문 ?�정 ?�패:', error);
    return responses.error('주문 ?�정???�패?�습?�다.');
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
    console.error('주문 목록 조회 ?�패:', error);
    return responses.error('주문 목록??불러?????�습?�다.');
  }
}

/**
 * 주문 ?�세 조회
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
    console.error('주문 조회 ?�패:', error);
    return responses.error('주문 ?�보�?불러?????�습?�다.');
  }
}

/**
 * 주문 ?�태 변�?
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

    // 주문???�는 관리자�??�태 변�?가??
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

    return responses.success(updatedOrder, '주문 ?�태가 변경되?�습?�다.');
  } catch (error) {
    console.error('주문 ?�태 변�??�패:', error);
    return responses.error('주문 ?�태 변경에 ?�패?�습?�다.');
  }
}
