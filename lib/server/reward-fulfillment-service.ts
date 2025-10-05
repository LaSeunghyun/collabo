import { DeliveryType, TicketStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { responses } from './api-utils';

export interface RewardFulfillmentData {
  orderItemId: string;
  rewardId: string;
  deliveryType: DeliveryType;
  shippingInfo?: any;
  trackingNumber?: string;
  estimatedDelivery?: Date;
  notes?: string;
}

export interface TicketFulfillmentData {
  orderItemId: string;
  rewardId: string;
  eventDate: Date;
  venue: string;
  seat?: string;
  notes?: string;
}

export interface FulfillmentFilters {
  orderItemId?: string;
  projectId?: string;
  status?: string;
  deliveryType?: DeliveryType;
  page?: number;
  limit?: number;
}

/**
 * 리워드 이행 생성
 */
export async function createRewardFulfillment(data: RewardFulfillmentData) {
  try {
    const { orderItemId, rewardId, deliveryType, shippingInfo, trackingNumber, estimatedDelivery, notes } = data;

    // 주문 아이템 확인
    const orderItem = await prisma.orderItem.findUnique({
      where: { id: orderItemId },
      include: {
        order: {
          include: {
            project: true
          }
        },
        reward: true
      }
    });

    if (!orderItem) {
      return responses.notFound('주문 아이템' );
    }

    // 리워드 확인
    const reward = await prisma.reward.findUnique({
      where: { id: rewardId }
    });

    if (!reward) {
      return responses.notFound('리워드');
    }

    // 배송 정보 생성
    if (deliveryType === DeliveryType.SHIPPING) {
      const shipment = await prisma.shipment.create({
        data: {
          orderItemId,
          rewardId,
          carrier: shippingInfo?.carrier || '기본 택배',
          trackingNo: trackingNumber,
          status: 'PENDING'
        }
      });

      return responses.success(shipment, '배송 정보가 생성되었습니다.');
    }

    // 픽업 정보 생성
    if (deliveryType === DeliveryType.PICKUP) {
      const pickupInfo = await prisma.orderItem.update({
        where: { id: orderItemId },
        data: {
          metadata: {
            ...(orderItem.metadata as any || {}),
            pickupInfo: {
              location: shippingInfo?.location,
              date: estimatedDelivery,
              notes
            }
          }
        }
      });

      return responses.success(pickupInfo, '픽업 정보가 생성되었습니다.');
    }

    return responses.error('지원하지 않는 배송 유형입니다.');
  } catch (error) {
    console.error('리워드 이행 생성 실패:', error);
    return responses.error('리워드 이행 생성에 실패했습니다.');
  }
}

/**
 * 티켓 이행 생성
 */
export async function createTicketFulfillment(data: TicketFulfillmentData) {
  try {
    const { orderItemId, rewardId, eventDate, seat } = data;

    // 주문 아이템 확인
    const orderItem = await prisma.orderItem.findUnique({
      where: { id: orderItemId },
      include: {
        order: true
      }
    });

    if (!orderItem) {
      return responses.notFound('주문 아이템');
    }

    // 리워드 확인
    const reward = await prisma.reward.findUnique({
      where: { id: rewardId }
    });

    if (!reward) {
      return responses.notFound('리워드');
    }

    // 티켓 생성
    const ticket = await prisma.ticket.create({
      data: {
        orderItemId,
        rewardId,
        eventDate,
        seat,
        status: TicketStatus.ISSUED,
        qrCode: `TICKET_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }
    });

    return responses.success(ticket, '티켓이 생성되었습니다.');
  } catch (error) {
    console.error('티켓 이행 생성 실패:', error);
    return responses.error('티켓 이행 생성에 실패했습니다.');
  }
}

/**
 * 배송 상태 업데이트
 */
export async function updateShipmentStatus(
  shipmentId: string, 
  status: string, 
  trackingNumber?: string,
  notes?: string
) {
  try {
    const shipment = await prisma.shipment.findUnique({
      where: { id: shipmentId }
    });

    if (!shipment) {
      return responses.notFound('배송');
    }

    const updateData: any = { status };
    
    if (trackingNumber) {
      updateData.trackingNo = trackingNumber;
    }
    
    if (status === 'SHIPPED') {
      updateData.shippedAt = new Date();
    } else if (status === 'DELIVERED') {
      updateData.deliveredAt = new Date();
    }
    
    if (notes) {
      updateData.notes = notes;
    }

    const updatedShipment = await prisma.shipment.update({
      where: { id: shipmentId },
      data: updateData,
      include: {
        orderItem: {
          include: {
            order: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true
                  }
                },
                project: {
                  select: {
                    id: true,
                    title: true
                  }
                }
              }
            }
          }
        }
      }
    });

    return responses.success(updatedShipment, '배송 상태가 업데이트되었습니다.');
  } catch (error) {
    console.error('배송 상태 업데이트 실패:', error);
    return responses.error('배송 상태 업데이트에 실패했습니다.');
  }
}

/**
 * 티켓 상태 업데이트
 */
export async function updateTicketStatus(
  ticketId: string, 
  status: TicketStatus,
  notes?: string
) {
  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId }
    });

    if (!ticket) {
      return responses.notFound('티켓');
    }

    const updateData: any = { status };
    
    if (status === TicketStatus.USED) {
      updateData.usedAt = new Date();
    } else if (status === TicketStatus.CANCELLED) {
      updateData.cancelledAt = new Date();
    }
    
    if (notes) {
      updateData.notes = notes;
    }

    const updatedTicket = await prisma.ticket.update({
      where: { id: ticketId },
      data: updateData,
      include: {
        orderItem: {
          include: {
            order: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true
                  }
                },
                project: {
                  select: {
                    id: true,
                    title: true
                  }
                }
              }
            }
          }
        },
        reward: {
          select: {
            id: true,
            title: true,
            description: true
          }
        }
      }
    });

    return responses.success(updatedTicket, '티켓 상태가 업데이트되었습니다.');
  } catch (error) {
    console.error('티켓 상태 업데이트 실패:', error);
    return responses.error('티켓 상태 업데이트에 실패했습니다.');
  }
}

/**
 * 이행 현황 조회
 */
export async function getFulfillmentStatus(filters: FulfillmentFilters) {
  try {
    const { orderItemId, projectId, status, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};
    
    if (orderItemId) where.orderItemId = orderItemId;
    if (projectId) {
      where.orderItem = {
        order: {
          projectId
        }
      };
    }
    if (status) where.status = status;

    const [shipments, tickets, total] = await Promise.all([
      prisma.shipment.findMany({
        where,
        skip,
        take: limit,
        include: {
          orderItem: {
            include: {
              order: {
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
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.ticket.findMany({
        where: {
          orderItem: projectId ? {
            order: {
              projectId
            }
          } : undefined
        },
        skip,
        take: limit,
        include: {
          orderItem: {
            include: {
              order: {
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
              }
            }
          },
          reward: {
            select: {
              id: true,
              title: true,
              description: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.shipment.count({ where })
    ]);

    return responses.success({
      shipments,
      tickets,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('이행 현황 조회 실패:', error);
    return responses.error('이행 현황을 불러올 수 없습니다.');
  }
}

/**
 * 이행 통계 조회
 */
export async function getFulfillmentStats(projectId?: string) {
  try {
    const where = projectId ? { orderItem: { order: { projectId } } } : {};

    const [totalShipments, pendingShipments, deliveredShipments, totalTickets, activeTickets, usedTickets] = await Promise.all([
      prisma.shipment.count({ where }),
      prisma.shipment.count({ 
        where: { 
          ...where, 
          status: 'PENDING' 
        } 
      }),
      prisma.shipment.count({ 
        where: { 
          ...where, 
          status: 'DELIVERED' 
        } 
      }),
      prisma.ticket.count({ 
        where: projectId ? { orderItem: { order: { projectId } } } : {} 
      }),
      prisma.ticket.count({ 
        where: { 
          ...(projectId ? { orderItem: { order: { projectId } } } : {}), 
          status: 'ISSUED' 
        } 
      }),
      prisma.ticket.count({ 
        where: { 
          ...(projectId ? { orderItem: { order: { projectId } } } : {}), 
          status: 'USED' 
        } 
      })
    ]);

    const stats = {
      totalShipments,
      pendingShipments,
      deliveredShipments,
      totalTickets,
      activeTickets,
      usedTickets
    };

    return responses.success(stats);
  } catch (error) {
    console.error('이행 통계 조회 실패:', error);
    return responses.error('이행 통계를 불러올 수 없습니다.');
  }
}
