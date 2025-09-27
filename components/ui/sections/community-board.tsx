'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent
} from 'react';
import type { QueryKey, InfiniteData } from '@tanstack/react-query';
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient
} from '@tanstack/react-query';
import {
  Heart,
  MessageCircle,
  Search,
  Share2,
  Sparkles
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { signIn, useSession } from 'next-auth/react';

import type {
  CommunityComment,
  CommunityFeedResponse,
  CommunityPost
} from '@/lib/data/community';

const CATEGORY_OPTIONS = [
  'all',
  'notice',
  'general',
  'collab',
  'support',
  'showcase'
] as const;

const SORT_OPTIONS = ['recent', 'popular', 'trending'] as const;

const PAGE_SIZE = 10;

interface PostFormValues {
  title: string;
  content: string;
}

interface CommentFormValues {
  content: string;
}

interface MentionUser {
  id: string;
  name: string;
  avatarUrl?: string | null;
}

interface CommunityBoardProps {
  projectId?: string;
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
  sort: 'recent' | 'popular' | 'trending';
  category: string;
  search: string;
}) {
  const { projectId, sort, category, search } = params;

  return useInfiniteQuery<CommunityFeedResponse>({
    queryKey: [
      'community',
      {
        projectId: projectId ?? null,
        sort,
        category,
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
      if (category && category !== 'all') {
        query.set('category', category);
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
        posts: json.posts.map((post) => ({ ...post, liked: post.liked ?? false }))
      } satisfies CommunityFeedResponse;
    },
    getNextPageParam: (lastPage) => lastPage.meta.nextCursor,
    initialPageParam: undefined,
    staleTime: 30_000,
    gcTime: 5 * 60_000
  });
}

function useCommunityComments(postId: string) {
  return useQuery<CommunityComment[]>({
    queryKey: ['community', 'comments', postId],
    queryFn: async () => {
      const res = await fetch(`/api/community/${postId}/comments`);
      if (!res.ok) {
        throw new Error('Failed to load comments');
      }
      return (await res.json()) as CommunityComment[];
    },
    staleTime: 15_000,
    gcTime: 60_000
  });
}

export function CommunityBoard({ projectId, onMetaChange }: CommunityBoardProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [sort, setSort] = useState<(typeof SORT_OPTIONS)[number]>('recent');
  const [category, setCategory] = useState<(typeof CATEGORY_OPTIONS)[number]>('all');
  const [searchValue, setSearchValue] = useState('');
  const debouncedSearch = useDebouncedValue(searchValue, 250);

  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useCommunityFeed({ projectId, sort, category, search: debouncedSearch });

  useEffect(() => {
    if (!onMetaChange || !data?.pages.length) {
      return;
    }

    const firstPage = data.pages[0];
    onMetaChange({
      pinned: firstPage.pinned,
      popular: firstPage.popular,
      total: firstPage.meta.total
    });
  }, [data?.pages, onMetaChange]);

  const posts = useMemo(
    () => data?.pages.flatMap((page) => page.posts) ?? [],
    [data?.pages]
  );

  const [postForm, setPostForm] = useState<PostFormValues>({ title: '', content: '' });

  const createPostMutation = useMutation<CommunityPost, Error, PostFormValues>({
    mutationFn: async (values) => {
      const res = await fetch('/api/community', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          projectId,
          category: category === 'all' ? undefined : category
        })
      });

      if (!res.ok) {
        throw new Error('Failed to create post');
      }

      return (await res.json()) as CommunityPost;
    },
    onSuccess: () => {
      setPostForm({ title: '', content: '' });
      queryClient.invalidateQueries({ queryKey: ['community'] });
    }
  });

  type LikeMutationContext = {
    previous?: InfiniteData<CommunityFeedResponse>;
    queryKey: QueryKey;
  };

  const toggleLikeMutation = useMutation<
    CommunityPost,
    Error,
    { postId: string; like: boolean },
    LikeMutationContext
  >({
    mutationFn: async ({ postId, like }) => {
      const res = await fetch(`/api/community/${postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: like ? 'like' : 'unlike', liked: like })
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
          sort,
          category,
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
      queryClient.invalidateQueries({ queryKey: ['community'] });
    }
  });

  const handleSubmitPost = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedTitle = postForm.title.trim();
    const trimmedContent = postForm.content.trim();

    if (!trimmedTitle || !trimmedContent) {
      return;
    }

    createPostMutation.mutate({ title: trimmedTitle, content: trimmedContent });
  };

  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!loadMoreRef.current) {
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      const entry = entries[0];
      if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage().catch(() => {
          // fallback handled by React Query error state
        });
      }
    });

    const node = loadMoreRef.current;
    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  return (
    <section className="space-y-8">
      <form
        onSubmit={handleSubmitPost}
        className="space-y-6 rounded-3xl border border-white/10 bg-white/5 p-6"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">
              {t('community.title')}
            </h2>
            <p className="text-sm text-white/70">{t('community.description')}</p>
          </div>
          <div className="flex gap-3">
            {SORT_OPTIONS.map((option) => {
              const isActive = sort === option;
              return (
                <button
                  key={option}
                  type="button"
                  className={`rounded-full px-4 py-2 text-sm transition ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30'
                      : 'bg-white/5 text-white/70 hover:bg-white/10'
                  }`}
                  onClick={() => {
                    setSort(option);
                  }}
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
        </div>

        <div className="grid gap-4 lg:grid-cols-[2fr_3fr]">
          <div className="space-y-4">
            <label className="text-xs font-semibold uppercase tracking-widest text-white/60">
              {t('community.newPostTitleLabel')}
            </label>
            <input
              value={postForm.title}
              onChange={(event) =>
                setPostForm((prev) => ({ ...prev, title: event.target.value }))
              }
              placeholder={t('community.newPostTitlePlaceholder')}
              className="w-full rounded-2xl border border-white/10 bg-neutral-950/60 px-4 py-3 text-sm text-white placeholder:text-white/50 focus:border-primary focus:outline-none"
            />
          </div>
          <div className="space-y-4">
            <label className="text-xs font-semibold uppercase tracking-widest text-white/60">
              {t('community.newPostContentLabel')}
            </label>
            <textarea
              value={postForm.content}
              onChange={(event) =>
                setPostForm((prev) => ({ ...prev, content: event.target.value }))
              }
              placeholder={t('community.writePlaceholder')}
              className="h-32 w-full resize-none rounded-2xl border border-white/10 bg-neutral-950/60 px-4 py-3 text-sm text-white placeholder:text-white/50 focus:border-primary focus:outline-none"
            />
          </div>
        </div>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {CATEGORY_OPTIONS.map((option) => {
              const isActive = category === option;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setCategory(option)}
                  className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-widest transition ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-primary/30'
                      : 'bg-white/5 text-white/60 hover:bg-white/10'
                  }`}
                >
                  {t(`community.filters.${option}`)}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-3">
            <div className="relative w-full max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
              <input
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder={t('community.searchPlaceholder')}
                className="w-full rounded-full border border-white/10 bg-neutral-950/60 py-2 pl-10 pr-4 text-sm text-white placeholder:text-white/50 focus:border-primary focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={createPostMutation.isPending}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {createPostMutation.isPending ? t('common.loading') : t('community.post')}
            </button>
          </div>
        </div>

        {createPostMutation.isError ? (
          <p className="text-sm text-red-400">{t('community.postErrorMessage')}</p>
        ) : null}
      </form>

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
        </div>
      ) : null}

      <div className="space-y-6">
        {posts.map((post) => (
          <CommunityPostCard
            key={post.id}
            post={post}
            onToggleLike={(like) => toggleLikeMutation.mutate({ postId: post.id, like })}
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
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const isAuthenticated = Boolean(session?.user);
  const commentAuthorName = session?.user?.name ?? t('community.defaultGuestName');
  const { data: comments = [], isLoading, isError } = useCommunityComments(post.id);
  const [commentForm, setCommentForm] = useState<CommentFormValues>({ content: '' });
  const commentRef = useRef<HTMLTextAreaElement | null>(null);
  const [mentionQuery, setMentionQuery] = useState('');
  const debouncedMention = useDebouncedValue(mentionQuery, 250);

  const mentionSearch = useQuery<MentionUser[]>({
    queryKey: ['users', 'search', debouncedMention],
    queryFn: async () => {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(debouncedMention)}`);
      if (!res.ok) {
        throw new Error('Failed to search users');
      }
      return (await res.json()) as MentionUser[];
    },
    enabled: debouncedMention.length > 1
  });

  const addCommentMutation = useMutation<CommunityComment, Error, CommentFormValues>({
    mutationFn: async (values) => {
      const res = await fetch(`/api/community/${post.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      });

      if (!res.ok) {
        throw new Error('Failed to create comment');
      }

      return (await res.json()) as CommunityComment;
    },
    onSuccess: () => {
      setCommentForm({ content: '' });
      setMentionQuery('');
      queryClient.invalidateQueries({ queryKey: ['community', 'comments', post.id] });
      queryClient.invalidateQueries({ queryKey: ['community'] });
    }
  });

  const isLiked = post.liked ?? false;
  const shareUrl = useMemo(() => {
    if (typeof window === 'undefined') {
      return '';
    }
    const url = new URL(window.location.href);
    url.hash = '';
    url.searchParams.set('post', post.id);
    url.pathname = '/community';
    return url.toString();
  }, [post.id]);

  const [shareStatus, setShareStatus] = useState<'idle' | 'copied'>('idle');

  const handleShare = useCallback(async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: post.title,
          text: post.content,
          url: shareUrl
        });
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        setShareStatus('copied');
        window.setTimeout(() => setShareStatus('idle'), 2000);
      }
    } catch (error) {
      console.error('Failed to share post', error);
    }
  }, [post.title, post.content, shareUrl]);

  const handleAddComment = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isAuthenticated) {
      signIn().catch(() => {
        /* noop */
      });
      return;
    }

    const trimmedContent = commentForm.content.trim();
    if (!trimmedContent) {
      return;
    }

    addCommentMutation.mutate({
      content: trimmedContent
    });
  };

  const handleCommentChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    const value = event.target.value;
    setCommentForm({ content: value });

    const caret = event.target.selectionStart ?? value.length;
    const textBeforeCaret = value.slice(0, caret);
    const match = textBeforeCaret.match(/@([A-Za-z0-9가-힣_]{1,20})$/);
    if (match) {
      setMentionQuery(match[1]);
    } else {
      setMentionQuery('');
    }
  };

  const insertMention = (user: MentionUser) => {
    const textarea = commentRef.current;
    if (!textarea) {
      return;
    }

    const value = commentForm.content;
    const caret = textarea.selectionStart ?? value.length;
    const mentionStart = value.lastIndexOf('@', caret - 1);
    if (mentionStart === -1) {
      return;
    }

    const before = value.slice(0, mentionStart);
    const after = value.slice(caret);
    const mentionText = `@${user.name} `;
    const newValue = `${before}${mentionText}${after}`;
    setCommentForm({ content: newValue });
    setMentionQuery('');

    window.requestAnimationFrame(() => {
      textarea.focus();
      const nextCaret = before.length + mentionText.length;
      textarea.setSelectionRange(nextCaret, nextCaret);
    });
  };

  return (
    <article className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-black/20">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-white/60">
            <span>{t(`community.filters.${post.category}`)}</span>
            {post.isPinned ? (
              <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-semibold text-primary">
                {t('community.badges.pinned')}
              </span>
            ) : null}
            {post.isTrending ? (
              <span className="rounded-full bg-amber-200/20 px-2 py-0.5 text-[10px] font-semibold text-amber-200">
                {t('community.badges.trending')}
              </span>
            ) : null}
          </div>
          <h3 className="mt-2 text-lg font-semibold text-white">{post.title}</h3>
          <p className="mt-2 text-sm text-white/70">{post.content}</p>
        </div>
        <div className="flex items-center gap-4 text-sm text-white/70">
          <button
            type="button"
            onClick={() => onToggleLike(!isLiked)}
            aria-pressed={isLiked}
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 transition ${
              isLiked
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-white/10 bg-white/5 hover:bg-white/10'
            }`}
          >
            <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
            <span>{t('community.likesLabel_other', { count: post.likes })}</span>
          </button>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
            <MessageCircle className="h-4 w-4" />
            <span>{t('community.commentsLabel_other', { count: post.comments })}</span>
          </div>
          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-white/80 transition hover:bg-white/10"
          >
            <Share2 className="h-4 w-4" />
            <span>{shareStatus === 'copied' ? t('community.share.copied') : t('community.share.label')}</span>
          </button>
        </div>
      </header>

      <footer className="mt-6 space-y-4">
        <h4 className="text-sm font-semibold text-white/80">
          {t('community.commentsSectionTitle')}
        </h4>

        {isLoading ? (
          <p className="text-xs text-white/60">{t('community.commentLoading')}</p>
        ) : null}
        {isError ? (
          <p className="text-xs text-red-400">{t('community.commentLoadErrorMessage')}</p>
        ) : null}
        {!isLoading && !comments.length ? (
          <p className="text-xs text-white/60">{t('community.noComments')}</p>
        ) : null}

        <ul className="space-y-3">
          {comments.map((comment) => (
            <li key={comment.id} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80">
              <p className="font-semibold text-white">{comment.authorName}</p>
              <p className="mt-1 text-white/70">{comment.content}</p>
            </li>
          ))}
        </ul>

        <form onSubmit={handleAddComment} className="space-y-3">
          <textarea
            ref={commentRef}
            value={commentForm.content}
            onChange={handleCommentChange}
            disabled={!isAuthenticated}
            placeholder={t('community.commentPlaceholder')}
            className="h-24 w-full rounded-2xl border border-white/10 bg-neutral-950/60 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-primary focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
          />

          {mentionQuery && mentionSearch.data && mentionSearch.data.length > 0 ? (
            <div className="max-h-40 overflow-y-auto rounded-2xl border border-white/10 bg-neutral-900/90 p-3 text-sm text-white">
              <p className="mb-2 text-xs uppercase tracking-widest text-white/50">
                {t('community.mention.title')}
              </p>
              <ul className="space-y-2">
                {mentionSearch.data.map((user) => (
                  <li key={user.id}>
                    <button
                      type="button"
                      onClick={() => insertMention(user)}
                      className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition hover:bg-white/10"
                    >
                      <span>{user.name}</span>
                      <span className="text-xs text-white/40">@{user.name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {mentionQuery && mentionSearch.isFetched && (mentionSearch.data?.length ?? 0) === 0 ? (
            <div className="rounded-xl border border-white/10 bg-neutral-900/90 px-3 py-2 text-xs text-white/60">
              {t('community.mention.noResults')}
            </div>
          ) : null}

          {!isAuthenticated ? (
            <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
              <span>{t('community.commentLoginPrompt')}</span>
              <button
                type="button"
                className="rounded-full bg-primary px-4 py-1 text-sm font-semibold text-primary-foreground"
                onClick={() => signIn()}
              >
                {t('actions.login')}
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-xs text-white/50">
                {t('community.commentUserLabel', { name: commentAuthorName })}
              </span>
              <button
                type="submit"
                disabled={addCommentMutation.isPending}
                className="self-end rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {addCommentMutation.isPending
                  ? t('community.commentSubmitting')
                  : t('community.commentSubmit')}
              </button>
            </div>
          )}

          {addCommentMutation.isError ? (
            <p className="text-xs text-red-400">{t('community.commentErrorMessage')}</p>
          ) : null}
        </form>
      </footer>
    </article>
  );
}
