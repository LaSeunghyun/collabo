import { NextResponse } from 'next/server';
import { sql } from 'drizzle-orm';

import { getDb, isDrizzleAvailable } from '@/lib/db/client';

export async function GET() {
    try {
        if (!isDrizzleAvailable()) {
            return NextResponse.json({
                status: 'degraded',
                database: 'disabled',
                message: 'Database client is not available',
                timestamp: new Date().toISOString()
            });
        }

        // 데이터베이스 연결 테스트
        const db = await getDb();
        
        // execute 메서드가 있는지 확인
        if (typeof db.execute !== 'function') {
            return NextResponse.json({
                status: 'degraded',
                database: 'disabled',
                message: 'Database execute method is not available',
                timestamp: new Date().toISOString()
            });
        }
        
        await db.execute(sql`select 1`);

        return NextResponse.json({
            status: 'ok',
            database: 'connected',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Health check error:', error);

        // 데이터베이스가 비활성화된 경우 degraded 상태로 반환
        if (error instanceof Error && error.message.includes('Database access is disabled')) {
            return NextResponse.json({
                status: 'degraded',
                database: 'disabled',
                message: 'Database is disabled in this environment',
                timestamp: new Date().toISOString()
            });
        }

        return NextResponse.json({
            status: 'error',
            database: 'disconnected',
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
        }, { status: 500 });
    }
}
