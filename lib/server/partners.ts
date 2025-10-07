import { revalidatePath } from 'next/cache';
import { Prisma, type Prisma as PrismaTypes } from '@prisma/client';
import {
  UserRole,
  PartnerSummary,
  type PartnerTypeType
} from '@/types/auth';
import { ZodError } from 'zod';

import type { SessionUser } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
import {
  createPartnerSchema,
  updatePartnerSchema,
  type CreatePartnerInput,
  type UpdatePartnerInput
} from '@/lib/validators/partners';

const PARTNERS_PATH = '/partners';
const MAX_PAGE_SIZE = 50;
const DEFAULT_PAGE_SIZE = 12;

const sanitizeText = (value?: string | null) => {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const sanitizeTags = (value?: string[] | null) => {
  if (!value) {
    return null;
  }

  const unique = Array.from(new Set(value.map((item) => item.trim()).filter(Boolean)));
  return unique.length ? unique : null;
};

const sanitizeAvailability = (
  value: unknown
): PrismaTypes.InputJsonValue | null => {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const timezoneValue = (value as { timezone?: unknown }).timezone;
  const timezone = typeof timezoneValue === 'string' ? timezoneValue.trim() : null;
  const slotsValue = (value as { slots?: unknown }).slots;

  if (!timezone && !Array.isArray(slotsValue)) {
    return null;
  }

  const slots = Array.isArray(slotsValue)
    ? slotsValue
      .map((slot) => {
        if (!slot || typeof slot !== 'object') {
          return null;
        }

        const dayValue = (slot as { day?: unknown }).day;
        const startValue = (slot as { start?: unknown }).start;
        const endValue = (slot as { end?: unknown }).end;
        const noteValue = (slot as { note?: unknown }).note;

        const day = typeof dayValue === 'string' ? dayValue.trim() : null;
        const start = typeof startValue === 'string' ? startValue.trim() : null;
        const end = typeof endValue === 'string' ? endValue.trim() : null;
        const note = typeof noteValue === 'string' ? noteValue.trim() : null;

        if (!day || !start || !end) {
          return null;
        }

        const payload: PrismaTypes.JsonObject = note
          ? { day, start, end, note }
          : { day, start, end };

        return payload;
      })
      .filter((slot): slot is PrismaTypes.JsonObject => Boolean(slot))
    : [];

  if (!timezone && slots.length === 0) {
    return null;
  }

  const payload: PrismaTypes.JsonObject = {
    ...(timezone ? { timezone } : {}),
    ...(slots.length ? { slots } : {})
  };

  return payload;
};

type PartnerWithRelations = PrismaTypes.PartnerGetPayload<{
  include: {
    user: { select: { id: true; name: true; avatarUrl: true; role: true } };
    _count: { select: { matches: true } };
  };
}>;

// PartnerSummary Ÿ���� @/types/auth���� import�մϴ�

const toPartnerSummary = (partner: PartnerWithRelations): PartnerSummary => {
  // const services = Array.isArray(partner.services)
  //   ? partner.services.filter((item: unknown): item is string => typeof item === 'string')
  //   : [];

  // const availability = (partner.availability ?? null) as Prisma.JsonValue | null;

  return {
    id: partner.id,
    name: partner.name,
    type: partner.type,
    verified: partner.verified,
    // rating: partner.rating ?? null,
    description: partner.description ?? null,
    // services,
    // pricingModel: partner.pricingModel ?? null,
    location: partner.location ?? null,
    // availability,
    portfolioUrl: partner.portfolioUrl ?? null,
    contactInfo: partner.contactInfo,
    matchCount: partner._count.matches,
    user: {
      id: partner.user.id,
      name: partner.user.name ?? null,
      avatarUrl: partner.user.avatarUrl ?? null
    },
    createdAt: partner.createdAt,
    updatedAt: partner.updatedAt
  };
};

const parseCreateInput = (payload: unknown): CreatePartnerInput => {
  try {
    return createPartnerSchema.parse(payload);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new PartnerValidationError(error);
    }

    throw error;
  }
};

const parseUpdateInput = (payload: unknown): UpdatePartnerInput => {
  try {
    return updatePartnerSchema.parse(payload);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new PartnerValidationError(error);
    }

    throw error;
  }
};

