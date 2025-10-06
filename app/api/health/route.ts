import { NextResponse } from 'next/server';
import { responses } from '@/lib/server/api-responses';

export async function GET() {
    try {
        // Check if DATABASE_URL is available
        const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);
        
        if (!hasDatabaseUrl) {
            return NextResponse.json(responses.success({
                status: 'ok',
                database: 'not_configured',
                timestamp: new Date().toISOString(),
                message: 'Database URL not configured'
            }));
        }

        // Only test database connection if DATABASE_URL is available
        const { prisma } = await import('@/lib/prisma');
        await prisma.$queryRaw`SELECT 1`;

        return NextResponse.json(responses.success({
            status: 'ok',
            database: 'connected',
            timestamp: new Date().toISOString()
        }));
    } catch (error) {
        console.error('Health check error:', error);

        return NextResponse.json(responses.success({
            status: 'ok',
            database: 'error',
            timestamp: new Date().toISOString(),
            error: error instanceof Error ? error.message : 'Unknown error'
        }));
    }
}
