import { NextRequest, NextResponse } from 'next/server';

import { getProjectSummaries } from '@/lib/server/projects';

export async function GET() {
  try {
    const projects = await getProjectSummaries();
    return NextResponse.json(projects);
  } catch (error) {
    console.error('Failed to load projects', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  return NextResponse.json(body, { status: 201 });
}
