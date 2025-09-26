import { NextRequest, NextResponse } from 'next/server';

const partners = [
  {
    id: 'studio-1',
    name: 'Studio Aurora',
    type: 'studio',
    contactInfo: 'hello@aurora.studio',
    status: 'approved'
  },
  {
    id: 'venue-1',
    name: 'Wonder Hall',
    type: 'venue',
    contactInfo: 'booking@wonderhall.kr',
    status: 'review'
  }
];

export async function GET() {
  return NextResponse.json(partners);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  return NextResponse.json({ ...body, id: crypto.randomUUID(), status: 'review' }, { status: 201 });
}
