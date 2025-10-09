const fs = require('fs');
const path = require('path');

// 한글이 깨진 문자열들을 수정하는 매핑
const koreanFixes = [
  // 일반적인 깨진 한글 패턴들
  ['?증 ?큰???요?니??', '인증 토큰이 필요합니다.'],
  ['?세???큰 블랙리스??처리 ?패', '액세스 토큰 블랙리스트 처리 실패'],
  ['?션 ?기??류', '세션 삭제 중 오류'],
  ['?체 로그?웃 처리 ?패', '전체 로그아웃 처리 실패'],
  ['?증 ?큰???효?? ?습?다.', '인증 토큰이 유효하지 않습니다.'],
  ['?입 검?', '입력 검증'],
  ['?네?? ?메?? 비?번호???수?니??', '이름, 이메일, 비밀번호는 필수입니다.'],
  ['?네?? 2???상 20???하?야 ?니??', '이름은 2자 이상 20자 이하여야 합니다.'],
  ['비?번호??6???상?어???니??', '비밀번호는 6자 이상이어야 합니다.'],
  ['?메???식 검?', '이메일 형식 검증'],
  ['?바??메???식???닙?다.', '올바른 이메일 형식이 아닙니다.'],
  ['?메??중복 ?인', '이메일 중복 확인'],
  ['?? ?용 중인 ?메?입?다.', '이미 사용 중인 이메일입니다.'],
  ['?네??중복 ?인', '이름 중복 확인'],
  ['?? ?용 중인 ?네?입?다.', '이미 사용 중인 이름입니다.'],
  ['비?번호 ?시??', '비밀번호 해시화'],
  ['?용???성', '사용자 생성'],
  ['?원가?이 ?료?었?니??', '회원가입이 완료되었습니다.'],
  ['?원가???러:', '회원가입 오류:'],
  ['?러 ?세:', '오류 상세:'],
  ['?원가????류가 발생?습?다.', '회원가입 중 오류가 발생했습니다.'],
  ['?이?베?스 ?결 ?스??', '데이터베이스 연결 테스트'],
  ['?이?베?스가 비활?화??경우 degraded ?태?반환', '데이터베이스가 비활성화된 경우 degraded 상태로 반환'],
  ['?이?베?스 ?용 가???? ?인', '데이터베이스 사용 가능 여부 확인'],
  ['?이?베?스???결?????습?다.', '데이터베이스에 연결할 수 없습니다.'],
  ['DATABASE_URL???정?? ?았?니??', 'DATABASE_URL이 설정되지 않았습니다.'],
  ['조건부 ?터?', '조건부 필터링'],
  ['주문 목록 조회', '주문 목록 조회'],
  ['?주문???이?들 조회', '각 주문의 아이템들 조회'],
  ['?체 개수 조회', '전체 개수 조회'],
  ['주문 목록 조회??류 발생:', '주문 목록 조회 중 오류 발생:'],
  ['주문 목록??불러?는???패?습?다.', '주문 목록을 불러오는데 실패했습니다.'],
  ['?못???청 본문?니??', '잘못된 요청 본문입니다.'],
  ['주문???품???요?니??', '주문할 상품이 필요합니다.'],
  ['?품 ?보 조회?검?', '상품 정보 조회 및 검증'],
  ['?? ?품??찾을 ???습?다.', '일부 상품을 찾을 수 없습니다.'],
  ['?고 ?인', '재고 확인'],
  ['?품???고가 부족합?다.', '상품의 재고가 부족합니다.'],
  ['주문 총액 계산', '주문 총액 계산'],
  ['배송???추? 가??', '배송비 등 추가 가격'],
  ['?랜???로 주문 ?성??고 차감', '트랜잭션으로 주문 생성 및 재고 차감'],
  ['주문 ?성', '주문 생성'],
  ['주문 ?이???성', '주문 아이템 생성'],
  ['?고 차감', '재고 차감'],
  ['주문 ?성???패?습?다.', '주문 생성에 실패했습니다.'],
  ['주문 ?성??류 발생:', '주문 생성 중 오류 발생:'],
  ['주문 ?성???패?습?다.', '주문 생성에 실패했습니다.']
];

function fixKoreanStrings(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;
    
    // 한글이 깨진 문자열들을 수정
    for (const [broken, fixed] of koreanFixes) {
      if (content.includes(broken)) {
        content = content.replaceAll(broken, fixed);
        hasChanges = true;
      }
    }
    
    if (hasChanges) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed Korean strings in ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
  }
}

// 문제가 있는 파일들
const problemFiles = [
  'app/api/orders/route.ts',
  'app/api/permissions/route.ts',
  'app/api/products/route.ts',
  'app/api/projects/route.ts',
  'app/api/test-db/route.ts',
  'app/api/wallet/route.ts',
  'app/error.tsx',
  'app/global-error.tsx',
  'app/projects/loading.tsx',
  'app/projects/new/page.tsx',
  'components/ui/index.ts',
  'components/ui/sections/project-filter-panel.tsx',
  'e2e/app-flow.spec.ts',
  'e2e/community.spec.ts',
  'e2e/projects.spec.ts',
  'lib/api/settlement.ts',
  'lib/server/moderation.ts'
];

problemFiles.forEach(fixKoreanStrings);

console.log('Remaining Korean string fixes completed!');
