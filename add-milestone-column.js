const { PrismaClient } = require('@prisma/client');

async function addMilestoneColumn() {
  const prisma = new PrismaClient();
  
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // milestoneId 컬럼 추가
    try {
      await prisma.$executeRaw`ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "milestoneId" TEXT;`;
      console.log('✅ milestoneId column added');
    } catch (error) {
      console.log('⚠️ milestoneId column might already exist:', error.message);
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

addMilestoneColumn();
