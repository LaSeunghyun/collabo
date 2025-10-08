const fs = require('fs');
const path = require('path');

// Admin 컴포넌트들의 UTF-8 문제 해결
const adminFiles = [
  'app/admin/_components/analytics-overview-section.tsx',
  'app/admin/_components/moderation-report-section.tsx',
  'app/admin/_components/partner-approval-section.tsx',
  'app/admin/_components/project-review-section.tsx'
];

function fixUtf8File(filePath) {
  try {
    console.log(`Fixing ${filePath}...`);
    
    // 파일이 존재하는지 확인
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${filePath}`);
      return;
    }
    
    // 파일을 읽어서 UTF-8로 다시 저장
    const content = fs.readFileSync(filePath, 'utf8');
    fs.writeFileSync(filePath, content, 'utf8');
    
    console.log(`✅ Fixed ${filePath}`);
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
  }
}

// 모든 admin 파일 수정
adminFiles.forEach(fixUtf8File);

console.log('Admin components UTF-8 fix completed!');
