const fs = require('fs');
const path = require('path');

/**
 * UTF-8 인코딩이 깨진 한글 문자열을 수정하는 스크립트
 */

// 깨진 한글 패턴과 올바른 한글 매핑
const koreanFixes = [
  // lib/server/partners.ts
  ['Ʈ  ȿ ʽϴ.', '파트너 입력 데이터가 유효하지 않습니다.'],
  ['̹ϵ?Ʈ  ֽϴ.', '이미 등록된 파트너 프로필이 있습니다.'],
  ['Ʈ   ã ϴ.', '파트너 소유자를 찾을 수 없습니다.'],
  ['Ʈ  ã ϴ.', '파트너를 찾을 수 없습니다.'],
  ['Ʈ    ϴ.', '파트너에 대한 접근 권한이 없습니다.'],
  
  // lib/server/projects.ts
  ['?로?트 ?력 값이 ?바르? ?습?다.', '프로젝트 입력 값이 올바르지 않습니다.'],
  ['?로?트?찾을 ???습?다.', '프로젝트를 찾을 수 없습니다.'],
  ['?로?트???근??권한???습?다.', '프로젝트에 대한 접근 권한이 없습니다.'],
  
  // lib/server/moderation.ts
  ['간단??구현?로 변?- 복잡??groupBy ???기본 쿼리 ?용', '간단한 구현으로 변경 - 복잡한 groupBy 대신 기본 쿼리 사용'],
  
  // lib/server/settlements.ts
  ['배분 비율??총합??100%?초과?니??', '배분 비율의 총합이 100%를 초과합니다.'],
  ['?산??계산?려??효??모집 금액???요?니??', '정산을 계산하려면 유효한 모집 금액이 필요합니다.'],
  ['?랫???수?비율? 0?1 ?이?야 ?니??', '플랫폼 수수료 비율은 0과 1 사이여야 합니다.'],
  
  // middleware.ts
  ['?이??리????용', '미들웨어 사용'],
  ['?증 ??? ???이 ?근 가?한 공용 경로 목록', '인증 없이도 접근 가능한 공용 경로 목록'],
  ['?확???치?는 경로?? ?인', '확인해야 하는 경로인지 확인'],
  ['?적 경로(?? /projects/[id], /api/projects/[id])?? ?인', '동적 경로(예: /projects/[id], /api/projects/[id])인지 확인'],
  
  // lib/constants/partner-types.ts
  ['?튜?오', '스튜디오'],
  ['공연??', '공연장'],
  ['?작 ?튜?오', '제작 스튜디오'],
  ['머천?이?', '머천다이즈'],
  ['기?', '기타'],
  
  // app/admin/reports/_components/report-stats-section.tsx
  ['?체 ?고', '전체 신고'],
  ['처리 ?기중', '처리 대기중'],
  ['처리 ?료', '처리 완료'],
  ['?세 보기', '상세 보기'],
  
  // app/providers.tsx
  [' Ӽ÷װ  Ȱ (α׾ƿ)', '현재 세션의 플래그가 없으면 활성으로 설정 (로그아웃에서 제거)'],
  
  // types/drizzle.ts
  ['?스?에???용?????는 enum 값들', '타입스크립트에서 사용하기 위한 enum 값들'],
  
  // 일반적인 패턴들
  ['?기중', '대기중'],
  ['검?중', '검토중'],
  ['조치?료', '조치완료'],
  ['기각??', '기각됨'],
  ['?튜?오', '스튜디오'],
  ['공연??', '공연장'],
  ['?작??', '제작사'],
  ['?리?이?', '크리에이터'],
  ['참여??', '참여자'],
  ['?트??', '파트너'],
  ['진행?', '진행중'],
  ['?료', '완료'],
  ['?고', '신고'],
  ['?로?트', '프로젝트'],
  ['?션', '세션'],
];

function fixKoreanStrings(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`⏭️  Skipped (not found): ${filePath}`);
      return false;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;
    let changeCount = 0;

    // 깨진 한글 문자열들을 수정
    for (const [broken, fixed] of koreanFixes) {
      if (content.includes(broken)) {
        const occurrences = (content.match(new RegExp(broken.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
        content = content.replaceAll(broken, fixed);
        hasChanges = true;
        changeCount += occurrences;
      }
    }

    if (hasChanges) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed ${changeCount} issue(s) in: ${filePath}`);
      return true;
    } else {
      console.log(`✓  No issues found in: ${filePath}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
    return false;
  }
}

// 수정할 파일 목록
const filesToFix = [
  'lib/server/partners.ts',
  'lib/server/projects.ts',
  'lib/server/moderation.ts',
  'lib/server/settlements.ts',
  'middleware.ts',
  'lib/constants/partner-types.ts',
  'app/admin/reports/_components/report-stats-section.tsx',
  'app/providers.tsx',
  'types/drizzle.ts',
  'app/api/hero-slides/route.ts',
  'app/api/health/route.ts',
  'app/api/funding/route.ts',
  'lib/server/artists.ts',
  'components/ui/sections/community-board.tsx',
  'lib/db/client.ts',
  'app/admin/_components/project-review-section.tsx',
  'app/admin/_components/analytics-overview-section.tsx',
  '__tests__/lib/server/artists.test.ts',
  '__tests__/lib/server/partners.test.ts',
  '__tests__/lib/server/project-updates.test.ts',
];

console.log('🔧 Starting UTF-8 encoding fix...\n');

let fixedCount = 0;
let totalFiles = 0;

for (const file of filesToFix) {
  const filePath = path.join(process.cwd(), file);
  totalFiles++;
  if (fixKoreanStrings(filePath)) {
    fixedCount++;
  }
}

console.log(`\n📊 Summary:`);
console.log(`   Total files processed: ${totalFiles}`);
console.log(`   Files fixed: ${fixedCount}`);
console.log(`   Files unchanged: ${totalFiles - fixedCount}`);
console.log(`\n✨ UTF-8 encoding fix completed!`);
