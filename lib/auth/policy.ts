import { UserRole, type UserRoleValue } from '@/types/prisma';

export type ClientKind = 'web' | 'mobile';

export interface SessionPolicy {
  accessTokenTtl: number;
  refreshSlidingTtl: number;
  refreshAbsoluteTtl: number;
}

const MINUTE = 60;
const DAY = 60 * 60 * 24;

const WEB_POLICY: SessionPolicy = {
  accessTokenTtl: 15 * MINUTE,
  refreshSlidingTtl: 14 * DAY,
  refreshAbsoluteTtl: 60 * DAY
};

const WEB_REMEMBER_POLICY: SessionPolicy = {
  accessTokenTtl: 15 * MINUTE,
  refreshSlidingTtl: 30 * DAY,
  refreshAbsoluteTtl: 90 * DAY
};

const MOBILE_POLICY: SessionPolicy = {
  accessTokenTtl: 15 * MINUTE,
  refreshSlidingTtl: 30 * DAY,
  refreshAbsoluteTtl: 180 * DAY
};

const ADMIN_POLICY: SessionPolicy = {
  accessTokenTtl: 10 * MINUTE,
  refreshSlidingTtl: 7 * DAY,
  refreshAbsoluteTtl: 30 * DAY
};

export interface ResolvePolicyParams {
  role: UserRoleValue;
  remember: boolean;
  client: ClientKind;
}

export const resolveSessionPolicy = ({
  role,
  remember,
  client
}: ResolvePolicyParams): SessionPolicy => {
  if (role === UserRole.ADMIN) {
    return ADMIN_POLICY;
  }

  if (client === 'mobile') {
    return MOBILE_POLICY;
  }

  return remember ? WEB_REMEMBER_POLICY : WEB_POLICY;
};
