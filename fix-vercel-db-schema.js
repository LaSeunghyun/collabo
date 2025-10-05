const { PrismaClient } = require('@prisma/client');

async function fixVercelDbSchema() {
  const prisma = new PrismaClient();
  
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // 1. PostVisibility enum 제거 (만약 존재한다면)
    try {
      await prisma.$executeRaw`DROP TYPE IF EXISTS "PostVisibility" CASCADE;`;
      console.log('✅ PostVisibility enum removed');
    } catch (error) {
      console.log('⚠️ PostVisibility enum removal:', error.message);
    }
    
    // 2. VisitLog 테이블에 userAgent 컬럼 추가
    try {
      await prisma.$executeRaw`ALTER TABLE "VisitLog" ADD COLUMN IF NOT EXISTS "userAgent" TEXT;`;
      console.log('✅ VisitLog.userAgent column added');
    } catch (error) {
      console.log('⚠️ VisitLog.userAgent column:', error.message);
    }
    
    // 3. Post 테이블의 visibility 컬럼이 올바른 타입인지 확인
    try {
      await prisma.$executeRaw`ALTER TABLE "Post" ALTER COLUMN "visibility" TYPE TEXT;`;
      console.log('✅ Post.visibility column type updated to TEXT');
    } catch (error) {
      console.log('⚠️ Post.visibility column:', error.message);
    }
    
    // 4. 현재 테이블 구조 확인
    const postColumns = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'Post' AND table_schema = 'public'
      ORDER BY ordinal_position;
    `;
    
    console.log('📝 Post table columns:');
    postColumns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    const visitLogColumns = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'VisitLog' AND table_schema = 'public'
      ORDER BY ordinal_position;
    `;
    
    console.log('📝 VisitLog table columns:');
    visitLogColumns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixVercelDbSchema();
