const fs = require('fs');
const path = require('path');

// 수정할 파일 목록
const filesToFix = [
  'lib/server/artists.ts',
  'lib/server/moderation.ts',
  'lib/server/funding-settlement.ts',
  'lib/server/project-updates.ts',
  'lib/server/settlement-queries.ts',
  'lib/server/analytics.ts',
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
    
    // import { db } from '@/lib/db/client'; 를 import { getDb } from '@/lib/db/client'; 로 변경
    content = content.replace(
      /import\s*{\s*db\s*}\s*from\s*['"]@\/lib\/db\/client['"];?/g,
      "import { getDb } from '@/lib/db/client';"
    );
    
    // import { db, ... } from '@/lib/db/client'; 를 import { getDb, ... } from '@/lib/db/client'; 로 변경
    content = content.replace(
      /import\s*{\s*db\s*,\s*/g,
      "import { getDb, "
    );
    
    // 함수 내에서 db 사용하는 부분을 찾아서 수정
    // 이 부분은 각 파일마다 다르므로 수동으로 확인해야 함
    
    fs.writeFileSync(filePath, content);
    console.log(`Fixed: ${filePath}`);
  } catch (error) {
    console.error(`Error fixing ${filePath}:`, error.message);
  }
}

// 모든 파일 수정
filesToFix.forEach(fixFile);

console.log('Import fixes completed!');
