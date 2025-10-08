// 데이터베이스 연결 및 사용자 확인 테스트
const { db } = require('./lib/db/client');
const { users } = require('./lib/db/schema');
const { eq } = require('drizzle-orm');

const testDatabaseConnection = async () => {
  try {
    console.log('데이터베이스 연결 테스트 시작...');
    
    // 사용자 목록 조회
    const userList = await db.select().from(users).limit(5);
    console.log('✅ 데이터베이스 연결 성공!');
    console.log('사용자 목록:', userList);
    
    if (userList.length > 0) {
      console.log('✅ 사용자가 존재합니다. 게시글 작성 테스트 가능');
    } else {
      console.log('⚠️ 사용자가 없습니다. 먼저 사용자를 생성해야 합니다.');
    }
    
  } catch (error) {
    console.error('❌ 데이터베이스 연결 실패:', error);
  }
};

testDatabaseConnection();
