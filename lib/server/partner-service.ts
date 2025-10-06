import { PartnerType, PartnerMatchStatus } from '@/types/drizzle';
import { prisma } from '@/lib/drizzle';
import { responses } from './api-responses';

export interface PartnerCreateData {
  userId: string;
  type: PartnerType;
  name: string;
  description?: string;
  services?: any;
  pricingModel?: string;
  contactInfo: string;
  location?: string;
  portfolioUrl?: string;
}

export interface PartnerUpdateData {
  name?: string;
  description?: string;
  services?: any;
  pricingModel?: string;
  contactInfo?: string;
  location?: string;
  portfolioUrl?: string;
  verified?: boolean;
}

export interface PartnerMatchCreateData {
  projectId: string;
  partnerId: string;
  requirements?: any;
  notes?: any;
}

export interface PartnerMatchUpdateData {
  status?: PartnerMatchStatus;
  quote?: number;
  settlementShare?: number;
  contractUrl?: string;
  responseMessage?: string;
  notes?: any;
}

/**
 * ?ŒíŠ¸???ì„±
 */
export async function createPartner(data: PartnerCreateData) {
  try {
    // ê¸°ì¡´ ?ŒíŠ¸???±ë¡ ?•ì¸
    const existingPartner = await prisma.partner.findUnique({
      where: { userId: data.userId }
    });

    if (existingPartner) {
      throw new Error('?´ë? ?ŒíŠ¸?ˆë¡œ ?±ë¡???¬ìš©?ì…?ˆë‹¤.');
    }

    const partner = await prisma.partner.create({
      data: {
        userId: data.userId,
        type: data.type,
        name: data.name,
        description: data.description,
        services: data.services,
        pricingModel: data.pricingModel,
        contactInfo: data.contactInfo,
        location: data.location,
        portfolioUrl: data.portfolioUrl,
        verified: false
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true
          }
        }
      }
    });

    return responses.success(partner, '?ŒíŠ¸???±ë¡???„ë£Œ?˜ì—ˆ?µë‹ˆ??');
  } catch (error) {
    console.error('?ŒíŠ¸???ì„± ?¤íŒ¨:', error);
    return responses.error(error instanceof Error ? error.message : '?ŒíŠ¸???±ë¡???¤íŒ¨?ˆìŠµ?ˆë‹¤.');
  }
}

/**
 * ?ŒíŠ¸???•ë³´ ?˜ì •
 */
export async function updatePartner(partnerId: string, data: PartnerUpdateData, userId: string) {
  try {
    const partner = await prisma.partner.findUnique({
      where: { id: partnerId }
    });

    if (!partner) {
      return responses.notFound('?ŒíŠ¸??);
    }

    // ë³¸ì¸ ?ŒíŠ¸???•ë³´ë§??˜ì • ê°€??
    if (partner.userId !== userId) {
      return responses.forbidden();
    }

    const updatedPartner = await prisma.partner.update({
      where: { id: partnerId },
      data,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true
          }
        }
      }
    });

    return responses.success(updatedPartner, '?ŒíŠ¸???•ë³´ê°€ ?˜ì •?˜ì—ˆ?µë‹ˆ??');
  } catch (error) {
    console.error('?ŒíŠ¸???˜ì • ?¤íŒ¨:', error);
    return responses.error('?ŒíŠ¸???•ë³´ ?˜ì •???¤íŒ¨?ˆìŠµ?ˆë‹¤.');
  }
}

/**
 * ?ŒíŠ¸??ëª©ë¡ ì¡°íšŒ
 */
