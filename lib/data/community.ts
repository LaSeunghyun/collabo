export interface CommunityAuthor {
  id: string;
  name: string;
  image?: string | null;
}

export interface CommunityComment {
  id: string;
  content: string;
  createdAt?: string;
  author?: CommunityAuthor;
}

export interface CommunityPost {
  id: string;
  title: string;
  content: string;
  likes: number;
  commentsCount: number;
  projectId?: string;
  createdAt?: string;
  author?: CommunityAuthor;
  comments: CommunityComment[];
  likedBy: string[];
}

export const demoCommunityPosts: CommunityPost[] = [
  {
    id: 'post-1',
    title: '팬 참여형 콘셉트 아이디어 공유',
    content: '실시간 참여 투표로 스토리를 완성하는 공연을 제안합니다.',
    likes: 54,
    commentsCount: 2,
    projectId: '1',
    createdAt: new Date().toISOString(),
    author: {
      id: 'demo-user',
      name: '홍길동'
    },
    likedBy: ['demo-user', 'fan-1', 'fan-2'],
    comments: [
      {
        id: 'comment-1',
        content: '이 아이디어 정말 신선하네요! 참여하고 싶어요.',
        createdAt: new Date().toISOString(),
        author: {
          id: 'fan-3',
          name: '팬 A'
        }
      },
      {
        id: 'comment-2',
        content: '투표로 결말이 바뀌는 공연이라니 기대됩니다.',
        createdAt: new Date().toISOString(),
        author: {
          id: 'fan-4',
          name: '팬 B'
        }
      }
    ]
  },
  {
    id: 'post-2',
    title: '굿즈 투표 결과 공개',
    content: '아티스트와 함께 만든 한정판 의상 굿즈 결과를 확인하세요!',
    likes: 34,
    commentsCount: 1,
    projectId: '2',
    createdAt: new Date().toISOString(),
    author: {
      id: 'demo-user',
      name: '콜라보 운영팀'
    },
    likedBy: ['fan-5', 'fan-6'],
    comments: [
      {
        id: 'comment-3',
        content: '결과 공유 감사합니다! 배송 일정도 알려주세요.',
        createdAt: new Date().toISOString(),
        author: {
          id: 'fan-7',
          name: '팬 C'
        }
      }
    ]
  }
];
