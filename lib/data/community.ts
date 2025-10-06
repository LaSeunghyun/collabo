export interface CommunityPost {
  id: string;
  title: string;
  content: string;
  likes: number;
  comments: number;
  dislikes: number;
  reports: number;
  category: string;
  projectId?: string;
  createdAt: string;
  liked: boolean;
  disliked: boolean;
  isPinned: boolean;
  isTrending: boolean;
  author: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
}

export interface CommunityComment {
  id: string;
  postId: string;
  content: string;
  authorName: string;
  createdAt?: string; // Keeping this optional for now
}

export interface CommunityFeedResponse {
  posts: CommunityPost[];
  pinned: CommunityPost[];
  popular: CommunityPost[];
  meta: {
    nextCursor: string | null;
    total: number;
    sort: 'recent' | 'popular' | 'trending';
    categories: string[];
    search: string | null;
    authorId: string | null;
    projectId: string | null;
  };
}