export async function getPartners(filters: {
  type?: PartnerType;
  verified?: boolean;
  location?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  try {
    const { type, verified, location, search, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};
    
    if (type) where.type = type;
    if (verified !== undefined) where.verified = verified;
    if (location) where.location = { contains: location, mode: 'insensitive' };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [partners, total] = await Promise.all([
      prisma.partner.findMany({
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
          _count: {
            select: {
              matches: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.partner.count({ where })
    ]);

    return responses.success({
      partners,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('?ŒíŠ¸??ëª©ë¡ ì¡°íšŒ ?¤íŒ¨:', error);
    return responses.error('?ŒíŠ¸??ëª©ë¡??ë¶ˆëŸ¬?????†ìŠµ?ˆë‹¤.');
  }
}

/**
 * ?ŒíŠ¸???ì„¸ ì¡°íšŒ
 */
export async function getPartner(partnerId: string) {
  try {
    const partner = await prisma.partner.findUnique({
      where: { id: partnerId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true
          }
        },
        matches: {
          include: {
            project: {
              select: {
                id: true,
                title: true,
                status: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!partner) {
      return responses.notFound('?ŒíŠ¸??);
    }

    return responses.success(partner);
  } catch (error) {
    console.error('?ŒíŠ¸??ì¡°íšŒ ?¤íŒ¨:', error);
    return responses.error('?ŒíŠ¸???•ë³´ë¥?ë¶ˆëŸ¬?????†ìŠµ?ˆë‹¤.');
  }
}

/**
 * ?ŒíŠ¸??ë§¤ì¹­ ?”ì²­ ?ì„±
 */
export async function createPartnerMatch(data: PartnerMatchCreateData, userId: string) {
  try {
    // ?„ë¡œ?íŠ¸ ?Œìœ ???•ì¸
    const project = await prisma.project.findUnique({
      where: { id: data.projectId },
      select: { ownerId: true }
    });

    if (!project) {
      return responses.notFound('?„ë¡œ?íŠ¸');
    }

    if (project.ownerId !== userId) {
      return responses.forbidden();
    }

    // ?ŒíŠ¸??ì¡´ì¬ ?•ì¸
    const partner = await prisma.partner.findUnique({
      where: { id: data.partnerId }
    });

    if (!partner) {
      return responses.notFound('?ŒíŠ¸??);
    }

    // ì¤‘ë³µ ë§¤ì¹­ ?”ì²­ ?•ì¸
    const existingMatch = await prisma.partnerMatch.findFirst({
      where: {
        projectId: data.projectId,
        partnerId: data.partnerId,
        status: { in: [PartnerMatchStatus.REQUESTED, PartnerMatchStatus.ACCEPTED] }
      }
    });

    if (existingMatch) {
      return responses.error('?´ë? ë§¤ì¹­ ?”ì²­??ì§„í–‰ ì¤‘ì…?ˆë‹¤.');
    }

    const match = await prisma.partnerMatch.create({
      data: {
        projectId: data.projectId,
        partnerId: data.partnerId,
        requirements: data.requirements,
        notes: data.notes,
        status: PartnerMatchStatus.REQUESTED
      },
      include: {
        project: {
          select: {
            id: true,
            title: true,
            status: true
          }
        },
        partner: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true
              }
            }
          }
        }
      }
    });

    return responses.success(match, '?ŒíŠ¸??ë§¤ì¹­ ?”ì²­???„ì†¡?˜ì—ˆ?µë‹ˆ??');
  } catch (error) {
    console.error('?ŒíŠ¸??ë§¤ì¹­ ?”ì²­ ?¤íŒ¨:', error);
    return responses.error('?ŒíŠ¸??ë§¤ì¹­ ?”ì²­???¤íŒ¨?ˆìŠµ?ˆë‹¤.');
  }
}

/**
 * ?ŒíŠ¸??ë§¤ì¹­ ?‘ë‹µ
 */
export async function respondToPartnerMatch(
  matchId: string, 
  data: PartnerMatchUpdateData, 
  userId: string
) {
  try {
    const match = await prisma.partnerMatch.findUnique({
      where: { id: matchId },
      include: {
        partner: { select: { userId: true } },
        project: { select: { ownerId: true } }
      }
    });

    if (!match) {
      return responses.notFound('ë§¤ì¹­ ?”ì²­');
    }

    // ?ŒíŠ¸???ëŠ” ?„ë¡œ?íŠ¸ ?Œìœ ?ë§Œ ?‘ë‹µ ê°€??
    const isPartner = match.partner.userId === userId;
    const isProjectOwner = match.project.ownerId === userId;

    if (!isPartner && !isProjectOwner) {
      return responses.forbidden();
    }

    const updateData: any = { ...data };
    
    if (data.status === PartnerMatchStatus.ACCEPTED) {
      updateData.acceptedAt = new Date();
    } else if (data.status === PartnerMatchStatus.CANCELLED) {
      updateData.cancelledAt = new Date();
    }

    const updatedMatch = await prisma.partnerMatch.update({
      where: { id: matchId },
      data: updateData,
      include: {
        project: {
          select: {
            id: true,
            title: true,
            status: true
          }
        },
        partner: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true
              }
            }
          }
        }
      }
    });

    return responses.success(updatedMatch, 'ë§¤ì¹­ ?‘ë‹µ??ì²˜ë¦¬?˜ì—ˆ?µë‹ˆ??');
  } catch (error) {
    console.error('?ŒíŠ¸??ë§¤ì¹­ ?‘ë‹µ ?¤íŒ¨:', error);
    return responses.error('ë§¤ì¹­ ?‘ë‹µ ì²˜ë¦¬???¤íŒ¨?ˆìŠµ?ˆë‹¤.');
  }
}

/**
 * ?ŒíŠ¸??ë§¤ì¹­ ëª©ë¡ ì¡°íšŒ
 */
export async function getPartnerMatches(filters: {
  projectId?: string;
  partnerId?: string;
  status?: PartnerMatchStatus;
  userId?: string;
  page?: number;
  limit?: number;
}) {
  try {
    const { projectId, partnerId, status, userId, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};
    
    if (projectId) where.projectId = projectId;
    if (partnerId) where.partnerId = partnerId;
    if (status) where.status = status;
    if (userId) {
      where.OR = [
        { project: { ownerId: userId } },
        { partner: { userId: userId } }
      ];
    }

    const [matches, total] = await Promise.all([
      prisma.partnerMatch.findMany({
        where,
        skip,
        take: limit,
        include: {
          project: {
            select: {
              id: true,
              title: true,
              status: true,
              owner: {
                select: {
                  id: true,
                  name: true,
                  avatarUrl: true
                }
              }
            }
          },
          partner: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  avatarUrl: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.partnerMatch.count({ where })
    ]);

    return responses.success({
      matches,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('?ŒíŠ¸??ë§¤ì¹­ ëª©ë¡ ì¡°íšŒ ?¤íŒ¨:', error);
    return responses.error('ë§¤ì¹­ ëª©ë¡??ë¶ˆëŸ¬?????†ìŠµ?ˆë‹¤.');
  }
}
