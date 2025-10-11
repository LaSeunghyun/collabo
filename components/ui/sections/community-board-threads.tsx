'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { InfiniteData } from '@tanstack/react-query';
import { Heart, MessageCircle, Search, Sparkles, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { signIn, useSession } from 'next-auth/react';
import clsx from 'clsx';

import type { CommunityFeedResponse, CommunityPost, AttachmentMetadata, LinkPreviewMetadata } from '@/lib/data/community';
import { ThreadsComposer } from '@/components/ui/community/ThreadsComposer';
import { ThreadsPostCard } from '@/components/ui/community/ThreadsPostCard';

const CATEGORY_OPTIONS = [
  'all',
  'notice',
  'general',
  'collab',
  'support',
  'showcase'
] as const;

const SORT_OPTIONS = ['recent', 'popular', 'trending'] as const;

const PAGE_SIZE = 12;

interface CommunityBoardProps {
  projectId?: string;
  authorId?: string;
  readOnly?: boolean;
  onMetaChange?: (meta: {
    pinned: CommunityPost[];
    popular: CommunityPost[];
    total: number;
  }) => void;
}

function useDebouncedValue<T>(value: T, delay: number) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

function useCommunityFeed(params: {
  projectId?: string;
  authorId?: string;
  sort: 'recent' | 'popular' | 'trending';
  categories: string[];
  search: string;
}) {
  const { projectId, authorId, sort, categories, search } = params;
  const effectiveCategories = categories.length ? categories : ['all'];

  return useInfiniteQuery<CommunityFeedResponse>({
    queryKey: [
      'community',
      {
        projectId: projectId ?? null,
        authorId: authorId ?? null,
        sort,
        categories: effectiveCategories,
        search
      }
    ],
    queryFn: async ({ pageParam }) => {
      const query = new URLSearchParams();
      query.set('sort', sort);
      query.set('limit', String(PAGE_SIZE));

      if (projectId) {
        query.set('projectId', projectId);
      }

      if (authorId) {
        query.set('authorId', authorId);
      }

      const hasNonAllCategories = effectiveCategories.some((category) => category !== 'all');
      if (hasNonAllCategories) {
        effectiveCategories
          .filter((category) => category !== 'all')
          .forEach((category) => {
            query.append('category', category);
          });
      }

      if (search) {
        query.set('search', search);
      }

      if (typeof pageParam === 'string' && pageParam.length > 0) {
        query.set('cursor', pageParam);
      }

      const res = await fetch(`/api/community?${query.toString()}`);
      if (!res.ok) {
        throw new Error('커뮤니티 게시글을 불러오지 못했습니다.');
      }

      const json = (await res.json()) as CommunityFeedResponse;
      return {
        ...json,
        posts: json.posts.map((post) => ({
          ...post,
          liked: post.liked ?? false
        }))
      } satisfies CommunityFeedResponse;
    },
    getNextPageParam: (lastPage) => lastPage.meta.nextCursor,
    initialPageParam: undefined,
    staleTime: 30_000,
    gcTime: 5 * 60_000
  });
}

function useOptionalRouter(): ReturnType<typeof useRouter> | null {
  try {
    return useRouter();
  } catch (error) {
    if (process.env.NODE_ENV !== 'test') {
      throw error;
    }

    return null;
  }
}

export function CommunityBoard({ projectId, authorId, readOnly = false, onMetaChange }: CommunityBoardProps) {
  const { t } = useTranslation();
  const router = useOptionalRouter();
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const [sort, setSort] = useState<(typeof SORT_OPTIONS)[number]>('recent');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['all']);
  const [searchValue, setSearchValue] = useState('');
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const debouncedSearch = useDebouncedValue(searchValue, 250);

  const effectiveCategories = selectedCategories.includes('all') && selectedCategories.length > 1
    ? selectedCategories.filter((category) => category !== 'all')
    : selectedCategories;
  const categoriesForQuery = effectiveCategories.includes('all') ? ['all'] : effectiveCategories;
  
  // 글쓰기 버튼 클릭 핸들러
  const handleCreatePost = () => {
    if (!session) {
      // 로그인되지 않은 경우 로그인 페이지로 리다이렉트
      signIn(undefined, { callbackUrl: '/community' });
      return;
    }
    // 로그인된 경우 컴포저 모달 열기
    setIsComposerOpen(true);
  };

  // 게시글 작성 핸들러
  const handleSubmitPost = async (data: {
    content: string;
    images: string[];
    attachments: AttachmentMetadata[];
    linkPreviews: LinkPreviewMetadata[];
    category: string;
  }) => {
    if (!session?.user?.id) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/community', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: '', // Threads 스타일에서는 제목 없음
          content: data.content,
          category: data.category.toUpperCase(),
          images: data.images,
          attachments: data.attachments,
          linkPreviews: data.linkPreviews
        })
      });

      if (response.ok) {
        // 성공 시 피드 새로고침
        await queryClient.invalidateQueries({
          queryKey: ['community']
        });
        setIsComposerOpen(false);
      } else {
        throw new Error('Failed to create post');
      }
    } catch (error) {
      console.error('Failed to create post:', error);
      alert('게시글 작성에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } = useCommunityFeed({
    projectId,
    authorId,
    sort,
    categories: categoriesForQuery,
    search: debouncedSearch
  });

  const firstPage = useMemo(() => data?.pages[0], [data?.pages]);

  useEffect(() => {
    if (!onMetaChange || !firstPage) {
      return;
    }

    onMetaChange({
      pinned: firstPage.pinned,
      popular: firstPage.popular,
      total: firstPage.meta.total
    });
  }, [firstPage, onMetaChange]);

  const posts = useMemo(
    () => data?.pages.flatMap((page) => page.posts) ?? [],
    [data?.pages]
  );

  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!loadMoreRef.current) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(loadMoreRef.current);

    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const toggleLikeMutation = useMutation({
    mutationFn: async (postId: string) => {
      const response = await fetch(`/api/community/${postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggleLike' })
      });

      if (!response.ok) {
        throw new Error('좋아요를 변경하지 못했습니다.');
      }

      return response.json();
    },
    onMutate: async (postId) => {
      await queryClient.cancelQueries({
        queryKey: [
          'community',
          {
            projectId: projectId ?? null,
            authorId: authorId ?? null,
            sort,
            categories: categoriesForQuery,
            search: debouncedSearch
          }
        ]
      });

      const previousData = queryClient.getQueryData<InfiniteData<CommunityFeedResponse>>([
        'community',
        {
          projectId: projectId ?? null,
          authorId: authorId ?? null,
          sort,
          categories: categoriesForQuery,
          search: debouncedSearch
        }
      ]);

      if (previousData) {
        queryClient.setQueryData<InfiniteData<CommunityFeedResponse>>(
          [
            'community',
            {
              projectId: projectId ?? null,
              authorId: authorId ?? null,
              sort,
              categories: categoriesForQuery,
              search: debouncedSearch
            }
          ],
          {
            ...previousData,
            pages: previousData.pages.map((page) => ({
              ...page,
              posts: page.posts.map((post) =>
                post.id === postId
                  ? {
                      ...post,
                      liked: !post.liked,
                      likes: post.liked ? post.likes - 1 : post.likes + 1
                    }
                  : post
              )
            }))
          }
        );
      }

      return { previousData };
    },
    onError: (err, postId, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(
          [
            'community',
            {
              projectId: projectId ?? null,
              authorId: authorId ?? null,
              sort,
              categories: categoriesForQuery,
              search: debouncedSearch
            }
          ],
          context.previousData
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: [
          'community',
          {
            projectId: projectId ?? null,
            authorId: authorId ?? null,
            sort,
            categories: categoriesForQuery,
            search: debouncedSearch
          }
        ]
      });
    }
  });

  const handleToggleCategory = useCallback((category: string) => {
    setSelectedCategories((prev) => {
      if (category === 'all') {
        return ['all'];
      }

      const withoutAll = prev.filter((item) => item !== 'all');
      if (withoutAll.includes(category)) {
        const next = withoutAll.filter((item) => item !== category);
        return next.length ? next : ['all'];
      }

      return [...withoutAll, category];
    });
  }, []);

  return (
    <section className="space-y-6">
      {/* Header with floating action button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white">커뮤니티</h2>
          <p className="text-white/60 text-sm">아티스트들과 소통하고 협업하세요</p>
        </div>
        
        {!readOnly && (
          <button
            onClick={handleCreatePost}
            className="flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 shadow-lg"
          >
            <Plus className="h-4 w-4" />
            새 게시글
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {CATEGORY_OPTIONS.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => handleToggleCategory(category)}
            className={clsx(
              'rounded-full px-4 py-2 text-sm font-medium transition',
              selectedCategories.includes(category)
                ? 'bg-primary text-primary-foreground'
                : 'bg-white/5 text-white/60 hover:bg-white/10'
            )}
          >
            {t(`community.categories.${category}`)}
          </button>
        ))}
      </div>

      {/* Search and Sort */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder={t('community.searchPlaceholder') ?? ''}
            className="w-full rounded-full border border-white/10 bg-neutral-950/60 py-2 pl-10 pr-4 text-sm text-white placeholder:text-white/50 focus:border-primary focus:outline-none"
          />
        </div>

        <div className="flex gap-2">
          {SORT_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setSort(option)}
              className={clsx(
                'rounded-full px-4 py-2 text-sm font-medium transition',
                sort === option
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-white/5 text-white/60 hover:bg-white/10'
              )}
            >
              {t(`community.sort.${option}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Posts Feed */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="animate-pulse">
                <div className="h-4 w-3/4 rounded bg-white/10" />
                <div className="mt-2 h-3 w-1/2 rounded bg-white/10" />
                <div className="mt-4 h-20 w-full rounded bg-white/10" />
              </div>
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 text-center">
          <p className="text-red-300">{t('community.error.loading')}</p>
        </div>
      ) : (
        <div className="space-y-1">
          {posts && posts.length > 0 ? posts.map((post, index) => (
            <ThreadsPostCard
              key={post.id}
              post={post}
              onToggleLike={() => toggleLikeMutation.mutate(post.id)}
              isLiking={toggleLikeMutation.isPending}
              showThreadLine={index < posts.length - 1}
            />
          )) : (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
              <p className="text-white/60">{t('community.noPosts')}</p>
            </div>
          )}

          {hasNextPage && (
            <div ref={loadMoreRef} className="flex justify-center py-8">
              {isFetchingNextPage ? (
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-primary" />
              ) : (
                <button
                  onClick={() => fetchNextPage()}
                  className="rounded-full bg-white/5 px-4 py-2 text-sm text-white/60 transition hover:bg-white/10"
                >
                  {t('community.loadMore')}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Composer Modal */}
      <ThreadsComposer
        isOpen={isComposerOpen}
        onClose={() => setIsComposerOpen(false)}
        onSubmit={handleSubmitPost}
        isSubmitting={isSubmitting}
      />
    </section>
  );
}
