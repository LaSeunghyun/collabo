'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { InfiniteData, QueryKey } from '@tanstack/react-query';
import { ArrowRight, Heart, MessageCircle, Search, Sparkles, UserCircle2, Eye } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { signIn, useSession } from 'next-auth/react';
import clsx from 'clsx';

import type { CommunityFeedResponse, CommunityPost } from '@/lib/data/community';

const CATEGORY_OPTIONS = [
  'all',
  'music',
  'art',
  'literature',
  'performance',
  'photo'
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
        categories: effectiveCategories.sort(), // 정렬하여 안정성 확보
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
        throw new Error('Failed to load community posts');
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
  const debouncedSearch = useDebouncedValue(searchValue, 250);

  const effectiveCategories = useMemo(() => {
    return selectedCategories.includes('all') && selectedCategories.length > 1
      ? selectedCategories.filter((category) => category !== 'all')
      : selectedCategories;
  }, [selectedCategories]);

  const categoriesForQuery = useMemo(() => {
    return effectiveCategories.includes('all') ? ['all'] : effectiveCategories;
  }, [effectiveCategories]);
  // 글쓰기 버튼 클릭 핸들러
  const handleCreatePost = () => {
    if (!session) {
      // 로그인되지 않은 경우 로그인 페이지로 리다이렉트
      signIn(undefined, { callbackUrl: '/community/new' });
      return;
    }
    // 로그인된 경우 글쓰기 페이지로 이동
    if (router) {
      router.push('/community/new');
      return;
    }

    if (typeof window !== 'undefined') {
      window.location.assign('/community/new');
    }
  };

  const feedParams = useMemo(() => ({
    projectId,
    authorId,
    sort,
    categories: categoriesForQuery,
    search: debouncedSearch
  }), [projectId, authorId, sort, categoriesForQuery, debouncedSearch]);

  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } = useCommunityFeed(feedParams);

  const firstPage = useMemo(() => data?.pages[0], [data?.pages]);
  const totalCount = firstPage?.meta.total ?? 0;
  const metaPinned = firstPage?.pinned ?? [];

  const handleMetaChange = useCallback((meta: {
    pinned: CommunityPost[];
    popular: CommunityPost[];
    total: number;
  }) => {
    if (onMetaChange) {
      onMetaChange(meta);
    }
  }, [onMetaChange]);

  useEffect(() => {
    if (!firstPage) {
      return;
    }

    handleMetaChange({
      pinned: firstPage.pinned,
      popular: firstPage.popular,
      total: firstPage.meta.total
    });
  }, [firstPage, handleMetaChange]);

  const posts = useMemo(
    () => data?.pages.flatMap((page) => page.posts) ?? [],
    [data?.pages]
  );

  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!loadMoreRef.current) {
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      const entry = entries[0];
      if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage().catch(() => {
          // handled by React Query error states
        });
      }
    });

    const node = loadMoreRef.current;
    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const toggleLikeMutation = useMutation<CommunityPost, Error, { postId: string; like: boolean }, { previous?: InfiniteData<CommunityFeedResponse>; queryKey: QueryKey }>({
    mutationFn: async ({ postId, like }) => {
      const res = await fetch(`/api/community/${postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: like ? 'like' : 'unlike' })
      });

      if (!res.ok) {
        throw new Error('Failed to toggle like');
      }

      return (await res.json()) as CommunityPost;
    },
    onMutate: async ({ postId, like }) => {
      const queryKey: QueryKey = [
        'community',
        {
          projectId: projectId ?? null,
          authorId: authorId ?? null,
          sort,
          categories: categoriesForQuery.sort(), // 정렬하여 안정성 확보
          search: debouncedSearch
        }
      ];

      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<InfiniteData<CommunityFeedResponse>>(queryKey);

      queryClient.setQueryData<InfiniteData<CommunityFeedResponse>>(queryKey, (current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          pages: current.pages.map((page) => ({
            ...page,
            posts: page.posts.map((post) => {
              if (post.id !== postId) {
                return post;
              }

              const delta = like ? 1 : -1;
              return {
                ...post,
                liked: like,
                likes: Math.max(0, post.likes + delta)
              };
            })
          }))
        };
      });

      return { previous, queryKey };
    },
    onError: (_error, _variables, context) => {
      if (!context?.previous) {
        return;
      }

      queryClient.setQueryData(context.queryKey, context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: [
          'community',
          {
            projectId: projectId ?? null,
            authorId: authorId ?? null,
            sort,
            categories: categoriesForQuery.sort(), // 정렬하여 안정성 확보
            search: debouncedSearch
          }
        ]
      });
    }
  });

  const handleCategoryToggle = useCallback((category: string) => {
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
      {/* 검색바, 정렬, 글쓰기 버튼을 한 행에 배치 */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder={t('community.searchPlaceholder') ?? ''}
              className="w-full rounded-full border border-white/10 bg-white/5 px-10 py-2 text-sm text-white placeholder:text-white/50 focus:border-primary focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/60">{t('community.sortRecent')}</span>
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as typeof SORT_OPTIONS[number])}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white focus:border-primary focus:outline-none"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option} value={option} className="bg-neutral-950">
                  {t(
                    option === 'trending'
                      ? 'community.sortTrending'
                      : option === 'popular'
                        ? 'community.sortPopular'
                        : 'community.sortRecent'
                  )}
                </option>
              ))}
            </select>
          </div>
        </div>
        {!readOnly ? (
          <button
            onClick={handleCreatePost}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
          >
            {t('community.actions.create')}
            <ArrowRight className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {/* 카테고리 탭 */}
      <div className="flex flex-wrap gap-2">
        {CATEGORY_OPTIONS.map((option) => {
          const isActive = selectedCategories.includes(option);
          return (
            <button
              key={option}
              type="button"
              onClick={() => handleCategoryToggle(option)}
              className={clsx(
                'rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-widest transition focus:outline-none focus:ring-2 focus:ring-primary/60 focus:ring-offset-0',
                isActive ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'bg-white/5 text-white/60 hover:bg-white/10'
              )}
            >
              {t(`community.filters.${option}`)}
            </button>
          );
        })}
      </div>

      {/* 게시글 수 표시 */}
      <div className="flex items-center gap-2 text-xs text-white/60">
        <span className="rounded-full bg-white/10 px-3 py-1 font-semibold uppercase tracking-[0.2em]">
          {t('community.labels.total', { count: totalCount })}
        </span>
        {effectiveCategories.length > 0 && !effectiveCategories.includes('all') ? (
          <span className="rounded-full bg-white/5 px-3 py-1">
            {t('community.labels.selectedCategories', { count: effectiveCategories.length })}
          </span>
        ) : null}
      </div>

      {metaPinned.length ? (
        <div className="rounded-3xl border border-primary/20 bg-primary/10 p-6">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-primary">
            <Sparkles className="h-4 w-4" />
            <span>{t('community.pinned.title')}</span>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {metaPinned.map((post) => (
              <Link
                key={post.id}
                href={`/community/${post.id}`}
                className="group rounded-2xl border border-primary/20 bg-neutral-950/60 p-4 transition hover:-translate-y-1 hover:border-primary hover:shadow-lg hover:shadow-primary/20"
              >
                <div className="flex items-center gap-3 text-xs uppercase tracking-[0.25em] text-primary">
                  <span>{t(`community.filters.${post.category}`)}</span>
                  <span>•</span>
                  <span>{t('community.badges.pinned')}</span>
                </div>
                <p className="mt-2 text-base font-semibold text-white">{post.title}</p>
                <p className="mt-1 text-sm text-white/70 line-clamp-2">{post.content}</p>
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      {isLoading ? (
        <p className="text-sm text-white/70">{t('common.loading')}</p>
      ) : null}
      {isError ? (
        <p className="text-sm text-red-400">{t('community.loadErrorMessage')}</p>
      ) : null}

      {!isLoading && posts.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-12 text-center">
          <Sparkles className="mx-auto h-10 w-10 text-white/30" />
          <h3 className="mt-4 text-lg font-semibold text-white">
            {t('community.emptyStateTitle')}
          </h3>
          <p className="mt-2 text-sm text-white/60">{t('community.emptyStateDescription')}</p>
          {!readOnly ? (
            <button
              onClick={handleCreatePost}
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            >
              {t('community.actions.create')}
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="space-y-4">
        {posts.map((post) => (
          <CommunityPostCard
            key={post.id}
            post={post}
            onToggleLike={(like) => {
              if (!session?.user) {
                signIn().catch(() => {
                  // ignore
                });
                return;
              }

              toggleLikeMutation.mutate({ postId: post.id, like });
            }}
          />
        ))}
      </div>

      <div ref={loadMoreRef} className="h-1" />

      {hasNextPage ? (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="rounded-full border border-white/10 px-6 py-2 text-sm text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isFetchingNextPage ? t('common.loading') : t('community.loadMore')}
          </button>
        </div>
      ) : null}
    </section>
  );
}

function CommunityPostCard({
  post
}: {
  post: CommunityPost;
  onToggleLike: (like: boolean) => void;
}) {
  const { t } = useTranslation();
  // const isLiked = Boolean(post.liked);
  // const likeLabel = t('community.likesLabel_other', { count: post.likes });
  // const commentLabel = t('community.commentsLabel_other', { count: post.comments });
  const displayCategory = t(`community.filters.${post.category}`);
  const authorName = post.author?.name ?? t('community.defaultGuestName');
  const createdAt = post.createdAt ? new Date(post.createdAt) : null;
  const formattedDate = createdAt
    ? createdAt.toLocaleDateString('ko-KR', {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
    : '';

  return (
    <article className="group rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-primary/60 hover:bg-white/10">
      <div className="space-y-3">
        {/* 상단: 프로필 아이콘 + 카테고리 + HOT 배지 */}
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
            <UserCircle2 className="h-5 w-5 text-white/70" />
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">
              {displayCategory}
            </span>
            {post.isPinned ? (
              <span className="rounded-full bg-primary/20 px-2 py-1 text-xs font-semibold text-primary">
                {t('community.badges.pinned')}
              </span>
            ) : null}
            {post.isTrending ? (
              <span className="rounded-full bg-red-500/20 px-2 py-1 text-xs font-semibold text-red-400">
                {t('community.badges.hot')}
              </span>
            ) : null}
          </div>
        </div>

        {/* 중단: 제목 + 내용 미리보기 */}
        <Link href={`/community/${post.id}`} className="block space-y-2">
          <h3 className="text-base font-semibold text-white transition group-hover:text-primary line-clamp-1">
            {post.title}
          </h3>
          <p className="text-sm text-white/70 line-clamp-2">{post.content}</p>
        </Link>

        {/* 하단: 메타 정보 + 작성자 정보 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs text-white/60">
            <div className="flex items-center gap-1">
              <Heart className="h-3 w-3" />
              <span>{post.likes || 0}</span>
            </div>
            <div className="flex items-center gap-1">
              <MessageCircle className="h-3 w-3" />
              <span>{post.comments || 0}</span>
            </div>
            <div className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              <span>{post.views || 0}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-white/60">
            <span className="font-semibold text-white">{authorName}</span>
            <span>•</span>
            <span>{formattedDate}</span>
          </div>
        </div>
      </div>
    </article>
  );
}

export { CommunityPostCard };
