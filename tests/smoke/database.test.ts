import { getDb } from '@/lib/db/client';
import { sql } from 'drizzle-orm';

describe('Database Schema Smoke Tests', () => {
  let db: Awaited<ReturnType<typeof getDb>>;

  beforeAll(async () => {
    db = await getDb();
  });

  describe('Required Tables', () => {
    it('should have all required tables', async () => {
      const result = await db.execute(sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name
      `);

      const tableNames = result.map((row: any) => row.table_name);
      
      const requiredTables = [
        'Announcement',
        'AnnouncementRead',
        'AuthDevice',
        'AuthSession',
        'Comment',
        'CommentReaction',
        'Funding',
        'ModerationReport',
        'Notification',
        'Order',
        'OrderItem',
        'Partner',
        'PartnerMatch',
        'PaymentTransaction',
        'Permission',
        'Post',
        'PostDislike',
        'PostLike',
        'Project',
        'ProjectCollaborator',
        'ProjectMilestone',
        'ProjectRequirement',
        'ProjectRewardTier',
        'RefreshToken',
        'Settlement',
        'SettlementPayout',
        'TokenBlacklist',
        'User',
        'UserBlock',
        'UserFollow',
        'UserPermission',
        'VisitLog',
        'Wallet'
      ];

      for (const tableName of requiredTables) {
        expect(tableNames).toContain(tableName);
      }
    });

    it('should have Post table with status column', async () => {
      const result = await db.execute(sql`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'Post' AND table_schema = 'public'
        ORDER BY ordinal_position
      `);

      const columns = result.map((row: any) => row.column_name);
      
      expect(columns).toContain('status');
      
      // status 컬럼의 타입 확인
      const statusColumn = result.find((row: any) => row.column_name === 'status');
      expect(statusColumn?.data_type).toBe('USER-DEFINED'); // ENUM type
      expect(statusColumn?.is_nullable).toBe('NO');
      expect(statusColumn?.column_default).toBe('DRAFT');
    });

    it('should have Announcement table with all required columns', async () => {
      const result = await db.execute(sql`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'Announcement' AND table_schema = 'public'
        ORDER BY ordinal_position
      `);

      const columns = result.map((row: any) => row.column_name);
      
      const requiredColumns = [
        'id',
        'title',
        'content',
        'category',
        'isPinned',
        'publishedAt',
        'authorId',
        'createdAt',
        'updatedAt'
      ];

      for (const columnName of requiredColumns) {
        expect(columns).toContain(columnName);
      }
    });

    it('should have AnnouncementRead table with foreign keys', async () => {
      const result = await db.execute(sql`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'AnnouncementRead' AND table_schema = 'public'
        ORDER BY ordinal_position
      `);

      const columns = result.map((row: any) => row.column_name);
      
      const requiredColumns = [
        'id',
        'announcementId',
        'userId',
        'readAt'
      ];

      for (const columnName of requiredColumns) {
        expect(columns).toContain(columnName);
      }
    });
  });

  describe('Enums', () => {
    it('should have PostStatus enum with correct values', async () => {
      const result = await db.execute(sql`
        SELECT enumlabel 
        FROM pg_enum 
        WHERE enumtypid = (
          SELECT oid 
          FROM pg_type 
          WHERE typname = 'PostStatus'
        )
        ORDER BY enumsortorder
      `);

      const enumValues = result.map((row: any) => row.enumlabel);
      
      expect(enumValues).toEqual(['DRAFT', 'PUBLISHED', 'ARCHIVED']);
    });

    it('should have UserRole enum with correct values', async () => {
      const result = await db.execute(sql`
        SELECT enumlabel 
        FROM pg_enum 
        WHERE enumtypid = (
          SELECT oid 
          FROM pg_type 
          WHERE typname = 'UserRole'
        )
        ORDER BY enumsortorder
      `);

      const enumValues = result.map((row: any) => row.enumlabel);
      
      expect(enumValues).toEqual(['CREATOR', 'PARTICIPANT', 'PARTNER', 'ADMIN']);
    });
  });

  describe('Indexes', () => {
    it('should have performance indexes on Post table', async () => {
      const result = await db.execute(sql`
        SELECT indexname, indexdef
        FROM pg_indexes 
        WHERE tablename = 'Post' AND schemaname = 'public'
        ORDER BY indexname
      `);

      const indexNames = result.map((row: any) => row.indexname);
      
      // 주요 성능 인덱스들이 있는지 확인
      expect(indexNames.some(name => name.includes('status'))).toBe(true);
      expect(indexNames.some(name => name.includes('createdAt'))).toBe(true);
      expect(indexNames.some(name => name.includes('authorId'))).toBe(true);
    });

    it('should have indexes on Announcement table', async () => {
      const result = await db.execute(sql`
        SELECT indexname, indexdef
        FROM pg_indexes 
        WHERE tablename = 'Announcement' AND schemaname = 'public'
        ORDER BY indexname
      `);

      const indexNames = result.map((row: any) => row.indexname);
      
      expect(indexNames.some(name => name.includes('publishedAt'))).toBe(true);
      expect(indexNames.some(name => name.includes('category'))).toBe(true);
      expect(indexNames.some(name => name.includes('isPinned'))).toBe(true);
    });
  });

  describe('Foreign Keys', () => {
    it('should have proper foreign key constraints', async () => {
      const result = await db.execute(sql`
        SELECT 
          tc.table_name, 
          kcu.column_name, 
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name 
        FROM 
          information_schema.table_constraints AS tc 
          JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
          JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
            AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY' 
          AND tc.table_schema = 'public'
        ORDER BY tc.table_name, kcu.column_name
      `);

      const fkConstraints = result.map((row: any) => ({
        table: row.table_name,
        column: row.column_name,
        foreignTable: row.foreign_table_name,
        foreignColumn: row.foreign_column_name
      }));

      // Announcement 테이블의 외래키 확인
      const announcementFk = fkConstraints.find(fk => 
        fk.table === 'Announcement' && fk.column === 'authorId'
      );
      expect(announcementFk).toBeDefined();
      expect(announcementFk?.foreignTable).toBe('User');
      expect(announcementFk?.foreignColumn).toBe('id');

      // AnnouncementRead 테이블의 외래키 확인
      const announcementReadFks = fkConstraints.filter(fk => 
        fk.table === 'AnnouncementRead'
      );
      expect(announcementReadFks).toHaveLength(2);
      
      const announcementIdFk = announcementReadFks.find(fk => fk.column === 'announcementId');
      const userIdFk = announcementReadFks.find(fk => fk.column === 'userId');
      
      expect(announcementIdFk?.foreignTable).toBe('Announcement');
      expect(userIdFk?.foreignTable).toBe('User');
    });
  });

  describe('Data Integrity', () => {
    it('should be able to insert and query data', async () => {
      // 테스트용 사용자 생성
      const testUserId = `test-user-${Date.now()}`;
      
      await db.execute(sql`
        INSERT INTO "User" (id, name, email, role, "createdAt", "updatedAt")
        VALUES (${testUserId}, 'Test User', 'test@example.com', 'PARTICIPANT', NOW(), NOW())
      `);

      // 테스트용 공지사항 생성
      const testAnnouncementId = `test-announcement-${Date.now()}`;
      
      await db.execute(sql`
        INSERT INTO "Announcement" (id, title, content, category, "authorId", "createdAt", "updatedAt")
        VALUES (${testAnnouncementId}, 'Test Announcement', 'Test Content', 'general', ${testUserId}, NOW(), NOW())
      `);

      // 데이터 조회 테스트
      const result = await db.execute(sql`
        SELECT a.id, a.title, a.content, u.name as author_name
        FROM "Announcement" a
        JOIN "User" u ON a."authorId" = u.id
        WHERE a.id = ${testAnnouncementId}
      `);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: testAnnouncementId,
        title: 'Test Announcement',
        content: 'Test Content',
        author_name: 'Test User'
      });

      // 정리
      await db.execute(sql`DELETE FROM "Announcement" WHERE id = ${testAnnouncementId}`);
      await db.execute(sql`DELETE FROM "User" WHERE id = ${testUserId}`);
    });
  });
});
