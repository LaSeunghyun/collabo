import { QueryClient } from '@tanstack/react-query';

/**
 * React Query 클라이언트 싱글톤 인스턴스
 * 앱 전체에서 하나의 QueryClient 인스턴스를 재사용하여 성능 최적화
 */
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // 서버에서 이미 데이터를 가져온 경우, 즉시 stale로 표시하지 않음
        staleTime: 60 * 1000, // 1분
        // 캐시된 데이터를 백그라운드에서 자동으로 재검증
        refetchOnWindowFocus: false,
        // 네트워크 재연결 시 자동 재검증 비활성화 (필요시 활성화)
        refetchOnReconnect: false,
        // 에러 발생 시 재시도 설정
        retry: 1,
        // 재시도 간격
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      },
      mutations: {
        // 뮤테이션 실패 시 재시도 비활성화
        retry: false,
      },
    },
  });
}

// 브라우저 환경에서 전역 변수로 QueryClient를 저장하여 재사용
let browserQueryClient: QueryClient | undefined = undefined;

export function getQueryClient() {
  if (typeof window === 'undefined') {
    // 서버: 매 요청마다 새로운 QueryClient 생성 (SSR)
    return makeQueryClient();
  }
  
  // 브라우저: 싱글톤 인스턴스 재사용
  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient();
  }
  
  return browserQueryClient;
}

