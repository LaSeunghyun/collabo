export interface CommunityPostAuthor {
  id: string;
  name: string;
  avatarUrl?: string | null;
}

export interface CommunityPost {
  id: string;
  title: string;
  content: string;
  likes: number;
  comments: number;
  category: string;
  projectId?: string;
  createdAt?: string;
  liked?: boolean;
  isPinned?: boolean;
  isTrending?: boolean;
  author?: CommunityPostAuthor;
}

export interface CommunityComment {
  id: string;
  postId: string;
  content: string;
  authorName: string;
  createdAt?: string;
}

export interface CommunityFeedResponse {
  posts: CommunityPost[];
  pinned: CommunityPost[];
  popular: CommunityPost[];
  meta: {
    nextCursor: string | null;
    total: number;
    sort: 'recent' | 'popular' | 'trending';
    category?: string | null;
    search?: string | null;
  };
}

export interface CommunityListParams {
  projectId?: string;
  sort?: 'recent' | 'popular' | 'trending';
  category?: string | null;
  search?: string | null;
  cursor?: string | null;
  limit?: number;
}

export const demoCommunityPosts: CommunityPost[] = [
  {
    id: 'post-1',
    title: '팬 참여형 콘셉트 아이디어 공유',
    content: '실시간 참여 투표로 스토리를 완성하는 공연을 제안합니다.',
    likes: 54,
    comments: 12,
    category: 'notice',
    projectId: '1',
    createdAt: '2024-07-05T09:00:00.000Z',
    isPinned: true
  },
  {
    id: 'post-2',
    title: '굿즈 투표 결과 공개',
    content: '아티스트와 함께 만든 한정판 의상 굿즈 결과를 확인하세요!',
    likes: 34,
    comments: 4,
    category: 'general',
    projectId: '2',
    createdAt: '2024-06-28T09:00:00.000Z'
  },
  {
    id: 'post-3',
    title: '협업 파트너 구해요',
    content: 'AI 댄스 영상 합성에 관심 있는 파트너를 구합니다.',
    likes: 12,
    comments: 6,
    category: 'collab',
    createdAt: '2024-07-10T12:00:00.000Z'
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

export function listDemoCommunityPosts(params: CommunityListParams = {}): CommunityFeedResponse {
  const {
    projectId,
    sort = 'recent',
    category,
    search,
    cursor,
    limit = 10
  } = params;

  const sanitizedLimit = Math.max(1, Math.min(limit, 50));

  const filteredByProject = projectId
    ? communityPostsStore.filter((post) => post.projectId === projectId)
    : [...communityPostsStore];

  const filteredByCategory = category && category !== 'all'
    ? filteredByProject.filter((post) => post.category === category)
    : filteredByProject;

  const filteredBySearch = search
    ? filteredByCategory.filter((post) =>
        post.title.toLowerCase().includes(search.toLowerCase()) ||
        post.content.toLowerCase().includes(search.toLowerCase())
      )
    : filteredByCategory;

  const sorted = filteredBySearch.slice().sort((a, b) => {
    if (sort === 'popular' || sort === 'trending') {
      const likeDelta = b.likes - a.likes;
      if (likeDelta !== 0) {
        return likeDelta;
      }
    }

    const dateA = a.createdAt ? new Date(a.createdAt).valueOf() : 0;
    const dateB = b.createdAt ? new Date(b.createdAt).valueOf() : 0;
    return dateB - dateA;
  });

  const startIndex = cursor ? sorted.findIndex((post) => post.id === cursor) + 1 : 0;
  const paginated = sorted.slice(startIndex, startIndex + sanitizedLimit + 1);
  const hasNext = paginated.length > sanitizedLimit;
  const items = hasNext ? paginated.slice(0, sanitizedLimit) : paginated;

  const trendingIds = new Set(sorted.slice(0, 3).map((post) => post.id));

  const clone = (post: CommunityPost): CommunityPost => ({
    ...post,
    liked: post.liked ?? false,
    isTrending: trendingIds.has(post.id)
  });

  const pinned = sorted.filter((post) => post.isPinned).map(clone);
  const popular = sorted
    .slice()
    .sort((a, b) => b.likes - a.likes)
    .slice(0, 5)
    .map(clone);

  return {
    posts: items.map(clone),
    pinned,
    popular,
    meta: {
      nextCursor: hasNext ? items[items.length - 1]?.id ?? null : null,
      total: sorted.length,
      sort,
      category: category ?? null,
      search: search ?? null
    }
  };
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
