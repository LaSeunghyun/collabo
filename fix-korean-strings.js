const fs = require('fs');
const path = require('path');

// 한글이 깨진 문자열들을 수정하는 매핑
const koreanFixes = [
  ['?기중', '대기중'],
  ['검?중', '검토중'],
  ['조치?료', '조치완료'],
  ['기각??', '기각됨'],
  ['?튜?오', '스튜디오'],
  ['공연??', '공연장'],
  ['?작??', '제작사'],
  ['기?', '기타'],
  ['?리?이?', '크리에이터'],
  ['참여??', '참여자'],
  ['?트??', '파트너'],
  ['?션 ?제', 'OAuth 계정 삭제'],
  ['?션 ??:', '세션 생성'],
  ['?션 조회', '세션 조회'],
  ['진행?', '진행중'],
  ['?료', '완료'],
  ['?고 ??:', '신고 관리'],
  ['?로?트 검??', '프로젝트 검토']
];

function fixKoreanStrings(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // 한글이 깨진 문자열들을 수정
    for (const [broken, fixed] of koreanFixes) {
      content = content.replaceAll(broken, fixed);
    }
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed Korean strings in ${filePath}`);
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
  }
}

// 문제가 있는 파일들
const problemFiles = [
  'app/admin/_components/settlement-queue-section.tsx',
  'app/admin/moderation/page.tsx',
  'app/admin/partners/page.tsx',
  'app/admin/projects/page.tsx'
];

problemFiles.forEach(fixKoreanStrings);

console.log('Korean string fixes completed!');