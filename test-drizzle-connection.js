const { getDbClient, isDrizzleAvailable } = require('./lib/db/client.ts');

async function testConnection() {
  console.log('🔍 Drizzle 데이터베이스 연결 테스트 시작...');
  
  try {
    // Drizzle 사용 가능 여부 확인
    const isAvailable = isDrizzleAvailable();
    console.log('✅ Drizzle 사용 가능:', isAvailable);
    
    if (!isAvailable) {
      console.log('❌ Drizzle이 비활성화되어 있습니다.');
      return;
    }
    
    // 데이터베이스 클라이언트 가져오기
    const db = getDbClient();
    console.log('✅ 데이터베이스 클라이언트 생성 완료');
    
    // 간단한 쿼리 테스트
    const result = await db.execute('SELECT 1 as test');
    console.log('✅ 데이터베이스 쿼리 테스트 성공:', result);
    
    console.log('🎉 Drizzle 데이터베이스 연결 테스트 완료!');
    
  } catch (error) {
    console.error('❌ 데이터베이스 연결 실패:', error.message);
    console.error('상세 오류:', error);
  }
}

testConnection();
