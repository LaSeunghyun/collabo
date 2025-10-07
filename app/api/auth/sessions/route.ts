import { NextResponse, type NextRequest } from 'next/server';

import { verifyAccessToken } from '@/lib/auth/access-token';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const authorization = req.headers.get('authorization');

  if (!authorization?.startsWith('Bearer ')) {
    return NextResponse.json({ error: '?∏Ï¶ù ?†ÌÅ∞???ÑÏöî?©Îãà??' }, { status: 401 });
  }

  const token = authorization.slice(7).trim();

  if (!token) {
    return NextResponse.json({ error: '?∏Ï¶ù ?†ÌÅ∞???ÑÏöî?©Îãà??' }, { status: 401 });
  }

  try {
    const verified = await verifyAccessToken(token);

    const sessions = await prisma.authSession.findMany({
      where: {
        userId: verified.userId,
        revokedAt: null
      },
      include: {
        device: true
      },
      orderBy: {
        lastUsedAt: 'desc'
      }
    });

    return NextResponse.json({
      sessions: sessions.map((session) => ({
        id: session.id,
        createdAt: session.createdAt.toISOString(),
        lastUsedAt: session.lastUsedAt.toISOString(),
        absoluteExpiresAt: session.absoluteExpiresAt.toISOString(),
        remember: session.remember,
        client: session.client,
        ipHash: session.ipHash,
        uaHash: session.uaHash,
        isAdmin: session.isAdmin,
        device: session.device
          ? {
              id: session.device.id,
              label: session.device.label,
              firstSeenAt: session.device.firstSeenAt.toISOString(),
              lastSeenAt: session.device.lastSeenAt.toISOString()
            }
          : null,
        current: session.id === verified.sessionId
      }))
    });
  } catch (error) {
    console.error('?∏ÏÖò Ï°∞Ìöå ?§Ìå®', error);
    return NextResponse.json({ error: '?∏Ï¶ù ?†ÌÅ∞???†Ìö®?òÏ? ?äÏäµ?àÎã§.' }, { status: 401 });
  }
}
