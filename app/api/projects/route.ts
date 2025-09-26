import { NextResponse } from 'next/server';

import { listProjects } from '@/lib/services/projects';

export async function GET() {
  try {
    const projects = await listProjects();
    return NextResponse.json(projects);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function POST() {
  return NextResponse.json({ message: 'Not implemented' }, { status: 501 });
}