const revalidatePartners = () => {
  revalidatePath(PARTNERS_PATH);
};

export class PartnerValidationError extends Error {
  issues: string[];

  constructor(error: ZodError) {
    super('��Ʈ�� ������ ��ȿ���� �ʽ��ϴ�.');
    this.issues = error.issues.map((issue) => issue.message);
  }
}

export class PartnerProfileExistsError extends Error {
  constructor() {
    super('�̹� ��ϵ� ��Ʈ�� �������� �ֽ��ϴ�.');
  }
}

export class PartnerOwnerNotFoundError extends Error {
  constructor() {
    super('��Ʈ�� ������ ������ ã�� �� �����ϴ�.');
  }
}

export class PartnerNotFoundError extends Error {
  constructor() {
    super('��Ʈ�� ������ ã�� �� �����ϴ�.');
  }
}

export class PartnerAccessDeniedError extends Error {
  constructor() {
    super('��Ʈ�� ������ ������ ������ �����ϴ�.');
  }
}

export interface ListPartnersParams {
  type?: PartnerTypeType;
  search?: string;
  cursor?: string;
  limit?: number;
  verified?: boolean;
  includeUnverified?: boolean;
  excludeOwnerId?: string;
}

export interface ListPartnersResult {
  items: PartnerSummary[];
  nextCursor: string | null;
}

const resolvePageSize = (limit?: number) => {
  if (!limit) {
    return DEFAULT_PAGE_SIZE;
  }

  return Math.max(1, Math.min(limit, MAX_PAGE_SIZE));
};

export const listPartners = async (params: ListPartnersParams = {}): Promise<ListPartnersResult> => {
  const { type, search, cursor, excludeOwnerId } = params;
  const take = resolvePageSize(params.limit);
  const where: PrismaTypes.PartnerWhereInput = {};

  if (type) {
    where.type = type;
  }

  if (excludeOwnerId) {
    where.userId = { not: excludeOwnerId };
  }

  if (params.includeUnverified) {
    if (typeof params.verified === 'boolean') {
      where.verified = params.verified;
    }
  } else {
    where.verified = typeof params.verified === 'boolean' ? params.verified : true;
  }

  if (search) {
    const term = search.trim();
    if (term) {
      where.OR = [
        { name: { contains: term, mode: 'insensitive' } },
        { description: { contains: term, mode: 'insensitive' } },
        { contactInfo: { contains: term, mode: 'insensitive' } },
        { location: { contains: term, mode: 'insensitive' } }
      ];
    }
  }

  const partners = await prisma.partner.findMany({
    where,
    include: {
      user: { select: { id: true, name: true, avatarUrl: true, role: true } },
      _count: { select: { matches: true } }
    },
    orderBy: { createdAt: 'desc' },
    take: take + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {})
  });

  const hasNext = partners.length > take;
  const pageItems = hasNext ? partners.slice(0, -1) : partners;

  return {
    items: pageItems.map(toPartnerSummary),
    nextCursor: hasNext ? pageItems[pageItems.length - 1]?.id ?? null : null
  };
};

export const getPartnersAwaitingApproval = async (limit = 5) => {
  const result = await listPartners({
    limit,
    verified: false,
    includeUnverified: true
  });

  return result.items;
};

export const getPartnerById = async (id: string): Promise<PartnerSummary | null> => {
  const partner = await prisma.partner.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, avatarUrl: true, role: true } },
      _count: { select: { matches: true } }
    }
  });

  if (!partner) {
    return null;
  }

  return toPartnerSummary(partner);
};

export const getPartnerProfileForUser = async (
  userId: string
): Promise<PartnerSummary | null> => {
  const partner = await prisma.partner.findUnique({
    where: { userId },
    include: {
      user: { select: { id: true, name: true, avatarUrl: true, role: true } },
      _count: { select: { matches: true } }
    }
  });

  if (!partner) {
    return null;
  }

  return toPartnerSummary(partner);
};

