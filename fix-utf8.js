const fs = require('fs');
const path = require('path');

// UTF-8 문제가 있는 파일들
const problemFiles = [
  'components/ui/sections/community-board.tsx',
  'app/admin/moderation/page.tsx',
  'app/admin/page.tsx',
  'app/admin/partners/page.tsx'
];

function fixUtf8File(filePath) {
  try {
    console.log(`Fixing ${filePath}...`);
    
    // 파일을 읽어서 UTF-8로 다시 저장
    const content = fs.readFileSync(filePath, 'utf8');
    fs.writeFileSync(filePath, content, 'utf8');
    
    console.log(`✅ Fixed ${filePath}`);
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
  }
}

// 모든 문제 파일 수정
problemFiles.forEach(fixUtf8File);

console.log('UTF-8 fix completed!');
