const fs = require('fs');
const path = require('path');

// 수정할 파일 목록
const filesToFix = [
  'lib/server/artists.ts',
  'lib/server/analytics.ts',
  'lib/server/funding-settlement.ts',
  'lib/server/moderation.ts',
  'lib/server/partners.ts',
  'lib/server/projects.ts',
  'lib/server/project-updates.ts',
  'lib/server/settlement-queries.ts',
  'lib/auth/session.ts',
  'lib/auth/user.ts',
  'lib/auth/access-token.ts',
  'lib/auth/session-store.ts',
  'lib/auth/adapter.ts',
  'lib/auth/token-blacklist.ts',
  'lib/auth/options.ts',
  'app/api/community/[id]/route.ts',
  'app/api/settlement/route.ts',
  'app/api/orders/route.ts',
  'app/api/permissions/route.ts',
  'app/api/payments/route.ts',
  'app/api/products/route.ts',
  'app/api/test-accounts/route.ts',
  'app/api/test-db/route.ts',
  'app/api/health/route.ts',
  'app/api/auth/login/route.ts'
];

function fixFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`File not found: ${filePath}`);
      return;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // 함수 시작 부분에 db 초기화 추가
    const functionPattern = /(export\s+(?:async\s+)?function\s+\w+|const\s+\w+\s*=\s*(?:async\s+)?\([^)]*\)\s*=>\s*{|export\s+const\s+\w+\s*=\s*(?:async\s+)?\([^)]*\)\s*=>\s*{)/g;
    
    content = content.replace(functionPattern, (match) => {
      // 이미 db = await getDb()가 있는지 확인
      if (content.includes('const db = await getDb()') || content.includes('let db = await getDb()')) {
        return match;
      }
      
      // 함수 시작 부분에 db 초기화 추가
      return match + '\n    const db = await getDb();';
    });
    
    // await db. 패턴을 찾아서 수정
    content = content.replace(/await\s+db\./g, 'await db.');
    
    // db. 패턴을 찾아서 수정 (await 없이 사용되는 경우)
    content = content.replace(/(?<!await\s)db\./g, 'db.');
    
    fs.writeFileSync(filePath, content);
    console.log(`Fixed: ${filePath}`);
  } catch (error) {
    console.error(`Error fixing ${filePath}:`, error.message);
  }
}

// 모든 파일 수정
filesToFix.forEach(fixFile);

console.log('DB usage fixes completed!');
