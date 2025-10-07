import { redirect } from 'next/navigation';
import { NextResponse } from 'next/server';

import {
  AuthorizationStatus,
  FORBIDDEN_ROUTE,
  type AuthorizationContext,
  type GuardRequirement,
  type SessionUser,
  evaluateAuthorization
} from './session';

export class AuthorizationError extends Error {
  status: number;

  constructor(message: string, status = 403) {
    super(message);
    this.name = 'AuthorizationError';
    this.status = status;
  }
}

interface RequireUserOptions extends GuardRequirement {
  redirectTo?: string;
}

export const requireUser = async (
  options: RequireUserOptions,
  context?: AuthorizationContext
): Promise<{ user: SessionUser }> => {
  const { status, user } = await evaluateAuthorization(options, context);

  if (status === AuthorizationStatus.AUTHORIZED && user) {
    return { user };
  }

  if (status === AuthorizationStatus.UNAUTHENTICATED) {
    const callbackTarget = options.redirectTo ?? '/';
    const signInUrl = `/api/auth/signin?callbackUrl=${encodeURIComponent(callbackTarget)}`;
    redirect(signInUrl);
  }

  redirect(FORBIDDEN_ROUTE);
};

export const requireApiUser = async (
  options: GuardRequirement,
  context?: AuthorizationContext
): Promise<SessionUser> => {
  const { status, user } = await evaluateAuthorization(options, context);

  if (status === AuthorizationStatus.AUTHORIZED && user) {
    return user;
  }

  if (status === AuthorizationStatus.UNAUTHENTICATED) {
    throw new AuthorizationError('?¸ì¦???„ìš”?©ë‹ˆ??', 401);
  }

  throw new AuthorizationError('?”ì²­???€??ê¶Œí•œ???†ìŠµ?ˆë‹¤.', 403);
};

export const handleAuthorizationError = (error: unknown) => {
  if (error instanceof AuthorizationError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  return null;
};
