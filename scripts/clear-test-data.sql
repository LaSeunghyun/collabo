-- 테스트 데이터 삭제 SQL 스크립트
-- 외래키 제약조건을 고려하여 역순으로 삭제

-- 1. 가장 의존성이 많은 테이블부터 삭제
DELETE FROM "VisitLog";
DELETE FROM "AuditLog";
DELETE FROM "Notification";
DELETE FROM "TokenBlacklist";
DELETE FROM "RefreshToken";
DELETE FROM "AuthSession";
DELETE FROM "AuthDevice";
DELETE FROM "UserBlock";
DELETE FROM "ModerationReport";
DELETE FROM "CommentReaction";
DELETE FROM "UserFollow";
DELETE FROM "ProjectCollaborator";
DELETE FROM "ProjectRequirement";
DELETE FROM "ProjectRewardTier";
DELETE FROM "ProjectMilestone";
DELETE FROM "SettlementPayout";
DELETE FROM "Settlement";
DELETE FROM "PaymentTransaction";
DELETE FROM "Funding";
DELETE FROM "PartnerMatch";
DELETE FROM "Partner";
DELETE FROM "OrderItem";
DELETE FROM "Order";
DELETE FROM "Product";
DELETE FROM "Project";
DELETE FROM "PostDislike";
DELETE FROM "PostLike";
DELETE FROM "Comment";
DELETE FROM "Post";
DELETE FROM "Wallet";
DELETE FROM "UserPermission";
DELETE FROM "Permission";

-- 2. 마지막으로 사용자 삭제
DELETE FROM "User";

-- 시퀀스 리셋 (PostgreSQL의 경우)
-- ALTER SEQUENCE "User_id_seq" RESTART WITH 1;
-- ALTER SEQUENCE "Post_id_seq" RESTART WITH 1;
-- ALTER SEQUENCE "Comment_id_seq" RESTART WITH 1;
-- ALTER SEQUENCE "Project_id_seq" RESTART WITH 1;

-- 완료 메시지
SELECT '모든 테스트 데이터가 성공적으로 삭제되었습니다!' as message;

