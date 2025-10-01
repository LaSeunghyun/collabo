import { createHash, randomBytes } from 'crypto';

import { hash as bcryptHash, compare as bcryptCompare } from 'bcryptjs';

const TOKEN_BYTE_LENGTH = 64;

export const createOpaqueToken = () =>
  randomBytes(TOKEN_BYTE_LENGTH).toString('base64url');

export const fingerprintToken = (token: string) =>
  createHash('sha256').update(token).digest('hex');

export const hashToken = async (token: string) => bcryptHash(token, 12);

export const verifyTokenHash = async (token: string, tokenHash: string) =>
  bcryptCompare(token, tokenHash);

export const hashClientHint = (value?: string | null) => {
  if (!value) {
    return null;
  }

  return createHash('sha256').update(value).digest('hex');
};
