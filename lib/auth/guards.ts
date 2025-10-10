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
    throw new AuthorizationError('인증이 필요합니다', 401);
  }

  throw new AuthorizationError('요청에 대한 권한이 없습니다.', 403);
};

export const handleAuthorizationError = (error: unknown) => {
  if (error instanceof AuthorizationError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  return null;
};