import { timingSafeEqual } from 'crypto';

import { compare } from 'bcryptjs';

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
