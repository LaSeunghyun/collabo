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
  dislikes?: number;
  reports?: number;
  authorId?: string;
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
    categories?: string[];
    search?: string | null;
    authorId?: string | null;
  };
}
