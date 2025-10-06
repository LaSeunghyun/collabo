import { PartnerType, PartnerMatchStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
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
 * 파트너 생성
 */
export async function createPartner(data: PartnerCreateData) {
  try {
    // 기존 파트너 등록 확인
    const existingPartner = await prisma.partner.findUnique({
      where: { userId: data.userId }
    });

    if (existingPartner) {
      throw new Error('이미 파트너로 등록된 사용자입니다.');
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

    return responses.success(partner, '파트너 등록이 완료되었습니다.');
  } catch (error) {
    console.error('파트너 생성 실패:', error);
    return responses.error(error instanceof Error ? error.message : '파트너 등록에 실패했습니다.');
  }
}

/**
 * 파트너 정보 수정
 */
export async function updatePartner(partnerId: string, data: PartnerUpdateData, userId: string) {
  try {
    const partner = await prisma.partner.findUnique({
      where: { id: partnerId }
    });

    if (!partner) {
      return responses.notFound('파트너');
    }

    // 본인 파트너 정보만 수정 가능
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

    return responses.success(updatedPartner, '파트너 정보가 수정되었습니다.');
  } catch (error) {
    console.error('파트너 수정 실패:', error);
    return responses.error('파트너 정보 수정에 실패했습니다.');
  }
}

/**
 * 파트너 목록 조회
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
    console.error('파트너 목록 조회 실패:', error);
    return responses.error('파트너 목록을 불러올 수 없습니다.');
  }
}

/**
 * 파트너 상세 조회
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
      return responses.notFound('파트너');
    }

    return responses.success(partner);
  } catch (error) {
    console.error('파트너 조회 실패:', error);
    return responses.error('파트너 정보를 불러올 수 없습니다.');
  }
}

/**
 * 파트너 매칭 요청 생성
 */
export async function createPartnerMatch(data: PartnerMatchCreateData, userId: string) {
  try {
    // 프로젝트 소유자 확인
    const project = await prisma.project.findUnique({
      where: { id: data.projectId },
      select: { ownerId: true }
    });

    if (!project) {
      return responses.notFound('프로젝트');
    }

    if (project.ownerId !== userId) {
      return responses.forbidden();
    }

    // 파트너 존재 확인
    const partner = await prisma.partner.findUnique({
      where: { id: data.partnerId }
    });

    if (!partner) {
      return responses.notFound('파트너');
    }

    // 중복 매칭 요청 확인
    const existingMatch = await prisma.partnerMatch.findFirst({
      where: {
        projectId: data.projectId,
        partnerId: data.partnerId,
        status: { in: [PartnerMatchStatus.REQUESTED, PartnerMatchStatus.ACCEPTED] }
      }
    });

    if (existingMatch) {
      return responses.error('이미 매칭 요청이 진행 중입니다.');
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

    return responses.success(match, '파트너 매칭 요청이 전송되었습니다.');
  } catch (error) {
    console.error('파트너 매칭 요청 실패:', error);
    return responses.error('파트너 매칭 요청에 실패했습니다.');
  }
}

/**
 * 파트너 매칭 응답
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
      return responses.notFound('매칭 요청');
    }

    // 파트너 또는 프로젝트 소유자만 응답 가능
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

    return responses.success(updatedMatch, '매칭 응답이 처리되었습니다.');
  } catch (error) {
    console.error('파트너 매칭 응답 실패:', error);
    return responses.error('매칭 응답 처리에 실패했습니다.');
  }
}

/**
 * 파트너 매칭 목록 조회
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
    console.error('파트너 매칭 목록 조회 실패:', error);
    return responses.error('매칭 목록을 불러올 수 없습니다.');
  }
}
