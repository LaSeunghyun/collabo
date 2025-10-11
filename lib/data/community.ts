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
  likeCount: number;
  commentCount: number;
  category: string;
  projectId?: string;
  createdAt?: string;
  liked?: boolean;
  disliked?: boolean;
  isPinned?: boolean;
  isTrending?: boolean;
  author?: CommunityPostAuthor;
  dislikes?: number;
  reports?: number;
  authorId?: string;
  images?: string[];
  attachments?: AttachmentMetadata[];
  linkPreviews?: LinkPreviewMetadata[];
  parentPostId?: string;
  replyCount?: number;
  viewCount?: number;
}

export interface AttachmentMetadata {
  id: string;
  type: 'image' | 'video' | 'audio' | 'document';
  url: string;
  filename: string;
  size: number;
  mimeType: string;
  thumbnailUrl?: string;
  duration?: number; // for video/audio
  width?: number; // for images/videos
  height?: number; // for images/videos
}

export interface LinkPreviewMetadata {
  url: string;
  title: string;
  description: string;
  image?: string;
  siteName?: string;
  domain?: string;
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
    categories?: string[] | null;
    search?: string | null;
    authorId?: string | null;
    projectId?: string | null;
  };
}
