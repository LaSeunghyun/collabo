import {
  boolean,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

import {
  communityCategoryEnum,
  fundingStatusEnum,
  milestoneStatusEnum,
  moderationStatusEnum,
  moderationTargetTypeEnum,
  notificationTypeEnum,
  orderStatusEnum,
  partnerMatchStatusEnum,
  partnerTypeEnum,
  paymentProviderEnum,
  postTypeEnum,
  productTypeEnum,
  projectStatusEnum,
  settlementPayoutStatusEnum,
  settlementStakeholderTypeEnum,
  userRoleEnum,
} from './enums';

export const users = pgTable(
  'User',
  {
    id: text('id').notNull().primaryKey(),
    name: text('name').notNull(),
    email: text('email').notNull(),
    role: userRoleEnum('role').notNull().default('PARTICIPANT'),
    passwordHash: text('passwordHash'),
    avatarUrl: text('avatarUrl'),
    language: text('language').notNull().default('ko'),
    timezone: text('timezone'),
    bio: text('bio'),
    socialLinks: jsonb('socialLinks'),
    createdAt: timestamp('createdAt', { mode: 'string' }).notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', { mode: 'string' }).notNull(),
  },
  (table) => ({
    emailUnique: uniqueIndex('User_email_key').on(table.email),
  }),
);

export const projects = pgTable(
  'Project',
  {
    id: text('id').notNull().primaryKey(),
    title: text('title').notNull(),
    description: text('description').notNull(),
    category: text('category').notNull(),
    targetAmount: integer('targetAmount').notNull(),
    currentAmount: integer('currentAmount').notNull().default(0),
    currency: text('currency').notNull().default('KRW'),
    status: projectStatusEnum('status').notNull().default('DRAFT'),
    startDate: timestamp('startDate', { mode: 'string' }),
    endDate: timestamp('endDate', { mode: 'string' }),
    rewardTiers: jsonb('rewardTiers'),
    milestones: jsonb('milestones'),
    thumbnail: text('thumbnail'),
    metadata: jsonb('metadata'),
    ownerId: text('ownerId')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    createdAt: timestamp('createdAt', { mode: 'string' }).notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', { mode: 'string' }).notNull(),
  },
);

export const visitLogs = pgTable(
  'VisitLog',
  {
    id: text('id').notNull().primaryKey(),
    sessionId: text('sessionId').notNull(),
    userId: text('userId').references(() => users.id, {
      onDelete: 'set null',
      onUpdate: 'cascade',
    }),
    path: text('path'),
    userAgent: text('userAgent'),
    ipHash: text('ipHash'),
    occurredAt: timestamp('occurredAt', { mode: 'string' }).notNull().defaultNow(),
  },
  (table) => ({
    occurredAtIdx: index('VisitLog_occurredAt_idx').on(table.occurredAt),
    sessionIdIdx: index('VisitLog_sessionId_idx').on(table.sessionId),
    userIdIdx: index('VisitLog_userId_idx').on(table.userId),
  }),
);
