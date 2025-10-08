import { revalidatePath } from 'next/cache';
import { eq, and, or, like, desc, count, inArray, not } from 'drizzle-orm';
import { ZodError } from 'zod';

import type { SessionUser } from '@/lib/auth/session';
import { getDb } from '@/lib/db/client';
import { partners, users, partnerMatches } from '@/lib/db/schema';

export interface PartnerSummary {
  id: string;
  name: string;
  description: string | null;
  type: string;
  contactInfo: string;
  location: string | null;
  portfolioUrl: string | null;
  verified: boolean;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string | null;
    avatarUrl: string | null;
  };
  matchCount: number;
}
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
): any | null => {
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

        const payload: any = note
          ? { day, start, end, note }
          : { day, start, end };

        return payload;
      })
      .filter((slot): slot is any => Boolean(slot))
    : [];

  if (!timezone && slots.length === 0) {
    return null;
  }

  const payload: any = {
    ...(timezone ? { timezone } : {}),
    ...(slots.length ? { slots } : {})
  };

  return payload;
};

type PartnerWithRelations = {
  id: string;
  name: string;
  type: string;
  verified: boolean;
  description: string | null;
  location: string | null;
  portfolioUrl: string | null;
  contactInfo: string;
  user: {
    id: string;
    name: string | null;
    avatarUrl: string | null;
    role: string;
  };
  _count: {
    matches: number;
  };
  createdAt: string;
  updatedAt: string;
};

// PartnerSummary 타입은 @/types/prisma에서 import합니다

const toPartnerSummary = (partner: PartnerWithRelations): PartnerSummary => {
  // const services = Array.isArray(partner.services)
  //   ? partner.services.filter((item: unknown): item is string => typeof item === 'string')
  //   : [];

  // const availability = (partner.availability ?? null) as any | null;

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
    super('파트너 정보가 유효하지 않습니다.');
    this.issues = error.issues.map((issue) => issue.message);
  }
}

export class PartnerProfileExistsError extends Error {
  constructor() {
    super('이미 등록된 파트너 프로필이 있습니다.');
  }
}

export class PartnerOwnerNotFoundError extends Error {
  constructor() {
    super('파트너 소유자 정보를 찾을 수 없습니다.');
  }
}

export class PartnerNotFoundError extends Error {
  constructor() {
    super('파트너 정보를 찾을 수 없습니다.');
  }
}

export class PartnerAccessDeniedError extends Error {
  constructor() {
    super('파트너 정보를 수정할 권한이 없습니다.');
  }
}

export interface ListPartnersParams {
  type?: string;
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

  // Apply filters
  const conditions = [];

  if (type) {
    conditions.push(eq(partners.type, type as any));
  }

  if (excludeOwnerId) {
    conditions.push(not(eq(partners.userId, excludeOwnerId)));
  }

  if (params.includeUnverified) {
    if (typeof params.verified === 'boolean') {
      conditions.push(eq(partners.verified, params.verified));
    }
  } else {
    const verifiedValue = typeof params.verified === 'boolean' ? params.verified : true;
    conditions.push(eq(partners.verified, verifiedValue));
  }

  if (search) {
    const term = search.trim();
    if (term) {
      conditions.push(or(
        like(partners.name, `%${term}%`),
        like(partners.description, `%${term}%`),
        like(partners.contactInfo, `%${term}%`),
        like(partners.location, `%${term}%`)
      ));
    }
  }

  if (cursor) {
    conditions.push(eq(partners.id, cursor));
  }

  const db = await getDb();
  const query = db
    .select({
      id: partners.id,
      name: partners.name,
      type: partners.type,
      verified: partners.verified,
      description: partners.description,
      location: partners.location,
      portfolioUrl: partners.portfolioUrl,
      contactInfo: partners.contactInfo,
      createdAt: partners.createdAt,
      updatedAt: partners.updatedAt,
      user: {
        id: users.id,
        name: users.name,
        avatarUrl: users.avatarUrl,
        role: users.role
      }
    })
    .from(partners)
    .innerJoin(users, eq(partners.userId, users.id))
    .orderBy(desc(partners.createdAt))
    .limit(take + 1);

  const finalQuery = query.where(conditions.length > 0 ? and(...conditions) : undefined as any);

  const partnersData = await finalQuery;

  // Get match counts for each partner
  const partnerIds = partnersData.map(p => p.id);
  const matchCounts = partnerIds.length > 0 
    ? await db
        .select({
          partnerId: partnerMatches.partnerId,
          count: count()
        })
        .from(partnerMatches)
        .where(inArray(partnerMatches.partnerId, partnerIds))
        .groupBy(partnerMatches.partnerId)
    : [];

  const matchCountMap = new Map(
    matchCounts.map(mc => [mc.partnerId, mc.count])
  );

  const partnersWithCounts = partnersData.map(partner => ({
    ...partner,
    _count: {
      matches: matchCountMap.get(partner.id) || 0
    }
  }));

  const hasNext = partnersWithCounts.length > take;
  const pageItems = hasNext ? partnersWithCounts.slice(0, -1) : partnersWithCounts;

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
  const partnerData = await db
    .select({
      id: partners.id,
      name: partners.name,
      type: partners.type,
      verified: partners.verified,
      description: partners.description,
      location: partners.location,
      portfolioUrl: partners.portfolioUrl,
      contactInfo: partners.contactInfo,
      createdAt: partners.createdAt,
      updatedAt: partners.updatedAt,
      user: {
        id: users.id,
        name: users.name,
        avatarUrl: users.avatarUrl,
        role: users.role
      }
    })
    .from(partners)
    .innerJoin(users, eq(partners.userId, users.id))
    .where(eq(partners.id, id))
    .limit(1);

