const { PrismaClient } = require('@prisma/client');

async function checkUsers() {
  const prisma = new PrismaClient();
  
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // 사용자 목록 확인
    const users = await prisma.user.findMany({
      take: 5,
      select: { id: true, name: true, email: true }
    });
    
    console.log('👥 Available users:');
    users.forEach(user => {
      console.log(`  - ${user.id}: ${user.name} (${user.email})`);
    });
    
    if (users.length === 0) {
      console.log('❌ No users found in database');
    } else {
      console.log(`✅ Found ${users.length} users`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
