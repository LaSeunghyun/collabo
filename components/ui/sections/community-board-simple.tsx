import React from 'react';
import Link from 'next/link';

interface CommunityPost {
  id: string;
  title: string;
  content: string;
  category: string;
  author: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
  createdAt: Date;
  updatedAt: Date;
  likes: number;
  comments: number;
  isPinned: boolean;
  liked: boolean;
}

interface CommunityBoardProps {
  posts: CommunityPost[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  canCreatePost: boolean;
  onPostCreated: () => void;
  onPostUpdated: () => void;
  onPostDeleted: () => void;
}

export function CommunityBoard({
  posts,
  totalCount,
  currentPage,
  totalPages,
  canCreatePost,
  onPostCreated,
  onPostUpdated,
  onPostDeleted
}: CommunityBoardProps) {
  return (
    <section className="space-y-8">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/50">
              커뮤니티 허브
            </p>
            <h2 className="mt-1 text-2xl font-semibold text-white">
              아티스트 협업 아이디어를 나누고 실시간 피드백을 주고받는 공간입니다.
            </h2>
          </div>
          {canCreatePost && (
            <button
              onClick={onPostCreated}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              글 작성
            </button>
          )}
        </div>

        <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            <button className="rounded-full px-3 py-1.5 text-xs font-medium transition bg-primary text-primary-foreground">
              전체
            </button>
            <button className="rounded-full px-3 py-1.5 text-xs font-medium transition bg-white/5 text-white/60 hover:bg-white/10">
              공지
            </button>
            <button className="rounded-full px-3 py-1.5 text-xs font-medium transition bg-white/5 text-white/60 hover:bg-white/10">
              자유
            </button>
            <button className="rounded-full px-3 py-1.5 text-xs font-medium transition bg-white/5 text-white/60 hover:bg-white/10">
              협업
            </button>
            <button className="rounded-full px-3 py-1.5 text-xs font-medium transition bg-white/5 text-white/60 hover:bg-white/10">
              도움요청
            </button>
            <button className="rounded-full px-3 py-1.5 text-xs font-medium transition bg-white/5 text-white/60 hover:bg-white/10">
              쇼케이스
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/60">
              선택한 카테고리 1개
            </span>
            <span className="hidden md:inline">/</span>
            <span>선택한 카테고리 1개</span>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="text"
              placeholder="게시글 검색 또는 @멘션하기"
              className="w-full rounded-full border border-white/10 bg-neutral-950/60 py-2 pl-10 pr-4 text-sm text-white placeholder:text-white/50 focus:border-primary focus:outline-none"
            />
          </div>
          <div className="flex gap-2">
            <button className="rounded-full px-3 py-1.5 text-xs font-medium transition bg-primary text-primary-foreground">
              최신순
            </button>
            <button className="rounded-full px-3 py-1.5 text-xs font-medium transition bg-white/5 text-white/60 hover:bg-white/10">
              인기순
            </button>
            <button className="rounded-full px-3 py-1.5 text-xs font-medium transition bg-white/5 text-white/60 hover:bg-white/10">
              트렌딩
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {posts.map((post) => (
          <article key={post.id} className="rounded-2xl border border-white/10 bg-white/5 p-6 transition hover:border-white/20">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 text-xs text-white/60">
                  <span>{post.category}</span>
                  <span>/</span>
                  <time dateTime={post.createdAt.toISOString()}>
                    {post.createdAt.toLocaleDateString('ko-KR')}
                  </time>
                </div>
                <h3 className="mt-2 text-lg font-semibold text-white">
                  <Link href={`/community/${post.id}`} className="transition hover:text-primary">
                    {post.title}
                  </Link>
                </h3>
                <p className="mt-2 line-clamp-3 text-sm text-white/70">
                  {post.content}
                </p>
                <div className="mt-4 flex items-center gap-4 text-xs text-white/60">
                  <span className="font-semibold text-white">{post.author.name}</span>
                  <span>/</span>
                  <span>{post.comments} 댓글</span>
                  <span>/</span>
                  <span>{post.likes} 좋아요</span>
                </div>
              </div>
              <div className="ml-4 flex flex-col items-center gap-2">
                <button className="flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition bg-white/5 text-white/60 hover:bg-white/10">
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  {post.likes}
                </button>
                <Link href={`/community/${post.id}`} className="flex items-center gap-1 rounded-full bg-white/5 px-3 py-1.5 text-xs font-medium text-white/60 transition hover:bg-white/10">
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  {post.comments}
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
