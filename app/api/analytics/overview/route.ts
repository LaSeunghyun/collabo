import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

import { getAnalyticsOverview } from '@/lib/server/analytics';
import { requireApiUser } from '@/lib/auth/guards';
import { responses } from '@/lib/server/api-responses';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const authContext = { headers: headers() };
    const user = await requireApiUser({ roles: ['ADMIN'] }, authContext);

    if (user.role !== 'ADMIN') {
      return NextResponse.json(responses.forbidden(), { status: 403 });
    }

    const overview = await getAnalyticsOverview();
    return NextResponse.json(responses.success(overview));
  } catch (error) {
    console.error('Failed to load analytics overview', error);
    return NextResponse.json(responses.error('Unable to load analytics overview.'), { status: 500 });
  }
}
