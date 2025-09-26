import { NextResponse } from 'next/server';

import { jsonError } from '@/lib/api/responses';
import { withPrisma } from '@/lib/api/withPrisma';

export const GET = withPrisma(async ({ prisma }) => {
  const partners = await prisma.partner.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return NextResponse.json(partners);
});

export const POST = withPrisma(async ({ request, prisma }) => {
  let body: Record<string, unknown>;

  try {
    body = await request.json();
  } catch {
    return jsonError('요청 본문을 확인할 수 없습니다.');
  }

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const type = typeof body.type === 'string' ? body.type.trim() : '';
  const contactInfo = typeof body.contactInfo === 'string' ? body.contactInfo.trim() : '';
  const description = typeof body.description === 'string' ? body.description.trim() : undefined;

  if (!name || !type || !contactInfo) {
    return jsonError('파트너 정보가 충분하지 않습니다.');
  }

  const partner = await prisma.partner.create({
    data: {
      name,
      type,
      contactInfo,
      description: description ?? null
    }
  });

  return NextResponse.json(partner, { status: 201 });
});
