#!/usr/bin/env node

import { config as loadEnv } from 'dotenv';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';
import { readFileSync, readdirSync } from 'fs';

const here = fileURLToPath(new URL('.', import.meta.url));
const projectRoot = resolve(here);
const defaultEnvFiles = ['.env.local', '.env'];

for (const file of defaultEnvFiles) {
  loadEnv({ path: resolve(projectRoot, file), override: false });
}

const databaseUrl = process.env.DRIZZLE_DATABASE_URL || process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/postgres';

async function verifyMigrations() {
  console.log('🔍 마이그레이션 검증을 시작합니다...\n');

  const sql = postgres(databaseUrl);
  
  try {
    // 1. 데이터베이스 연결 테스트
    console.log('1. 데이터베이스 연결 확인...');
    await sql`SELECT 1`;
    console.log('✅ 데이터베이스 연결 성공\n');

    // 2. 마이그레이션 파일 목록 확인
    console.log('2. 마이그레이션 파일 확인...');
    const migrationFiles = readdirSync(resolve(projectRoot, 'drizzle'))
      .filter(file => file.endsWith('.sql'))
      .sort();
    
    console.log(`📁 발견된 마이그레이션 파일: ${migrationFiles.length}개`);
    migrationFiles.forEach(file => console.log(`   - ${file}`));
    console.log('');

    // 3. 데이터베이스 스키마 덤프
    console.log('3. 데이터베이스 스키마 덤프...');
    const tables = await sql`
      SELECT table_name, table_type
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    
    console.log(`📊 데이터베이스 테이블: ${tables.length}개`);
    tables.forEach(table => console.log(`   - ${table.table_name} (${table.table_type})`));
    console.log('');

    // 4. 필수 테이블 존재 확인
    console.log('4. 필수 테이블 존재 확인...');
    const requiredTables = [
      'User', 'Project', 'Post', 'Comment', 'Announcement', 'AnnouncementRead',
      'Funding', 'Settlement', 'Partner', 'PartnerMatch', 'Product', 'Order',
      'PostLike', 'PostDislike', 'CommentReaction', 'Notification', 'VisitLog',
      'Wallet', 'AuditLog', 'Permission', 'UserPermission', 'PaymentTransaction',
      'UserFollow', 'ModerationReport', 'UserBlock', 'AuthSession', 'AuthDevice',
      'RefreshToken', 'TokenBlacklist'
    ];

    const existingTables = tables.map(t => t.table_name);
    const missingTables = requiredTables.filter(table => !existingTables.includes(table));
    
    if (missingTables.length > 0) {
      console.log('❌ 누락된 테이블:');
      missingTables.forEach(table => console.log(`   - ${table}`));
    } else {
      console.log('✅ 모든 필수 테이블이 존재합니다');
    }
    console.log('');

    // 5. Post 테이블 status 컬럼 확인
    console.log('5. Post 테이블 status 컬럼 확인...');
    const postColumns = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'Post' AND table_schema = 'public'
      ORDER BY ordinal_position
    `;
    
    const statusColumn = postColumns.find(col => col.column_name === 'status');
    if (statusColumn) {
      console.log('✅ Post.status 컬럼이 존재합니다');
      console.log(`   - 타입: ${statusColumn.data_type}`);
      console.log(`   - NULL 허용: ${statusColumn.is_nullable}`);
      console.log(`   - 기본값: ${statusColumn.column_default}`);
    } else {
      console.log('❌ Post.status 컬럼이 누락되었습니다');
    }
    console.log('');

    // 6. Announcement 테이블 확인
    console.log('6. Announcement 테이블 확인...');
    const announcementColumns = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'Announcement' AND table_schema = 'public'
      ORDER BY ordinal_position
    `;
    
    if (announcementColumns.length > 0) {
      console.log('✅ Announcement 테이블이 존재합니다');
      console.log(`   - 컬럼 수: ${announcementColumns.length}개`);
    } else {
      console.log('❌ Announcement 테이블이 누락되었습니다');
    }
    console.log('');

    // 7. 인덱스 확인
    console.log('7. 성능 인덱스 확인...');
    const indexes = await sql`
      SELECT tablename, indexname, indexdef
      FROM pg_indexes 
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname
    `;
    
    console.log(`📈 총 인덱스 수: ${indexes.length}개`);
    
    // Post 테이블 인덱스 확인
    const postIndexes = indexes.filter(idx => idx.tablename === 'Post');
    console.log(`   - Post 테이블 인덱스: ${postIndexes.length}개`);
    
    // Announcement 테이블 인덱스 확인
    const announcementIndexes = indexes.filter(idx => idx.tablename === 'Announcement');
    console.log(`   - Announcement 테이블 인덱스: ${announcementIndexes.length}개`);
    console.log('');

    // 8. ENUM 타입 확인
    console.log('8. ENUM 타입 확인...');
    const enums = await sql`
      SELECT t.typname, e.enumlabel
      FROM pg_type t 
      JOIN pg_enum e ON t.oid = e.enumtypid
      WHERE t.typtype = 'e'
      ORDER BY t.typname, e.enumsortorder
    `;
    
    const enumGroups = {};
    enums.forEach(enumItem => {
      if (!enumGroups[enumItem.typname]) {
        enumGroups[enumItem.typname] = [];
      }
      enumGroups[enumItem.typname].push(enumItem.enumlabel);
    });
    
    console.log(`📋 ENUM 타입: ${Object.keys(enumGroups).length}개`);
    Object.entries(enumGroups).forEach(([name, values]) => {
      console.log(`   - ${name}: [${values.join(', ')}]`);
    });
    console.log('');

    // 9. 외래키 제약조건 확인
    console.log('9. 외래키 제약조건 확인...');
    const foreignKeys = await sql`
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
    `;
    
    console.log(`🔗 외래키 제약조건: ${foreignKeys.length}개`);
    
    // Announcement 관련 외래키 확인
    const announcementFks = foreignKeys.filter(fk => 
      fk.table_name === 'Announcement' || fk.table_name === 'AnnouncementRead'
    );
    console.log(`   - Announcement 관련 외래키: ${announcementFks.length}개`);
    console.log('');

    // 10. 요약
    console.log('📊 검증 요약');
    console.log('============');
    console.log(`✅ 마이그레이션 파일: ${migrationFiles.length}개`);
    console.log(`✅ 데이터베이스 테이블: ${tables.length}개`);
    console.log(`✅ 필수 테이블 누락: ${missingTables.length}개`);
    console.log(`✅ 인덱스: ${indexes.length}개`);
    console.log(`✅ ENUM 타입: ${Object.keys(enumGroups).length}개`);
    console.log(`✅ 외래키 제약조건: ${foreignKeys.length}개`);
    
    if (missingTables.length === 0 && statusColumn && announcementColumns.length > 0) {
      console.log('\n🎉 모든 검증이 성공적으로 완료되었습니다!');
      process.exit(0);
    } else {
      console.log('\n⚠️  일부 검증에서 문제가 발견되었습니다.');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ 검증 중 오류가 발생했습니다:', error.message);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

// 스크립트 실행
verifyMigrations().catch(error => {
  console.error('❌ 스크립트 실행 중 오류:', error);
  process.exit(1);
});