const buildCreateData = (
  input: CreatePartnerInput,
  ownerId: string
): PrismaTypes.PartnerCreateInput => {
  const description = sanitizeText(input.description);
  const services = sanitizeTags(input.services ?? null);
  const pricingModel = sanitizeText(input.pricingModel);
  const location = sanitizeText(input.location);
  const availability = sanitizeAvailability(input.availability);
  const portfolioUrl = sanitizeText(input.portfolioUrl);

  return {
    user: { connect: { id: ownerId } },
    type: input.type,
    name: input.name.trim(),
    contactInfo: input.contactInfo.trim(),
    ...(description ? { description } : {}),
    ...(services ? { services } : {}),
    ...(pricingModel ? { pricingModel } : {}),
    ...(location ? { location } : {}),
    ...(availability ? { availability } : {}),
    ...(portfolioUrl ? { portfolioUrl } : {}),
    verified: input.verified ?? false
  };
};

const buildUpdateData = (
  input: UpdatePartnerInput,
  sessionUser: SessionUser
): PrismaTypes.PartnerUpdateInput => {
  const data: PrismaTypes.PartnerUpdateInput = {};

  if (input.name !== undefined) {
    data.name = input.name.trim();
  }

  if (input.type !== undefined) {
    data.type = input.type;
  }

  if (input.description !== undefined) {
    const description = sanitizeText(input.description);
    data.description = description ?? null;
  }

  if (input.contactInfo !== undefined) {
    data.contactInfo = input.contactInfo.trim();
  }

  if (input.services !== undefined) {
    const services = sanitizeTags(input.services ?? null);
    data.services = services ?? [];
  }

  if (input.pricingModel !== undefined) {
    const pricingModel = sanitizeText(input.pricingModel);
    data.pricingModel = pricingModel ?? null;
  }

  if (input.location !== undefined) {
    const location = sanitizeText(input.location);
    data.location = location ?? null;
  }

  if (input.availability !== undefined) {
    const availability = sanitizeAvailability(input.availability);
    data.availability = availability ?? Prisma.JsonNull;
  }

  if (input.portfolioUrl !== undefined) {
    const portfolioUrl = sanitizeText(input.portfolioUrl);
    data.portfolioUrl = portfolioUrl ?? null;
  }

  if (input.rating !== undefined) {
    data.rating = input.rating;
  }

  if (input.verified !== undefined) {
    if (sessionUser.role !== UserRole.ADMIN) {
      throw new PartnerAccessDeniedError();
    }

    data.verified = input.verified;
  }

  return data;
};

export const createPartnerProfile = async (payload: unknown, sessionUser: SessionUser) => {
  const input = parseCreateInput(payload);
  const ownerId = sessionUser.role === UserRole.ADMIN && input.ownerId ? input.ownerId : sessionUser.id;

  const owner = await prisma.user.findUnique({
    where: { id: ownerId },
    select: { id: true, role: true }
  });

  if (!owner) {
    throw new PartnerOwnerNotFoundError();
  }

  const existingProfile = await prisma.partner.findUnique({ where: { userId: ownerId } });

  if (existingProfile) {
    throw new PartnerProfileExistsError();
  }

  const partner = await prisma.$transaction(async (tx: PrismaTypes.TransactionClient) => {
    const created = await tx.partner.create({ data: buildCreateData(input, ownerId) });

    if (owner.role !== UserRole.ADMIN && owner.role !== UserRole.PARTNER) {
      await tx.user.update({ where: { id: ownerId }, data: { role: UserRole.PARTNER } });
    }

    return created;
  });

  revalidatePartners();
  const created = await getPartnerById(partner.id);

  if (!created) {
    throw new PartnerNotFoundError();
  }

  return created;
};

export const updatePartnerProfile = async (
  id: string,
  payload: unknown,
  sessionUser: SessionUser
): Promise<PartnerSummary> => {
  const input = parseUpdateInput(payload);
  const partner = await prisma.partner.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, avatarUrl: true, role: true } },
      _count: { select: { matches: true } }
    }
  });

  if (!partner) {
    throw new PartnerNotFoundError();
  }

  if (sessionUser.role !== UserRole.ADMIN && partner.user.id !== sessionUser.id) {
    throw new PartnerAccessDeniedError();
  }

  const data = buildUpdateData(input, sessionUser);

  const updated = await prisma.partner.update({
    where: { id },
    data
  });

  revalidatePartners();
  const refreshed = await getPartnerById(updated.id);

  if (!refreshed) {
    throw new PartnerNotFoundError();
  }

  return refreshed;
};


