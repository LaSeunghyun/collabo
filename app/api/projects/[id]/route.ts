import { NextResponse } from 'next/server';

import { getProjectSummaryById } from '@/lib/services/projects';

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const project = await getProjectSummaryById(params.id);
    if (!project) {
      return NextResponse.json({ message: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json(project);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function PATCH() {
  return NextResponse.json({ message: 'Not implemented' }, { status: 501 });
}

export async function DELETE() {
  return NextResponse.json({ message: 'Not implemented' }, { status: 501 });
}
