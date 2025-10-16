import { serialize } from 'cookie';

export const REFRESH_COOKIE = '__Host-refresh_token';

export const buildRefreshCookie = (token: string, maxAgeSeconds: number) =>
  serialize(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    path: '/auth',
    maxAge: maxAgeSeconds
  });

export const buildRefreshCookieRemoval = () =>
  serialize(REFRESH_COOKIE, '', {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    path: '/auth',
    maxAge: 0
  });
