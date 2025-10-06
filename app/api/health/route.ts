import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { responses } from '@/lib/server/api-responses';

export async function GET() {
    try {
        // Test database connection
        await prisma.$queryRaw`SELECT 1`;

        return NextResponse.json(responses.success({
            status: 'ok',
            database: 'connected',
            timestamp: new Date().toISOString()
        }));
    } catch (error) {
        console.error('Health check error:', error);

        return NextResponse.json(responses.error('Health check failed', 500), { status: 500 });
    }
}