  if (partnerData.length === 0) {
    return null;
  }

  const partner = partnerData[0];

  // Get match count
  const matchCountResult = await db
    .select({ count: count() })
    .from(partnerMatches)
    .where(eq(partnerMatches.partnerId, id));

  const partnerWithCount = {
    ...partner,
    _count: {
      matches: matchCountResult[0]?.count || 0
    }
  };

  return toPartnerSummary(partnerWithCount);
};

export const getPartnerProfileForUser = async (
  userId: string
): Promise<PartnerSummary | null> => {
  const partnerData = await db
    .select({
      id: partners.id,
      name: partners.name,
      type: partners.type,
      verified: partners.verified,
      description: partners.description,
      location: partners.location,
      portfolioUrl: partners.portfolioUrl,
      contactInfo: partners.contactInfo,
      createdAt: partners.createdAt,
      updatedAt: partners.updatedAt,
      user: {
        id: users.id,
        name: users.name,
        avatarUrl: users.avatarUrl,
        role: users.role
      }
    })
    .from(partners)
    .innerJoin(users, eq(partners.userId, users.id))
    .where(eq(partners.userId, userId))
    .limit(1);

  if (partnerData.length === 0) {
    return null;
  }

  const partner = partnerData[0];

  // Get match count
  const matchCountResult = await db
    .select({ count: count() })
    .from(partnerMatches)
    .where(eq(partnerMatches.partnerId, partner.id));

  const partnerWithCount = {
    ...partner,
    _count: {
      matches: matchCountResult[0]?.count || 0
    }
  };

  return toPartnerSummary(partnerWithCount);
};

const buildCreateData = (
  input: CreatePartnerInput,
  ownerId: string
): any => {
  const description = sanitizeText(input.description);
  const services = sanitizeTags(input.services ?? null);
  const pricingModel = sanitizeText(input.pricingModel);
  const location = sanitizeText(input.location);
  const availability = sanitizeAvailability(input.availability);
  const portfolioUrl = sanitizeText(input.portfolioUrl);

  return {
    id: crypto.randomUUID(),
    userId: ownerId,
    type: input.type,
    name: input.name.trim(),
    contactInfo: input.contactInfo.trim(),
    ...(description ? { description } : {}),
    ...(services ? { services } : {}),
    ...(pricingModel ? { pricingModel } : {}),
    ...(location ? { location } : {}),
    ...(availability ? { availability } : {}),
    ...(portfolioUrl ? { portfolioUrl } : {}),
    verified: input.verified ?? false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
};

const buildUpdateData = (
  input: UpdatePartnerInput,
  sessionUser: SessionUser
): any => {
  const data: any = {};

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
    data.availability = availability ?? null;
  }

  if (input.portfolioUrl !== undefined) {
    const portfolioUrl = sanitizeText(input.portfolioUrl);
    data.portfolioUrl = portfolioUrl ?? null;
  }

  if (input.rating !== undefined) {
    data.rating = input.rating;
  }

  if (input.verified !== undefined) {
    if (sessionUser.role !== 'ADMIN') {
      throw new PartnerAccessDeniedError();
    }

    data.verified = input.verified;
  }

  return data;
};

export const createPartnerProfile = async (payload: unknown, sessionUser: SessionUser) => {
  const input = parseCreateInput(payload);
  const ownerId = sessionUser.role === 'ADMIN' && input.ownerId ? input.ownerId : sessionUser.id;

  const ownerData = await db
    .select({ id: users.id, role: users.role })
    .from(users)
    .where(eq(users.id, ownerId))
    .limit(1);

  if (ownerData.length === 0) {
    throw new PartnerOwnerNotFoundError();
  }

  const owner = ownerData[0];

  const existingProfileData = await db
    .select({ id: partners.id })
    .from(partners)
    .where(eq(partners.userId, ownerId))
    .limit(1);

  if (existingProfileData.length > 0) {
    throw new PartnerProfileExistsError();
  }

  const db = await getDb();
  const partner = await db.transaction(async (tx) => {
    const createData = buildCreateData(input, ownerId);
    const created = await tx.insert(partners).values(createData).returning();

    if (owner.role !== 'ADMIN' && owner.role !== 'PARTNER') {
      await tx.update(users)
        .set({ role: 'PARTNER' })
        .where(eq(users.id, ownerId));
    }

    return created[0];
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
  
  const partnerData = await db
    .select({
      id: partners.id,
      userId: partners.userId,
      user: {
        id: users.id,
        name: users.name,
        avatarUrl: users.avatarUrl,
        role: users.role
      }
    })
    .from(partners)
    .innerJoin(users, eq(partners.userId, users.id))
    .where(eq(partners.id, id))
    .limit(1);

  if (partnerData.length === 0) {
    throw new PartnerNotFoundError();
  }

  const partner = partnerData[0];

  if (sessionUser.role !== 'ADMIN' && partner.user.id !== sessionUser.id) {
    throw new PartnerAccessDeniedError();
  }

  const data = buildUpdateData(input, sessionUser);

  if (Object.keys(data).length === 0) {
    const result = await getPartnerById(id);
    if (!result) {
      throw new PartnerNotFoundError();
    }
    return result;
  }

  const db = await getDb();
  await db.update(partners)
    .set({
      ...data,
      updatedAt: new Date().toISOString()
    })
    .where(eq(partners.id, id));

  revalidatePartners();
  const refreshed = await getPartnerById(id);

  if (!refreshed) {
    throw new PartnerNotFoundError();
  }

  return refreshed;
};



