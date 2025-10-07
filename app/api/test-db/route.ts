import { NextResponse } from 'next/server';
import { getDbClient, isDrizzleAvailable } from '@/lib/db/client';

export async function GET() {
  try {
    console.log('?” Drizzle ?°ì´?°ë² ?´ìŠ¤ ?°ê²° ?ŒìŠ¤???œì‘...');
    console.log('DATABASE_URL:', process.env.DATABASE_URL ? '?¤ì •?? : '?¤ì •?˜ì? ?ŠìŒ');
    
    // Drizzle ?¬ìš© ê°€???¬ë? ?•ì¸
    const isAvailable = isDrizzleAvailable();
    console.log('??Drizzle ?¬ìš© ê°€??', isAvailable);
    
    if (!isAvailable) {
      return NextResponse.json({
        success: false,
        message: 'Drizzle??ë¹„í™œ?±í™”?˜ì–´ ?ˆìŠµ?ˆë‹¤.',
        available: false,
        databaseUrl: process.env.DATABASE_URL ? '?¤ì •?? : '?¤ì •?˜ì? ?ŠìŒ'
      });
    }
    
    // ?°ì´?°ë² ?´ìŠ¤ ?´ë¼?´ì–¸??ê°€?¸ì˜¤ê¸?
    const db = getDbClient();
    console.log('???°ì´?°ë² ?´ìŠ¤ ?´ë¼?´ì–¸???ì„± ?„ë£Œ');
    
    // ê°„ë‹¨??ì¿¼ë¦¬ ?ŒìŠ¤??
    const result = await db.execute('SELECT 1 as test');
    console.log('???°ì´?°ë² ?´ìŠ¤ ì¿¼ë¦¬ ?ŒìŠ¤???±ê³µ:', result);
    
    return NextResponse.json({
      success: true,
      message: 'Drizzle ?°ì´?°ë² ?´ìŠ¤ ?°ê²° ?ŒìŠ¤???±ê³µ!',
      available: true,
      testResult: result
    });
    
  } catch (error) {
    console.error('???°ì´?°ë² ?´ìŠ¤ ?°ê²° ?¤íŒ¨:', error);
    
    return NextResponse.json({
      success: false,
      message: '?°ì´?°ë² ?´ìŠ¤ ?°ê²° ?¤íŒ¨',
      error: error instanceof Error ? error.message : String(error),
      available: false
    }, { status: 500 });
  }
}
