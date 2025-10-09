const fs = require('fs');
const path = require('path');

// 한글이 깨진 문자열들을 수정하는 매핑
const koreanFixes = [
  // 일반적인 깨진 한글 패턴들
  ['?이?베?스 ?용 가???? ?인', '데이터베이스 사용 가능 여부 확인'],
  ['?이?베?스???결?????습?다.', '데이터베이스에 연결할 수 없습니다.'],
  ['DATABASE_URL???정?? ?았?니??', 'DATABASE_URL이 설정되지 않았습니다.'],
  ['조건부 ?터?', '조건부 필터링'],
  ['?품 목록 조회', '상품 목록 조회'],
  ['?체 개수 조회', '전체 개수 조회'],
  ['관리자?권한 목록 조회 가??', '관리자만 권한 목록 조회 가능'],
  ['권한 목록 조회', '권한 목록 조회'],
  ['?품 ?성', '상품 생성'],
  ['?품 ?성???패?습?다.', '상품 생성에 실패했습니다.'],
  ['?품 ?성??류 발생:', '상품 생성 중 오류 발생:'],
  ['?품 ?성???패?습?다.', '상품 생성에 실패했습니다.'],
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
  ['주문 ?성???패?습?다.', '주문 생성에 실패했습니다.'],
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
  'app/api/products/route.ts',
  'app/api/permissions/route.ts',
  'app/api/orders/route.ts',
  'lib/server/moderation.ts',
  'e2e/projects.spec.ts',
  'e2e/community.spec.ts',
  'e2e/app-flow.spec.ts'
];

problemFiles.forEach(fixKoreanStrings);

console.log('Final Korean string fixes completed!');
