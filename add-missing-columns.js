const { PrismaClient } = require('@prisma/client');

async function addMissingColumns() {
  const prisma = new PrismaClient();
  
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // attachments 컬럼 추가
    try {
      await prisma.$executeRaw`ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "attachments" JSONB;`;
      console.log('✅ attachments column added');
    } catch (error) {
      console.log('⚠️ attachments column might already exist:', error.message);
    }
    
    // visibility 컬럼이 제대로 설정되어 있는지 확인
    try {
      await prisma.$executeRaw`ALTER TABLE "Post" ALTER COLUMN "visibility" TYPE VARCHAR(50);`;
      console.log('✅ visibility column type updated');
    } catch (error) {
      console.log('⚠️ visibility column update failed:', error.message);
    }
    
    // Post 테이블 구조 다시 확인
    const columns = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'Post' AND table_schema = 'public'
      ORDER BY ordinal_position;
    `;
    
    console.log('📝 Updated Post table columns:');
    columns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

addMissingColumns();
