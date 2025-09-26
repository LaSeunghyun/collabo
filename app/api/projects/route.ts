import { NextRequest, NextResponse } from 'next/server';

import { demoProjects } from '@/lib/data/projects';

export async function GET() {
  return NextResponse.json(demoProjects);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const project = { ...body, id: crypto.randomUUID() };
  return NextResponse.json(project, { status: 201 });
}
