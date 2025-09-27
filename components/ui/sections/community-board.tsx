'use client';

import { useMemo, useState, type FormEvent, type ReactNode } from 'react';
import type { QueryKey } from '@tanstack/react-query';
import {
  useMutation,
  useQuery,
  useQueryClient
} from '@tanstack/react-query';
import { Heart, MessageCircle, SendHorizontal } from 'lucide-react';
// import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { signIn, useSession } from 'next-auth/react';

import type { CommunityComment, CommunityPost } from '@/lib/data/community';

interface PostFormValues {
  title: string;
  content: string;
}

interface CommentFormValues {
  content: string;
}

type CommunityPostFilters = {
  projectId?: string;
  authorId?: string;
};

function useCommunityPosts(filters: CommunityPostFilters, sort: 'recent' | 'popular') {
  const { projectId, authorId } = filters;
  return useQuery<CommunityPost[]>({
    queryKey: ['community', { projectId: projectId ?? null, authorId: authorId ?? null, sort }],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('sort', sort);
      if (projectId) {
        params.set('projectId', projectId);
      }
      if (authorId) {
        params.set('authorId', authorId);
      }

      const res = await fetch(`/api/community?${params.toString()}`);
      if (!res.ok) {
        throw new Error('Failed to load community posts');
      }

      const json = (await res.json()) as CommunityPost[];
      return json.map((post) => ({ ...post, liked: post.liked ?? false }));
    },
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

export function CommunityBoard({ projectId, authorId, readOnly = false }: CommunityPostFilters & { readOnly?: boolean }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [sort, setSort] = useState<'recent' | 'popular'>('recent');
  const {
    data: posts = [],
    isLoading,
    isError
  } = useCommunityPosts({ projectId, authorId }, sort);

  const [postForm, setPostForm] = useState<PostFormValues>({ title: '', content: '' });

  const createPostMutation = useMutation<CommunityPost, Error, PostFormValues>({
    mutationFn: async (values) => {
      const res = await fetch('/api/community', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, projectId, authorId })
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
    previous: Array<readonly [QueryKey, CommunityPost[] | undefined]>;
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
      const queries = queryClient.getQueriesData<CommunityPost[]>({ queryKey: ['community'] });
      const previous = queries.map(([key, data]) => [key, data] as const);

      queries.forEach(([key, data]) => {
        if (!data) return;
        const updated = data.map((post) =>
          post.id === postId
            ? {
              ...post,
              liked: like,
              likes: Math.max(0, post.likes + (like ? 1 : -1))
            }
            : post
        );
        queryClient.setQueryData(key, updated);
      });

      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (!context) return;
      context.previous.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
    },
    onSuccess: (updatedPost) => {
      const queries = queryClient.getQueriesData<CommunityPost[]>({ queryKey: ['community'] });
      queries.forEach(([key, data]) => {
        if (!data) return;
        const next = data.map((post) => (post.id === updatedPost.id ? { ...post, ...updatedPost } : post));
        queryClient.setQueryData(key, next);
      });
    }
  });

  const handleCreatePost = () => {
    if (!postForm.title.trim() || !postForm.content.trim()) {
      return;
    }
    createPostMutation.mutate(postForm);
  };

  const sortButtons = useMemo(
    () => [
      { id: 'recent' as const, label: t('community.sortRecent') },
      { id: 'popular' as const, label: t('community.sortPopular') }
    ],
    [t]
  );

  return (
    <section className="space-y-8">
      {readOnly ? null : (
        <form
          onSubmit={handleCreatePost}
          className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-black/20"
        >
          <div className="flex flex-col gap-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-white/70" htmlFor="community-post-title">
                {t('community.newPostTitleLabel')}
              </label>
              <input
                id="community-post-title"
                type="text"
                placeholder={t('community.newPostTitlePlaceholder')}
                className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                value={postForm.title}
                onChange={(e) => setPostForm((prev) => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-white/70" htmlFor="community-post-content">
                {t('community.newPostContentLabel')}
              </label>
              <textarea
                id="community-post-content"
                placeholder={t('community.writePlaceholder')}
                className="min-h-[120px] w-full resize-y rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                value={postForm.content}
                onChange={(e) => setPostForm((prev) => ({ ...prev, content: e.target.value }))}
              />
            </div>
            <div className="flex items-center justify-end gap-3">
              {createPostMutation.isError ? (
                <p className="text-sm text-red-400">{t('community.postErrorMessage')}</p>
              ) : null}
              <button
                type="submit"
                disabled={createPostMutation.isPending}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {createPostMutation.isPending ? t('common.loading') : t('community.post')}
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="flex flex-wrap items-center gap-3">
        {sortButtons.map((option) => {
          const isActive = sort === option.id;
          return (
            <button
              key={option.id}
              type="button"
              className={`rounded-full px-4 py-2 text-sm transition ${isActive ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30' : 'bg-white/5 text-white/70 hover:bg-white/10'
                }`}
              onClick={() => setSort(option.id)}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      {isLoading ? <p className="text-sm text-white/70">{t('common.loading')}</p> : null}
      {isError ? <p className="text-sm text-red-400">{t('community.loadErrorMessage')}</p> : null}

      <div className="space-y-6">
        {posts.map((post) => (
          <CommunityPostCard
            key={post.id}
            post={post}
            onToggleLike={(like) => toggleLikeMutation.mutate({ postId: post.id, like })}
          />
        ))}
      </div>
    </section>
  );
}

export interface CommunityPostCardProps {
  post: CommunityPost;
  onToggleLike: (like: boolean) => void;
  children?: ReactNode;
}

export function CommunityPostCard({
  post,
  onToggleLike,
  children
}: CommunityPostCardProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const isAuthenticated = Boolean(session?.user);
  const commentAuthorName = session?.user?.name ?? t('community.defaultGuestName');
  const {
    data: comments = [],
    isLoading,
    isError
  } = useCommunityComments(post.id);
  const [commentForm, setCommentForm] = useState<CommentFormValues>({ content: '' });

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
      queryClient.invalidateQueries({ queryKey: ['community', 'comments', post.id] });
      queryClient.invalidateQueries({ queryKey: ['community'] });
    }
  });

  const handleAddComment = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isAuthenticated) {
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

  const isLiked = post.liked ?? false;

  return (
    <article className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-black/20">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">{post.title}</h3>
          <p className="mt-2 text-sm text-white/70">{post.content}</p>
        </div>
        <div className="flex items-center gap-4 text-sm text-white/70">
          <button
            type="button"
            onClick={() => onToggleLike(!isLiked)}
            aria-pressed={isLiked}
            className={`inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 transition ${isLiked ? 'bg-primary/20 text-primary' : 'bg-white/5 hover:bg-white/10'
              }`}
          >
            <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} aria-hidden="true" />
            <span>{t('community.likesLabel', { count: post.likes })}</span>
          </button>
          <span className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2">
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            {t('community.commentsLabel', { count: post.comments })}
          </span>
        </div>
      </header>

      {children ? <div className="mt-4 space-y-3">{children}</div> : null}

      <section className="mt-6 space-y-4">
        <h4 className="text-sm font-semibold text-white/80">{t('community.commentsSectionTitle')}</h4>
        {isLoading ? (
          <p className="text-sm text-white/60">{t('community.commentLoading')}</p>
        ) : isError ? (
          <p className="text-sm text-red-400">{t('community.commentLoadErrorMessage')}</p>
        ) : comments.length === 0 ? (
          <p className="text-sm text-white/50">{t('community.noComments')}</p>
        ) : (
          <ul className="space-y-3">
            {comments.map((comment) => (
              <li key={comment.id} className="rounded-2xl bg-black/20 p-4 text-sm text-white/80">
                <div className="flex items-center justify-between text-xs text-white/40">
                  <span>{comment.authorName}</span>
                  {comment.createdAt ? (
                    <time dateTime={comment.createdAt}>
                      {new Date(comment.createdAt).toLocaleString()}
                    </time>
                  ) : null}
                </div>
                <p className="mt-2 text-white/80">{comment.content}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <form onSubmit={handleAddComment} className="mt-6 space-y-4">
        {isAuthenticated ? (
          <p className="rounded-2xl border border-white/10 bg-black/30 px-4 py-2 text-sm text-white/70">
            {t('community.commentUserLabel', { name: commentAuthorName })}
          </p>
        ) : null}
        <div className="flex flex-col gap-3">
          <textarea
            placeholder={t('community.commentPlaceholder')}
            className="min-h-[80px] w-full resize-y rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
            value={commentForm.content}
            onChange={(e) => setCommentForm({ content: e.target.value })}
            disabled={!isAuthenticated || addCommentMutation.isPending}
          />
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {!isAuthenticated ? (
            <div className="flex flex-col items-start gap-2 rounded-2xl border border-dashed border-white/20 bg-black/10 px-4 py-3 text-left text-sm text-white/70 sm:flex-row sm:items-center">
              <p>{t('community.commentLoginPrompt')}</p>
              <button
                type="button"
                onClick={() => signIn()}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90"
              >
                {t('actions.login')}
              </button>
            </div>
          ) : null}
          <div className="flex items-center justify-end gap-3">
            {addCommentMutation.isError ? (
              <p className="text-sm text-red-400">{t('community.commentErrorMessage')}</p>
            ) : null}
            <button
              type="submit"
              disabled={!isAuthenticated || addCommentMutation.isPending}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <SendHorizontal className="h-4 w-4" aria-hidden="true" />
              {addCommentMutation.isPending
                ? t('community.commentSubmitting')
                : t('community.commentSubmit')}
            </button>
          </div>
        </div>
      </form>
    </article>
  );
}
