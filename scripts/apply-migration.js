const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function applyMigration() {
  // 환경변수에서 데이터베이스 URL 가져오기
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('DATABASE_URL 환경변수가 설정되지 않았습니다.');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('데이터베이스에 연결 중...');
    
    // SQL 파일 읽기
    const sqlFile = path.join(__dirname, 'create-tables-only.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    console.log('마이그레이션 실행 중...');
    await pool.query(sql);
    
    console.log('✅ 마이그레이션이 성공적으로 적용되었습니다!');
    
    // 테이블 존재 확인
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('CommunityPostLike', 'CommunityPostDislike')
    `);
    
    console.log('생성된 테이블:', result.rows.map(row => row.table_name));
    
  } catch (error) {
    console.error('❌ 마이그레이션 실행 중 오류 발생:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

applyMigration();
