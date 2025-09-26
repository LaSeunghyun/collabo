import type { NextRequest } from 'next/server';
import type { PrismaClient } from '@prisma/client';

import prisma from '@/lib/prisma';

interface HandlerParams<P extends Record<string, string>> {
  request: NextRequest;
  params: P;
  prisma: PrismaClient;
}

type Handler<P extends Record<string, string>> = (
  context: HandlerParams<P>
) => Response | Promise<Response>;

export function withPrisma<P extends Record<string, string> = Record<string, string>>(
  handler: Handler<P>
) {
  return async (request: NextRequest, context?: { params: P }) =>
    handler({ request, params: context?.params ?? ({} as P), prisma });
}
