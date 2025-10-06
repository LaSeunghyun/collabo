// DeliveryType, TicketStatus enums removed - using string types
import { prisma } from '@/lib/drizzle';
import { responses } from './api-responses';

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
 * ë¦¬ì›Œ???´í–‰ ?ì„±
 */
export async function createRewardFulfillment(data: RewardFulfillmentData) {
  try {
    const { orderItemId, rewardId, deliveryType, shippingInfo, trackingNumber, estimatedDelivery, notes } = data;

    // ì£¼ë¬¸ ?„ì´???•ì¸
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
      return responses.notFound('ì£¼ë¬¸ ?„ì´?? );
    }

    // ë¦¬ì›Œ???•ì¸
    const reward = await prisma.reward.findUnique({
      where: { id: rewardId }
    });

    if (!reward) {
      return responses.notFound('ë¦¬ì›Œ??);
    }

    // ë°°ì†¡ ?•ë³´ ?ì„±
    if (deliveryType === DeliveryType.SHIPPING) {
      const shipment = await prisma.shipment.create({
        data: {
          orderItemId,
          rewardId,
          carrier: shippingInfo?.carrier || 'ê¸°ë³¸ ?ë°°',
          trackingNo: trackingNumber,
          status: 'PENDING'
        }
      });

      return responses.success(shipment, 'ë°°ì†¡ ?•ë³´ê°€ ?ì„±?˜ì—ˆ?µë‹ˆ??');
    }

    // ?½ì—… ?•ë³´ ?ì„±
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

      return responses.success(pickupInfo, '?½ì—… ?•ë³´ê°€ ?ì„±?˜ì—ˆ?µë‹ˆ??');
    }

    return responses.error('ì§€?í•˜ì§€ ?ŠëŠ” ë°°ì†¡ ? í˜•?…ë‹ˆ??');
  } catch (error) {
    console.error('ë¦¬ì›Œ???´í–‰ ?ì„± ?¤íŒ¨:', error);
    return responses.error('ë¦¬ì›Œ???´í–‰ ?ì„±???¤íŒ¨?ˆìŠµ?ˆë‹¤.');
  }
}

/**
 * ?°ì¼“ ?´í–‰ ?ì„±
 */
export async function createTicketFulfillment(data: TicketFulfillmentData) {
  try {
    const { orderItemId, rewardId, eventDate, seat } = data;

    // ì£¼ë¬¸ ?„ì´???•ì¸
    const orderItem = await prisma.orderItem.findUnique({
      where: { id: orderItemId },
      include: {
        order: true
      }
    });

    if (!orderItem) {
      return responses.notFound('ì£¼ë¬¸ ?„ì´??);
    }

    // ë¦¬ì›Œ???•ì¸
    const reward = await prisma.reward.findUnique({
      where: { id: rewardId }
    });

    if (!reward) {
      return responses.notFound('ë¦¬ì›Œ??);
    }

    // ?°ì¼“ ?ì„±
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

    return responses.success(ticket, '?°ì¼“???ì„±?˜ì—ˆ?µë‹ˆ??');
  } catch (error) {
    console.error('?°ì¼“ ?´í–‰ ?ì„± ?¤íŒ¨:', error);
    return responses.error('?°ì¼“ ?´í–‰ ?ì„±???¤íŒ¨?ˆìŠµ?ˆë‹¤.');
  }
}

/**
 * ë°°ì†¡ ?íƒœ ?…ë°?´íŠ¸
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
      return responses.notFound('ë°°ì†¡');
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

    return responses.success(updatedShipment, 'ë°°ì†¡ ?íƒœê°€ ?…ë°?´íŠ¸?˜ì—ˆ?µë‹ˆ??');
  } catch (error) {
    console.error('ë°°ì†¡ ?íƒœ ?…ë°?´íŠ¸ ?¤íŒ¨:', error);
    return responses.error('ë°°ì†¡ ?íƒœ ?…ë°?´íŠ¸???¤íŒ¨?ˆìŠµ?ˆë‹¤.');
  }
}

/**
 * ?°ì¼“ ?íƒœ ?…ë°?´íŠ¸
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
      return responses.notFound('?°ì¼“');
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

    return responses.success(updatedTicket, '?°ì¼“ ?íƒœê°€ ?…ë°?´íŠ¸?˜ì—ˆ?µë‹ˆ??');
  } catch (error) {
    console.error('?°ì¼“ ?íƒœ ?…ë°?´íŠ¸ ?¤íŒ¨:', error);
    return responses.error('?°ì¼“ ?íƒœ ?…ë°?´íŠ¸???¤íŒ¨?ˆìŠµ?ˆë‹¤.');
  }
}

/**
 * ?´í–‰ ?„í™© ì¡°íšŒ
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
    console.error('?´í–‰ ?„í™© ì¡°íšŒ ?¤íŒ¨:', error);
    return responses.error('?´í–‰ ?„í™©??ë¶ˆëŸ¬?????†ìŠµ?ˆë‹¤.');
  }
}

/**
 * ?´í–‰ ?µê³„ ì¡°íšŒ
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
    console.error('?´í–‰ ?µê³„ ì¡°íšŒ ?¤íŒ¨:', error);
    return responses.error('?´í–‰ ?µê³„ë¥?ë¶ˆëŸ¬?????†ìŠµ?ˆë‹¤.');
  }
}
