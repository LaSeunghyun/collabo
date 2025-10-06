import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Check if DATABASE_URL is available
    const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);
    
    if (!hasDatabaseUrl) {
      return NextResponse.json({ 
        success: false, 
        message: 'Database URL not configured',
        error: 'DATABASE_URL environment variable is not set'
      });
    }

    // Only test database connection if DATABASE_URL is available
    const { prisma } = await import('@/lib/prisma');
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    
    return NextResponse.json({ 
      success: true, 
      message: 'Database connection successful',
      result 
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
