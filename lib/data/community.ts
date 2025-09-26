export interface CommunityPost {
  id: string;
  title: string;
  content: string;
  likes: number;
  comments: number;
  projectId?: string;
  createdAt?: string;
  liked?: boolean;
}

export interface CommunityComment {
  id: string;
  postId: string;
  content: string;
  authorName: string;
  createdAt?: string;
}

export const demoCommunityPosts: CommunityPost[] = [
  {
    id: 'post-1',
    title: '팬 참여형 콘셉트 아이디어 공유',
    content: '실시간 참여 투표로 스토리를 완성하는 공연을 제안합니다.',
    likes: 54,
    comments: 12,
    projectId: '1',
    createdAt: '2024-07-05T09:00:00.000Z'
  },
  {
    id: 'post-2',
    title: '굿즈 투표 결과 공개',
    content: '아티스트와 함께 만든 한정판 의상 굿즈 결과를 확인하세요!',
    likes: 34,
    comments: 4,
    projectId: '2',
    createdAt: '2024-06-28T09:00:00.000Z'
  }
];

const communityPostsStore: CommunityPost[] = demoCommunityPosts.map((post) => ({
  ...post,
  liked: post.liked ?? false
}));

const communityCommentsStore: Record<string, CommunityComment[]> = {
  'post-1': [
    {
      id: 'comment-1',
      postId: 'post-1',
      content: '이 아이디어 너무 좋아요! 현장에서 참여하면 더 재밌을 것 같아요.',
      authorName: '팬 A',
      createdAt: '2024-07-05T10:12:00.000Z'
    },
    {
      id: 'comment-2',
      postId: 'post-1',
      content: '투표 시스템에 실시간 채팅이 있으면 좋겠어요!',
      authorName: '팬 B',
      createdAt: '2024-07-05T11:02:00.000Z'
    }
  ],
  'post-2': [
    {
      id: 'comment-3',
      postId: 'post-2',
      content: '굿즈 디자인이 기대돼요. 색상 버전도 공유해주세요!',
      authorName: '팬 C',
      createdAt: '2024-06-28T11:45:00.000Z'
    }
  ]
};

export function listDemoCommunityPosts(
  projectId?: string,
  sort: 'recent' | 'popular' = 'recent'
): CommunityPost[] {
  const filtered = projectId
    ? communityPostsStore.filter((post) => post.projectId === projectId)
    : [...communityPostsStore];

  return filtered
    .slice()
    .sort((a, b) => {
      if (sort === 'popular') {
        return b.likes - a.likes;
      }
      const dateA = a.createdAt ? new Date(a.createdAt).valueOf() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).valueOf() : 0;
      return dateB - dateA;
    });
}

export function addDemoCommunityPost(post: CommunityPost) {
  communityPostsStore.unshift(post);
  return post;
}

export function findDemoCommunityPost(id: string) {
  return communityPostsStore.find((post) => post.id === id);
}

export function updateDemoCommunityPost(
  id: string,
  updater: (post: CommunityPost) => CommunityPost
) {
  const index = communityPostsStore.findIndex((post) => post.id === id);
  if (index === -1) {
    return undefined;
  }

  const updated = updater({ ...communityPostsStore[index] });
  communityPostsStore[index] = { ...communityPostsStore[index], ...updated };
  return communityPostsStore[index];
}

export function getDemoCommunityComments(postId: string) {
  return communityCommentsStore[postId]?.slice() ?? [];
}

export function addDemoCommunityComment(postId: string, comment: CommunityComment) {
  if (!communityCommentsStore[postId]) {
    communityCommentsStore[postId] = [];
  }

  communityCommentsStore[postId].push(comment);

  updateDemoCommunityPost(postId, (post) => ({
    ...post,
    comments: (post.comments ?? 0) + 1
  }));

  return comment;
}
