const { PrismaClient } = require('@prisma/client');

async function testPostCreation() {
  const prisma = new PrismaClient();
  
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // 테스트 Post 생성
    const testPost = await prisma.post.create({
      data: {
        title: 'Test Post',
        content: 'This is a test post content',
        type: 'DISCUSSION',
        category: 'GENERAL',
        authorId: 'cmg35890a0003dqw6ffsxg3ma', // 실제 존재하는 관리자 ID
        visibility: 'PUBLIC',
        attachments: { files: [] }
      }
    });
    
    console.log('✅ Post created successfully:', testPost.id);
    
    // 생성된 Post 조회
    const posts = await prisma.post.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' }
    });
    
    console.log('📝 Recent posts:', posts.length);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Error code:', error.code);
  } finally {
    await prisma.$disconnect();
  }
}

testPostCreation();
