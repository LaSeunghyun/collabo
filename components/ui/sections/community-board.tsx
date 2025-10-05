'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { InfiniteData, QueryKey } from '@tanstack/react-query';
import { ArrowRight, Heart, MessageCircle, Search, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { signIn, useSession } from 'next-auth/react';
import clsx from 'clsx';

import type { CommunityFeedResponse, CommunityPost } from '@/lib/data/community';

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

  const effectiveCategories = selectedCategories.includes('all') && selectedCategories.length > 1
    ? selectedCategories.filter((category) => category !== 'all')
    : selectedCategories;
  const categoriesForQuery = effectiveCategories.includes('all') ? ['all'] : effectiveCategories;
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

  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } = useCommunityFeed({
    projectId,
    authorId,
    sort,
    categories: categoriesForQuery,
    search: debouncedSearch
  });

  const firstPage = useMemo(() => data?.pages[0], [data?.pages]);
  const totalCount = firstPage?.meta.total ?? 0;
  const metaPinned = firstPage?.pinned ?? [];

  useEffect(() => {
    if (!onMetaChange || !firstPage) {
      return;
    }

    onMetaChange({
      pinned: firstPage.pinned,
      popular: firstPage.popular,
      total: firstPage.meta.total
    });
  }, [firstPage]); // onMetaChange 제거

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
          categories: categoriesForQuery,
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
            categories: categoriesForQuery,
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
    <section className="space-y-8">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/50">
              {t('community.title')}
            </p>
            <h2 className="mt-1 text-2xl font-semibold text-white">
              {t('community.description')}
            </h2>
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

        <div className="mt-6 flex flex-wrap gap-2">
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

        <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-2 text-xs text-white/60">
            <span className="rounded-full bg-white/10 px-3 py-1 font-semibold uppercase tracking-[0.2em]">
              {t('community.labels.total', { count: totalCount })}
            </span>
            <span className="hidden md:inline">•</span>
            <span>{t('community.labels.selectedCategories', { count: categoriesForQuery.length })}</span>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <div className="flex gap-2 rounded-full bg-white/5 p-1">
              {SORT_OPTIONS.map((option) => {
                const isActive = sort === option;
                return (
                  <button
                    key={option}
                    type="button"
                    className={clsx(
                      'rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] transition',
                      isActive ? 'bg-white text-neutral-900' : 'text-white/60 hover:text-white'
                    )}
                    onClick={() => setSort(option)}
                  >
                    {t(
                      option === 'trending'
                        ? 'community.sortTrending'
                        : option === 'popular'
                          ? 'community.sortPopular'
                          : 'community.sortRecent'
                    )}
                  </button>
                );
              })}
            </div>
            <div className="relative w-full min-w-[220px] sm:w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
              <input
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder={t('community.searchPlaceholder') ?? ''}
                className="w-full rounded-full border border-white/10 bg-neutral-950/60 py-2 pl-10 pr-4 text-sm text-white placeholder:text-white/50 focus:border-primary focus:outline-none"
              />
            </div>
        </div>
      </div>
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
  post,
  onToggleLike
}: {
  post: CommunityPost;
  onToggleLike: (like: boolean) => void;
}) {
  const { t } = useTranslation();
  const isLiked = Boolean(post.liked);
  const likeLabel = t('community.likesLabel_other', { count: post.likes });
  const commentLabel = t('community.commentsLabel_other', { count: post.comments });
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
    <article className="group rounded-3xl border border-white/10 bg-white/5 p-5 transition hover:border-primary/60 hover:bg-white/10">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.25em] text-white/50">
            <span className="rounded-full bg-white/10 px-3 py-1 text-white">
              {displayCategory}
            </span>
            {post.isPinned ? (
              <span className="rounded-full bg-primary/20 px-3 py-1 text-primary">
                {t('community.badges.pinned')}
              </span>
            ) : null}
            {post.isTrending ? (
              <span className="rounded-full bg-white/10 px-3 py-1 text-white">
                {t('community.badges.trending')}
              </span>
            ) : null}
            {formattedDate ? <span>{formattedDate}</span> : null}
          </div>
          <Link href={`/community/${post.id}`} className="space-y-2">
            <h3 className="text-lg font-semibold text-white transition group-hover:text-primary">
              {post.title}
            </h3>
            <p className="text-sm text-white/70 line-clamp-2">{post.content}</p>
          </Link>
          <div className="flex flex-wrap items-center gap-3 text-xs text-white/60">
            <span className="font-semibold text-white">{authorName}</span>
            <span>•</span>
            <span>{commentLabel}</span>
            <span>•</span>
            <span>{likeLabel}</span>
          </div>
        </div>
        <div className="flex flex-row items-center gap-3 md:flex-col md:items-end">
          <button
            type="button"
            onClick={() => onToggleLike(!isLiked)}
            className={clsx(
              'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition',
              isLiked
                ? 'border-primary/60 bg-primary/20 text-primary'
                : 'border-white/10 bg-white/5 text-white/80 hover:border-white/30 hover:bg-white/10'
            )}
          >
            <Heart className={clsx('h-4 w-4', isLiked ? 'fill-current' : undefined)} />
            <span>{likeLabel}</span>
          </button>
          <Link
            href={`/community/${post.id}`}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 transition hover:border-white/30 hover:bg-white/10"
          >
            <MessageCircle className="h-4 w-4" />
            <span>{t('community.actions.viewDetail')}</span>
          </Link>
        </div>
      </div>
    </article>
  );
}

export { CommunityPostCard };
