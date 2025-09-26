export interface CommunityPost {
  id: string;
  title: string;
  content: string;
  likes: number;
  comments: number;
  projectId?: string;
}

export const demoCommunityPosts: CommunityPost[] = [
  {
    id: 'post-1',
    title: '팬 참여형 콘셉트 아이디어 공유',
    content: '실시간 참여 투표로 스토리를 완성하는 공연을 제안합니다.',
    likes: 54,
    comments: 12,
    projectId: '1'
  },
  {
    id: 'post-2',
    title: '굿즈 투표 결과 공개',
    content: '아티스트와 함께 만든 한정판 의상 굿즈 결과를 확인하세요!',
    likes: 34,
    comments: 4,
    projectId: '2'
  }
];
