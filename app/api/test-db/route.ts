import { NextResponse } from 'next/server';
import { sql } from 'drizzle-orm';

import { getDb, isDrizzleAvailable } from '@/lib/db/client';

export async function GET() {
  try {
    if (!isDrizzleAvailable()) {
      return NextResponse.json({
        success: false,
        message: 'Database client is disabled',
        error: 'DATABASE_URL is not configured',
        timestamp: new Date().toISOString()
      });
    }

    // 간단한 데이터베이스 연결 테스트
    const db = await getDb();
    
    // execute 메서드가 있는지 확인
    if (typeof db.execute !== 'function') {
      throw new Error('Database execute method is not available');
    }
    
    const result = await db.execute(sql`select 1 as test`);
    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      result: result
    });
  } catch (error) {
    console.error('Database connection failed:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Database connection failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
