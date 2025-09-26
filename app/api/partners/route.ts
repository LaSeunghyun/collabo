import { NextRequest, NextResponse } from 'next/server';

import prisma from '@/lib/prisma';

function buildError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET() {
  const partners = await prisma.partner.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return NextResponse.json(partners);
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;

  try {
    body = await request.json();
  } catch {
    return buildError('요청 본문을 확인할 수 없습니다.');
  }

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const type = typeof body.type === 'string' ? body.type.trim() : '';
  const contactInfo = typeof body.contactInfo === 'string' ? body.contactInfo.trim() : '';
  const description = typeof body.description === 'string' ? body.description.trim() : undefined;

  if (!name || !type || !contactInfo) {
    return buildError('파트너 정보가 충분하지 않습니다.');
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
}
