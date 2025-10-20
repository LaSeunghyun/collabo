const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres.tsdnwdwcwnqygyepojaq:V7mgCwC7zV4IciHn@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
});

async function clearTestData() {
  console.log('🧹 테스트 데이터 삭제를 시작합니다...');
  
  try {
    await client.connect();
    console.log('✅ 데이터베이스 연결 성공');
    
    // 외래키 제약조건을 고려하여 역순으로 삭제
    const deleteQueries = [
      'DELETE FROM "VisitLog"',
      'DELETE FROM "AuditLog"',
      'DELETE FROM "Notification"',
      'DELETE FROM "TokenBlacklist"',
      'DELETE FROM "RefreshToken"',
      'DELETE FROM "AuthSession"',
      'DELETE FROM "AuthDevice"',
      'DELETE FROM "UserBlock"',
      'DELETE FROM "ModerationReport"',
      'DELETE FROM "CommentReaction"',
      'DELETE FROM "UserFollow"',
      'DELETE FROM "ProjectCollaborator"',
      'DELETE FROM "ProjectRequirement"',
      'DELETE FROM "ProjectRewardTier"',
      'DELETE FROM "ProjectMilestone"',
      'DELETE FROM "SettlementPayout"',
      'DELETE FROM "Settlement"',
      'DELETE FROM "PaymentTransaction"',
      'DELETE FROM "Funding"',
      'DELETE FROM "PartnerMatch"',
      'DELETE FROM "Partner"',
      'DELETE FROM "OrderItem"',
      'DELETE FROM "Order"',
      'DELETE FROM "Product"',
      'DELETE FROM "Project"',
      'DELETE FROM "PostDislike"',
      'DELETE FROM "PostLike"',
      'DELETE FROM "Comment"',
      'DELETE FROM "Post"',
      'DELETE FROM "Wallet"',
      'DELETE FROM "UserPermission"',
      'DELETE FROM "Permission"',
      'DELETE FROM "User"'
    ];
    
    for (const query of deleteQueries) {
      const result = await client.query(query);
      const tableName = query.match(/FROM "([^"]+)"/)?.[1] || 'Unknown';
      console.log(`✅ ${tableName} 삭제 완료 (${result.rowCount}개 행)`);
    }
    
    console.log('🎉 모든 테스트 데이터가 성공적으로 삭제되었습니다!');
    
  } catch (error) {
    console.error('❌ 데이터 삭제 중 오류가 발생했습니다:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// 스크립트 실행
clearTestData()
  .then(() => {
    console.log('✅ 스크립트 실행 완료');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 스크립트 실행 실패:', error);
    process.exit(1);
  });

