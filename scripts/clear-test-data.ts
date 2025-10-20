import { getDb } from '../lib/db/client';
import { 
  post, 
  comment, 
  postLike, 
  postDislike, 
  user, 
  project, 
  funding, 
  order, 
  orderItem, 
  product, 
  partner, 
  partnerMatch, 
  settlement, 
  settlementPayout, 
  projectMilestone, 
  projectRewardTier, 
  projectRequirement, 
  projectCollaborator, 
  userFollow, 
  commentReaction, 
  moderationReport, 
  userBlock, 
  authSession, 
  authDevice, 
  refreshToken, 
  tokenBlacklist, 
  visitLog, 
  notification, 
  wallet, 
  auditLog, 
  userPermission, 
  permission, 
  paymentTransaction 
} from '../drizzle/schema';

async function clearTestData() {
  console.log('🧹 테스트 데이터 삭제를 시작합니다...');
  
  try {
    const db = await getDb();
    
    // 외래키 제약조건을 고려하여 역순으로 삭제
    console.log('📝 관련 테이블 데이터 삭제 중...');
    
    // 1. 가장 의존성이 많은 테이블부터 삭제
    await db.delete(visitLog);
    console.log('✅ VisitLog 삭제 완료');
    
    await db.delete(auditLog);
    console.log('✅ AuditLog 삭제 완료');
    
    await db.delete(notification);
    console.log('✅ Notification 삭제 완료');
    
    await db.delete(tokenBlacklist);
    console.log('✅ TokenBlacklist 삭제 완료');
    
    await db.delete(refreshToken);
    console.log('✅ RefreshToken 삭제 완료');
    
    await db.delete(authSession);
    console.log('✅ AuthSession 삭제 완료');
    
    await db.delete(authDevice);
    console.log('✅ AuthDevice 삭제 완료');
    
    await db.delete(userBlock);
    console.log('✅ UserBlock 삭제 완료');
    
    await db.delete(moderationReport);
    console.log('✅ ModerationReport 삭제 완료');
    
    await db.delete(commentReaction);
    console.log('✅ CommentReaction 삭제 완료');
    
    await db.delete(userFollow);
    console.log('✅ UserFollow 삭제 완료');
    
    await db.delete(projectCollaborator);
    console.log('✅ ProjectCollaborator 삭제 완료');
    
    await db.delete(projectRequirement);
    console.log('✅ ProjectRequirement 삭제 완료');
    
    await db.delete(projectRewardTier);
    console.log('✅ ProjectRewardTier 삭제 완료');
    
    await db.delete(projectMilestone);
    console.log('✅ ProjectMilestone 삭제 완료');
    
    await db.delete(settlementPayout);
    console.log('✅ SettlementPayout 삭제 완료');
    
    await db.delete(settlement);
    console.log('✅ Settlement 삭제 완료');
    
    await db.delete(paymentTransaction);
    console.log('✅ PaymentTransaction 삭제 완료');
    
    await db.delete(funding);
    console.log('✅ Funding 삭제 완료');
    
    await db.delete(partnerMatch);
    console.log('✅ PartnerMatch 삭제 완료');
    
    await db.delete(partner);
    console.log('✅ Partner 삭제 완료');
    
    await db.delete(orderItem);
    console.log('✅ OrderItem 삭제 완료');
    
    await db.delete(order);
    console.log('✅ Order 삭제 완료');
    
    await db.delete(product);
    console.log('✅ Product 삭제 완료');
    
    await db.delete(project);
    console.log('✅ Project 삭제 완료');
    
    await db.delete(postDislike);
    console.log('✅ PostDislike 삭제 완료');
    
    await db.delete(postLike);
    console.log('✅ PostLike 삭제 완료');
    
    await db.delete(comment);
    console.log('✅ Comment 삭제 완료');
    
    await db.delete(post);
    console.log('✅ Post 삭제 완료');
    
    await db.delete(wallet);
    console.log('✅ Wallet 삭제 완료');
    
    await db.delete(userPermission);
    console.log('✅ UserPermission 삭제 완료');
    
    await db.delete(permission);
    console.log('✅ Permission 삭제 완료');
    
    // 2. 마지막으로 사용자 삭제
    await db.delete(user);
    console.log('✅ User 삭제 완료');
    
    console.log('🎉 모든 테스트 데이터가 성공적으로 삭제되었습니다!');
    
  } catch (error) {
    console.error('❌ 데이터 삭제 중 오류가 발생했습니다:', error);
    throw error;
  }
}

// 스크립트 실행
if (require.main === module) {
  clearTestData()
    .then(() => {
      console.log('✅ 스크립트 실행 완료');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 스크립트 실행 실패:', error);
      process.exit(1);
    });
}

export { clearTestData };
