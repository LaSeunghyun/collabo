import { NextResponse } from 'next/server';
import { getDbClient, isDrizzleAvailable } from '@/lib/db/client';

export async function GET() {
  try {
    console.log('?�� Drizzle ?�이?�베?�스 ?�결 ?�스???�작...');
    console.log('DATABASE_URL:', process.env.DATABASE_URL ? '?�정?? : '?�정?��? ?�음');
    
    // Drizzle ?�용 가???��? ?�인
    const isAvailable = isDrizzleAvailable();
    console.log('??Drizzle ?�용 가??', isAvailable);
    
    if (!isAvailable) {
      return NextResponse.json({
        success: false,
        message: 'Drizzle??비활?�화?�어 ?�습?�다.',
        available: false,
        databaseUrl: process.env.DATABASE_URL ? '?�정?? : '?�정?��? ?�음'
      });
    }
    
    // ?�이?�베?�스 ?�라?�언??가?�오�?
    const db = getDbClient();
    console.log('???�이?�베?�스 ?�라?�언???�성 ?�료');
    
    // 간단??쿼리 ?�스??
    const result = await db.execute('SELECT 1 as test');
    console.log('???�이?�베?�스 쿼리 ?�스???�공:', result);
    
    return NextResponse.json({
      success: true,
      message: 'Drizzle ?�이?�베?�스 ?�결 ?�스???�공!',
      available: true,
      testResult: result
    });
    
  } catch (error) {
    console.error('???�이?�베?�스 ?�결 ?�패:', error);
    
    return NextResponse.json({
      success: false,
      message: '?�이?�베?�스 ?�결 ?�패',
      error: error instanceof Error ? error.message : String(error),
      available: false
    }, { status: 500 });
  }
}
