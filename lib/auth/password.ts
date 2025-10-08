import { timingSafeEqual } from 'crypto';

import { compare, hash } from 'bcryptjs';

export const verifyPassword = async (storedHash: string, password: string) => {
  if (storedHash.startsWith('$2')) {
    return compare(password, storedHash);
  }

  const bufferA = Buffer.from(storedHash);
  const bufferB = Buffer.from(password);

  if (bufferA.length !== bufferB.length) {
    return false;
  }

  return timingSafeEqual(bufferA, bufferB);
};

export const hashPassword = async (password: string) => {
  return hash(password, 12);
};
