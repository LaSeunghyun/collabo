import { NextRequest, NextResponse } from 'next/server';
import { UserRole } from '@/types/shared';

import { handleAuthorizationError, requireApiUser } from '@/lib/auth/guards';
import { createProject, ProjectValidationError } from '@/lib/server/projects';

export async function GET() {
  try {
    // ê°„ë‹¨??ê¸°ë³¸ ?‘ë‹µ?¼ë¡œ ?œì‘
    return NextResponse.json([]);
  } catch (error) {
    console.error('Failed to load projects', error);

    // ?ì„¸???ëŸ¬ ?•ë³´ ?œê³µ
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;

    return NextResponse.json({
      message: 'Failed to load projects',
      error: errorMessage,
      ...(process.env.NODE_ENV === 'development' && { stack: errorStack })
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  let user;
  const authContext = { headers: request.headers };

  try {
    user = await requireApiUser(authContext as any);
  } catch (error) {
    return handleAuthorizationError(error);
  }

  if (user.role !== UserRole.CREATOR && user.role !== UserRole.ADMIN) {
    return NextResponse.json(
      { error: '?„ë¡œ?íŠ¸ ?ì„± ê¶Œí•œ???†ìŠµ?ˆë‹¤.' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const project = await createProject(body, user.id);

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error('?„ë¡œ?íŠ¸ ?ì„± ?¤íŒ¨:', error);

    if (error instanceof ProjectValidationError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: '?„ë¡œ?íŠ¸ ?ì„±???¤íŒ¨?ˆìŠµ?ˆë‹¤.' },
      { status: 500 }
    );
  }
}
