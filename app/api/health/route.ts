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

        // ?°ì´?°ë² ?´ìŠ¤ ?°ê²° ?ŒìŠ¤??
        const db = await getDb();
        
        // execute ë©”ì„œ?œê? ?ˆëŠ”ì§€ ?•ì¸
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

        // ?°ì´?°ë² ?´ìŠ¤ê°€ ë¹„í™œ?±í™”??ê²½ìš° degraded ?íƒœë¡?ë°˜í™˜
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
