'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { QueryKey } from '@tanstack/react-query';
import { ArrowRight, Heart, MessageCircle, Search, Sparkles, Eye } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { signIn, useSession } from 'next-auth/react';
import clsx from 'clsx';

import type { CommunityFeedResponse, CommunityPost } from '@/lib/data/community';
import { Pagination, PaginationInfo } from '@/components/ui/pagination';

const CATEGORY_OPTIONS = [
  'all',
  'music',
  'art',
  'literature',
  'performance',
  'photo'
] as const;

const SORT_OPTIONS = ['recent', 'popular', 'trending'] as const;

const PAGE_SIZE = 10;

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
  page: number;
}) {
  const { projectId, authorId, sort, categories, search, page } = params;
  const effectiveCategories = categories.length ? categories : ['all'];

  return useQuery<CommunityFeedResponse>({
    queryKey: [
      'community',
      {
        projectId: projectId ?? null,
        authorId: authorId ?? null,
        sort,
        categories: effectiveCategories.sort(), // 정렬하여 안정성 확보
        search,
        page
      }
    ],
    queryFn: async () => {
      const query = new URLSearchParams();
      query.set('sort', sort);
      query.set('limit', String(PAGE_SIZE));
      query.set('page', String(page));

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
  const [currentPage, setCurrentPage] = useState(1);
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
    search: debouncedSearch,
    page: currentPage
  }), [projectId, authorId, sort, categoriesForQuery, debouncedSearch, currentPage]);

  const { data, isLoading, isError } = useCommunityFeed(feedParams);

  const totalCount = data?.meta.total ?? 0;
  const metaPinned = data?.pinned ?? [];
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

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
    if (!data) {
      return;
    }

    handleMetaChange({
      pinned: data.pinned,
      popular: data.popular,
      total: data.meta.total
    });
  }, [data, handleMetaChange]);

  const posts = data?.posts ?? [];

  // 페이지 변경 시 첫 페이지로 리셋
  useEffect(() => {
    setCurrentPage(1);
  }, [sort, selectedCategories, debouncedSearch]);

  const toggleLikeMutation = useMutation<CommunityPost, Error, { postId: string; like: boolean }, { previous?: CommunityFeedResponse; queryKey: QueryKey }>({
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
          search: debouncedSearch,
          page: currentPage
        }
      ];

      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<CommunityFeedResponse>(queryKey);

      queryClient.setQueryData<CommunityFeedResponse>(queryKey, (current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          posts: current.posts.map((post) => {
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
          search: debouncedSearch,
          page: currentPage
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
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-3">
        {/* 검색창 */}
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

        {/* 정렬 버튼 */}
        <select
          value={sort}
          onChange={(event) => setSort(event.target.value as typeof SORT_OPTIONS[number])}
          className="rounded-full border border-white/10 bg-white/5 px-5 py-2 text-sm text-white focus:border-primary focus:outline-none cursor-pointer"
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

        {/* 글쓰기 버튼 */}
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

      <div className="divide-y divide-white/10 rounded-2xl border border-white/10 bg-white/5 px-6">
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

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="mt-8 space-y-4">
          <div className="flex items-center justify-between">
            <PaginationInfo
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalCount}
              itemsPerPage={PAGE_SIZE}
            />
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>
      )}
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

  // 클라이언트 전용 날짜 포맷팅으로 hydration mismatch 방지
  const [formattedDate, setFormattedDate] = useState<string>('');

  useEffect(() => {
    if (post.createdAt) {
      const date = new Date(post.createdAt);
      setFormattedDate(date.toLocaleDateString('ko-KR', {
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }));
    }
  }, [post.createdAt]);

  return (
    <div className="group -mx-6 px-6 transition hover:bg-white/5">
      <article className="border-b border-white/10 py-4">
        <div className="flex items-start justify-between gap-4">
        {/* 좌측: 카테고리 + 제목 + 내용 */}
        <div className="flex-1 space-y-2">
          {/* 카테고리 + 배지 */}
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-semibold text-white/80">
              {displayCategory}
            </span>
            {post.isPinned ? (
              <span className="rounded-full bg-primary/20 px-2 py-0.5 text-xs font-semibold text-primary">
                {t('community.badges.pinned')}
              </span>
            ) : null}
            {post.isTrending ? (
              <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-xs font-semibold text-red-400">
                {t('community.badges.hot')}
              </span>
            ) : null}
          </div>

          {/* 제목 + 내용 */}
          <Link href={`/community/${post.id}`} className="block space-y-1">
            <h3 className="text-base font-semibold text-white transition group-hover:text-primary line-clamp-1">
              {post.title}
            </h3>
            <p className="text-sm text-white/60 line-clamp-2">{post.content}</p>
          </Link>

          {/* 작성자 + 날짜 */}
          <div className="flex items-center gap-2 text-xs text-white/50">
            <span className="font-medium text-white/70">{authorName}</span>
            <span>•</span>
            <span>{formattedDate}</span>
          </div>
        </div>

        {/* 우측: 통계 */}
        <div className="flex flex-col items-end gap-2 text-xs text-white/60">
          <div className="flex items-center gap-1">
            <Heart className="h-3.5 w-3.5" />
            <span>{post.likes || 0}</span>
          </div>
          <div className="flex items-center gap-1">
            <MessageCircle className="h-3.5 w-3.5" />
            <span>{post.comments || 0}</span>
          </div>
          <div className="flex items-center gap-1">
            <Eye className="h-3.5 w-3.5" />
            <span>{post.views || 0}</span>
          </div>
        </div>
        </div>
      </article>
    </div>
  );
}

export { CommunityPostCard };
