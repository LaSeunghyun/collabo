import { NextResponse } from 'next/server';
import { sql } from 'drizzle-orm';

import { getDb, isDrizzleAvailable } from '@/lib/db/client';

export async function GET() {
  try {
    if (!(await isDrizzleAvailable())) {
      return NextResponse.json({
        success: false,
        message: 'Database client is disabled',
        error: 'DATABASE_URL is not configured',
        timestamp: new Date().toISOString()
      });
    }

    // 간단???�이?�베?�스 ?�결 ?�스??
    const db = await getDb();
    
    // execute 메서?��? ?�는지 ?�인
    if (typeof db.execute !== 'function') {
      return NextResponse.json({
        success: false,
        message: 'Database execute method is not available',
        error: 'Database is disabled in this environment',
        timestamp: new Date().toISOString()
      });
    }
    
    const result = await db.execute(sql`select 1 as test`);
    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      result: result
    });
  } catch (error) {
    console.error('Database connection failed:', error);
    
    // ?�이?�베?�스가 비활?�화??경우 graceful?�게 처리
    if (error instanceof Error && error.message.includes('Database access is disabled')) {
      return NextResponse.json({
        success: false,
        message: 'Database is disabled in this environment',
        error: 'DATABASE_URL is not configured for this environment',
        timestamp: new Date().toISOString()
      });
    }
    
    return NextResponse.json({ 
      success: false, 
      message: 'Database connection failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
