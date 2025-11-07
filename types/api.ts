/**
 * API 응답 타입 정의
 * 모든 API 관련 타입을 중앙화하여 중복 제거
 */

// 프로젝트 관련 타입
export interface ProjectSummary {
  id: string;
  title: string;
  description: string;
  category: string;
  thumbnail: string;
  targetAmount: number;
  currentAmount: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  owner: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
  _count: {
    fundings: number;
  };
  participants: number;
  remainingDays: number;
}

// 아티스트 관련 타입
export interface ArtistSummary {
  id: string;
  name: string;
  avatarUrl: string | null;
  bio: string | null;
  followerCount: number;
  projectCount: number;
}

// 커뮤니티 포스트 관련 타입
export interface CommunityPostSummary {
  id: string;
  title: string;
  content: string;
  category: string;
  likes: number;
  comments: number;
  createdAt: string;
  author: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
}

