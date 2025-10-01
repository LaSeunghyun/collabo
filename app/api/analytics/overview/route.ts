import { NextResponse } from 'next/server';

import { getAnalyticsOverview } from '@/lib/server/analytics';
import { requireApiUser } from '@/lib/auth/guards';
import { UserRole } from '@/types/prisma';

export async function GET() {
  try {
    const user = await requireApiUser({ roles: [UserRole.ADMIN] });

    if (user.role !== UserRole.ADMIN) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const overview = await getAnalyticsOverview();
    return NextResponse.json(overview);
  } catch (error) {
    console.error('Failed to load analytics overview', error);
    return NextResponse.json({ message: 'Unable to load analytics overview.' }, { status: 500 });
  }
}

