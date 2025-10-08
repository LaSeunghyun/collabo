// 게시글 작성 테스트 스크립트
const testPostCreation = async () => {
  const testData = {
    title: "테스트 게시글",
    content: "이것은 Drizzle 마이그레이션 후 게시글 작성 테스트입니다.",
    category: "GENERAL"
  };

  try {
    console.log('게시글 작성 테스트 시작...');
    console.log('테스트 데이터:', testData);

    const response = await fetch('http://localhost:3000/api/community', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // 실제 인증 토큰이 필요합니다
        // 'Authorization': 'Bearer your-token-here'
      },
      body: JSON.stringify(testData)
    });

    console.log('응답 상태:', response.status);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ 게시글 작성 성공!');
      console.log('생성된 게시글:', result);
    } else {
      const error = await response.json();
      console.log('❌ 게시글 작성 실패');
      console.log('오류:', error);
    }
  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error);
  }
};

// Node.js 환경에서 실행
if (typeof window === 'undefined') {
  testPostCreation();
} else {
  // 브라우저 환경에서 실행
  window.testPostCreation = testPostCreation;
}