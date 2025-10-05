const { PrismaClient } = require('@prisma/client');

async function testConnection() {
  const prisma = new PrismaClient();
  
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // 테이블 목록 확인
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;
    console.log('📋 Available tables:', tables);
    
    // Post 테이블 구조 확인
    const postColumns = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'Post' AND table_schema = 'public'
      ORDER BY ordinal_position;
    `;
    console.log('📝 Post table columns:', postColumns);
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
