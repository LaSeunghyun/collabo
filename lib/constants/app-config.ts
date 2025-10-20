/**
 * 애플리케이션 설정 상수들
 * 하드코딩된 값들을 중앙 집중식으로 관리
 */

// API 제한값 설정
export const API_LIMITS = {
  // 아티스트 API
  ARTISTS: {
    DEFAULT_LIMIT: 12,
    MAX_LIMIT: 24
  },
  
  // 커뮤니티 API
  COMMUNITY: {
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 50,
    PINNED_LIMIT: 5,
    POPULAR_LIMIT: 5,
    TRENDING_LIMIT: 10
  },
  
  // 프로젝트 API
  PROJECTS: {
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 20
  }
} as const;

// 캐시 TTL 설정 (밀리초)
export const CACHE_TTL = {
  // API 캐시
  ARTISTS: 5 * 60 * 1000,      // 5분
  COMMUNITY: 30 * 1000,        // 30초
  PROJECTS: 60 * 1000,         // 1분
  CATEGORIES: 30 * 60 * 1000,  // 30분
  
  // React Query 캐시
  REACT_QUERY: {
    ARTISTS: 60 * 1000,        // 1분
    COMMUNITY: 15 * 1000,      // 15초
    CATEGORIES: 10 * 60 * 1000 // 10분
  }
} as const;

// DB 연결 설정
export const DB_CONFIG = {
  CONNECTION_LIMIT: 10,
  POOL_TIMEOUT: 10,
  CONNECT_TIMEOUT: 5,
  STATEMENT_TIMEOUT: 5000,
  IDLE_TIMEOUT: 30
} as const;

// 성능 임계값 설정
export const PERFORMANCE_THRESHOLDS = {
  // API 응답 시간 (밀리초)
  API: {
    WARNING: 1000,    // 1초
    ERROR: 5000       // 5초
  },
  
  // 쿼리 실행 시간 (밀리초)
  QUERY: {
    WARNING: 500,     // 0.5초
    ERROR: 2000       // 2초
  },
  
  // 타임아웃 설정 (밀리초)
  TIMEOUT: {
    DEFAULT: 5000,    // 5초
    QUICK: 2000,      // 2초
    LONG: 10000       // 10초
  }
} as const;

// 커뮤니티 피드 설정
export const FEED_CONFIG = {
  PINNED_LIMIT: 5,
  POPULAR_LIMIT: 5,
  TRENDING_LIMIT: 10,
  TRENDING_DAYS: 3,
  TRENDING_MIN_LIKES: 5,
  TRENDING_MIN_COMMENTS: 3,
  POPULAR_MIN_LIKES: 5,
  POPULAR_MIN_COMMENTS: 2
} as const;

// 페이지네이션 설정
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 50,
  CURSOR_LIMIT: 20
} as const;

// 파일 업로드 설정
export const FILE_UPLOAD = {
  MAX_SIZE: 10 * 1024 * 1024,  // 10MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  MAX_FILES: 5
} as const;

// 세션 설정
export const SESSION_CONFIG = {
  EXPIRES_IN: 24 * 60 * 60 * 1000,  // 24시간
  REFRESH_THRESHOLD: 60 * 60 * 1000 // 1시간
} as const;

// UI 설정
export const UI_CONFIG = {
  SKELETON_COUNT: 4,
  DEBOUNCE_DELAY: 300,
  ANIMATION_DURATION: 200
} as const;

// 환경별 설정
export const ENV_CONFIG = {
  DEVELOPMENT: {
    LOG_LEVEL: 'debug',
    CACHE_ENABLED: true,
    PERFORMANCE_MONITORING: true
  },
  PRODUCTION: {
    LOG_LEVEL: 'error',
    CACHE_ENABLED: true,
    PERFORMANCE_MONITORING: false
  }
} as const;
