const { PrismaClient } = require('@prisma/client');

async function validateSchema() {
  const prisma = new PrismaClient();
  
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // 모든 테이블 목록 가져오기
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;
    
    console.log('📋 Database tables:');
    tables.forEach(table => {
      console.log(`  - ${table.table_name}`);
    });
    
    // Prisma 스키마에서 정의된 모델들과 비교
    const prismaModels = [
      'User', 'Project', 'ProjectCollaborator', 'AuthDevice', 'AuthSession', 'RefreshToken',
      'TokenBlacklist', 'Funding', 'Settlement', 'Partner', 'PartnerMatch', 'Product',
      'Order', 'OrderItem', 'Post', 'Comment', 'PostLike', 'PostDislike', 'CommentReaction',
      'Notification', 'VisitLog', 'Wallet', 'AuditLog', 'Permission', 'UserPermission',
      'PaymentTransaction', 'SettlementPayout', 'ProjectMilestone', 'ProjectRewardTier',
      'ProjectRequirement', 'UserFollow', 'ModerationReport', 'UserBlock'
    ];
    
    console.log('\n🔍 Checking model-table alignment:');
    const dbTableNames = tables.map(t => t.table_name);
    
    for (const model of prismaModels) {
      if (dbTableNames.includes(model)) {
        console.log(`  ✅ ${model} - exists in database`);
      } else {
        console.log(`  ❌ ${model} - missing in database`);
      }
    }
    
    // 주요 테이블들의 컬럼 구조 확인
    console.log('\n📝 Checking key table structures:');
    
    // Post 테이블 확인
    const postColumns = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'Post' AND table_schema = 'public'
      ORDER BY ordinal_position;
    `;
    
    console.log('\n📄 Post table columns:');
    postColumns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable}, default: ${col.column_default || 'none'})`);
    });
    
    // User 테이블 확인
    const userColumns = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'User' AND table_schema = 'public'
      ORDER BY ordinal_position;
    `;
    
    console.log('\n👤 User table columns:');
    userColumns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable}, default: ${col.column_default || 'none'})`);
    });
    
    // VisitLog 테이블 확인
    const visitLogColumns = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'VisitLog' AND table_schema = 'public'
      ORDER BY ordinal_position;
    `;
    
    console.log('\n📊 VisitLog table columns:');
    visitLogColumns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable}, default: ${col.column_default || 'none'})`);
    });
    
    // ENUM 타입들 확인
    const enums = await prisma.$queryRaw`
      SELECT typname, enumlabel
      FROM pg_type t 
      JOIN pg_enum e ON t.oid = e.enumtypid
      WHERE t.typname LIKE '%Role%' OR t.typname LIKE '%Status%' OR t.typname LIKE '%Type%'
      ORDER BY t.typname, e.enumsortorder;
    `;
    
    console.log('\n🏷️ Database ENUM types:');
    const enumMap = {};
    enums.forEach(enumItem => {
      if (!enumMap[enumItem.typname]) {
        enumMap[enumItem.typname] = [];
      }
      enumMap[enumItem.typname].push(enumItem.enumlabel);
    });
    
    Object.keys(enumMap).forEach(enumName => {
      console.log(`  - ${enumName}: [${enumMap[enumName].join(', ')}]`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

validateSchema();
