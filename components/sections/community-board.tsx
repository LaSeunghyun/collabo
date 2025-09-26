'use client';

import { FormEvent, useMemo, useState } from 'react';
import {
  useMutation,
  useQuery,
  useQueryClient
} from '@tanstack/react-query';
import { Heart, Loader2, MessageCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import {
  demoCommunityPosts,
  type CommunityPost,
  type CommunityComment
} from '@/lib/data/community';

export function CommunityBoard({ projectId }: { projectId?: string }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [sort, setSort] = useState<'recent' | 'popular'>('recent');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});

  const currentUserId = 'demo-user';

  const normalizePost = (post: any): CommunityPost => {
    const rawComments = Array.isArray(post?.comments) ? post.comments : [];
    const normalizedComments: CommunityComment[] = rawComments.map((comment: any) => ({
      id: comment.id,
      content: comment.content,
      createdAt:
        typeof comment.createdAt === 'string'
          ? comment.createdAt
          : comment.createdAt?.toISOString?.() ?? undefined,
      author: comment.author
        ? {
            id: comment.author.id,
            name: comment.author.name,
            image: comment.author.image ?? null
          }
        : undefined
    }));

    const likedBy = Array.isArray(post?.likedBy)
      ? post.likedBy
      : Array.isArray(post?.likes)
        ? post.likes.map((like: any) =>
            typeof like === 'string' ? like : like?.userId ?? currentUserId
          )
        : [];

    return {
      id: post.id,
      title: post.title,
      content: post.content,
      likes: typeof post.likes === 'number' ? post.likes : post._count?.likes ?? likedBy.length ?? 0,
      commentsCount:
        typeof post.commentsCount === 'number'
          ? post.commentsCount
          : post._count?.comments ?? normalizedComments.length,
      projectId: post.projectId ?? undefined,
      createdAt:
        typeof post.createdAt === 'string'
          ? post.createdAt
          : post.createdAt?.toISOString?.(),
      author: post.author
        ? {
            id: post.author.id,
            name: post.author.name,
            image: post.author.image ?? null
          }
        : undefined,
      comments: normalizedComments,
      likedBy
    };
  };

  const { data: posts = [] } = useQuery<CommunityPost[]>({
    queryKey: ['community', projectId],
    queryFn: async () => {
      try {
        const params = projectId
          ? `?${new URLSearchParams({ projectId }).toString()}`
          : '';
        const res = await fetch(`/api/community${params}`);
        if (!res.ok) {
          throw new Error('Failed to fetch posts');
        }
        const json = await res.json();
        const list = Array.isArray(json) ? json : demoCommunityPosts;
        return list
          .filter((item) =>
            projectId ? item.projectId === projectId : true
          )
          .map(normalizePost);
      } catch (error) {
        console.error('[CommunityBoard] Failed to fetch posts', error);
        return demoCommunityPosts
          .filter((item) => (projectId ? item.projectId === projectId : true))
          .map(normalizePost);
      }
    }
  });

  const createPostMutation = useMutation<CommunityPost, Error, { title: string; content: string }>(
    {
      mutationFn: async ({ title: postTitle, content: postContent }) => {
        const res = await fetch('/api/community', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            title: postTitle,
            content: postContent,
            projectId,
            authorId: currentUserId
          })
        });

        if (!res.ok) {
          throw new Error('Failed to create community post');
        }

        return normalizePost(await res.json());
      },
      onSuccess: (newPost) => {
        queryClient.setQueryData<CommunityPost[]>(['community', projectId], (prev = []) => {
          if (projectId && newPost.projectId && newPost.projectId !== projectId) {
            return prev;
          }
          return [newPost, ...prev];
        });
        setTitle('');
        setContent('');
      }
    }
  );

  const commentMutation = useMutation<CommunityComment, Error, { postId: string; content: string }>(
    {
      mutationFn: async ({ postId, content }) => {
        const res = await fetch(`/api/community/${postId}/comments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            content,
            userId: currentUserId
          })
        });

        if (!res.ok) {
          throw new Error('Failed to add comment');
        }

        const comment = await res.json();
        return {
          id: comment.id,
          content: comment.content,
          createdAt: comment.createdAt,
          author: comment.author
            ? {
                id: comment.author.id,
                name: comment.author.name,
                image: comment.author.image ?? null
              }
            : undefined
        } satisfies CommunityComment;
      },
      onSuccess: (comment, { postId }) => {
        queryClient.setQueryData<CommunityPost[]>(['community', projectId], (prev = []) =>
          prev.map((post) =>
            post.id === postId
              ? {
                  ...post,
                  comments: [...post.comments, comment],
                  commentsCount: (post.commentsCount ?? post.comments.length) + 1
                }
              : post
          )
        );
        setCommentDrafts((prev) => ({ ...prev, [postId]: '' }));
      }
    }
  );

  const likeMutation = useMutation<
    { liked?: boolean; likes?: number },
    Error,
    { postId: string; nextLiked: boolean; nextLikes: number; currentLikes: number },
    { previousPosts?: CommunityPost[] }
  >({
    mutationFn: async ({ postId, nextLiked, nextLikes, currentLikes }) => {
      const res = await fetch(`/api/community/${postId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'toggleLike',
          userId: currentUserId,
          nextLiked,
          nextLikes,
          currentLikes
        })
      });

      if (!res.ok) {
        throw new Error('Failed to toggle like');
      }

      return res.json();
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: ['community', projectId] });
      const previousPosts = queryClient.getQueryData<CommunityPost[]>(['community', projectId]);

      queryClient.setQueryData<CommunityPost[]>(['community', projectId], (prev = []) =>
        prev.map((post) =>
          post.id === variables.postId
            ? {
                ...post,
                likes: variables.nextLikes,
                likedBy: variables.nextLiked
                  ? Array.from(new Set([...(post.likedBy ?? []), currentUserId]))
                  : (post.likedBy ?? []).filter((id) => id !== currentUserId)
              }
            : post
        )
      );

      return { previousPosts };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousPosts) {
        queryClient.setQueryData(['community', projectId], context.previousPosts);
      }
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData<CommunityPost[]>(['community', projectId], (prev = []) =>
        prev.map((post) => {
          if (post.id !== variables.postId) {
            return post;
          }

          const liked = data.liked ?? variables.nextLiked;
          const likes = typeof data.likes === 'number' ? data.likes : variables.nextLikes;

          return {
            ...post,
            likes,
            likedBy: liked
              ? Array.from(new Set([...(post.likedBy ?? []), currentUserId]))
              : (post.likedBy ?? []).filter((id) => id !== currentUserId)
          };
        })
      );
    }
  });

  const sorted = useMemo(() => {
    return [...posts].sort((a, b) => {
      if (sort === 'popular') {
        return b.likes - a.likes;
      }

      return (
        new Date(b.createdAt ?? Date.now()).valueOf() -
        new Date(a.createdAt ?? Date.now()).valueOf()
      );
    });
  }, [posts, sort]);

  const handleCreatePost = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim() || !content.trim()) {
      return;
    }
    createPostMutation.mutate({ title: title.trim(), content: content.trim() });
  };

  const handleCommentSubmit = (
    event: FormEvent<HTMLFormElement>,
    post: CommunityPost
  ) => {
    event.preventDefault();
    const draft = (commentDrafts[post.id] ?? '').trim();
    if (!draft) {
      return;
    }
    commentMutation.mutate({ postId: post.id, content: draft });
  };

  const handleToggleLike = (post: CommunityPost) => {
    const isLiked = (post.likedBy ?? []).includes(currentUserId);
    const nextLiked = !isLiked;
    const nextLikes = nextLiked
      ? post.likes + 1
      : Math.max(0, post.likes - 1);

    likeMutation.mutate({
      postId: post.id,
      nextLiked,
      nextLikes,
      currentLikes: post.likes
    });
  };

  return (
    <section className="space-y-6">
      <form
        onSubmit={handleCreatePost}
        className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_20px_40px_rgba(15,23,42,0.35)] backdrop-blur"
      >
        <div className="flex flex-col gap-4">
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder={t('community.titlePlaceholder', '제목을 입력하세요')}
            className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder={t('community.contentPlaceholder')}
            className="min-h-[120px] w-full resize-y rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <div className="flex items-center justify-end gap-3">
            <button
              type="submit"
              disabled={
                createPostMutation.isPending ||
                !title.trim() ||
                !content.trim()
              }
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/40"
            >
              {createPostMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              {t('community.post')}
            </button>
          </div>
        </div>
      </form>
      <div className="flex items-center gap-3">
        <button
          type="button"
          className={`rounded-full px-4 py-2 text-sm ${sort === 'recent' ? 'bg-primary text-primary-foreground' : 'bg-white/5 text-white/70'}`}
          onClick={() => setSort('recent')}
        >
          {t('community.sortRecent')}
        </button>
        <button
          type="button"
          className={`rounded-full px-4 py-2 text-sm ${sort === 'popular' ? 'bg-primary text-primary-foreground' : 'bg-white/5 text-white/70'}`}
          onClick={() => setSort('popular')}
        >
          {t('community.sortPopular')}
        </button>
      </div>
      <div className="space-y-4">
        {sorted.map((post) => (
          <article
            key={post.id}
            className="rounded-3xl border border-white/10 bg-white/5 p-6"
          >
            <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">{post.title}</h3>
                {post.author ? (
                  <p className="text-xs text-white/50">
                    {post.author.name}
                  </p>
                ) : null}
              </div>
              <div className="flex items-center gap-4 text-sm text-white/60">
                <button
                  type="button"
                  onClick={() => handleToggleLike(post)}
                  disabled={
                    likeMutation.isPending &&
                    likeMutation.variables?.postId === post.id
                  }
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1 transition ${
                    (post.likedBy ?? []).includes(currentUserId)
                      ? 'bg-primary/10 text-primary'
                      : 'bg-white/5 text-white/70 hover:bg-white/10'
                  } disabled:cursor-not-allowed disabled:opacity-60`}
                >
                  <Heart
                    className="h-4 w-4"
                    fill={
                      (post.likedBy ?? []).includes(currentUserId)
                        ? 'currentColor'
                        : 'none'
                    }
                  />
                  {post.likes}
                </button>
                <span className="inline-flex items-center gap-1">
                  <MessageCircle className="h-4 w-4" />
                  {post.commentsCount ?? post.comments.length}
                </span>
              </div>
            </header>
            <p className="mt-3 text-sm text-white/70 whitespace-pre-wrap">{post.content}</p>

            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-white/40">
                <span>
                  {t('community.commentsLabel', '댓글')} ·{' '}
                  {post.commentsCount ?? post.comments.length}
                </span>
                <span className="text-white/30">
                  {new Date(post.createdAt ?? Date.now()).toLocaleString()}
                </span>
              </div>
              <ul className="space-y-3">
                {post.comments.length > 0 ? (
                  post.comments.map((comment) => (
                    <li
                      key={comment.id}
                      className="rounded-2xl border border-white/5 bg-black/30 p-4"
                    >
                      <div className="flex items-center justify-between text-xs text-white/50">
                        <span>{comment.author?.name ?? t('community.anonymous', '익명')}</span>
                        <span>
                          {comment.createdAt
                            ? new Date(comment.createdAt).toLocaleString()
                            : ''}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-white/80 whitespace-pre-wrap">
                        {comment.content}
                      </p>
                    </li>
                  ))
                ) : (
                  <li className="rounded-2xl border border-white/5 bg-black/30 p-4 text-sm text-white/50">
                    {t('community.emptyComments', '첫 번째 댓글을 남겨보세요.')} 
                  </li>
                )}
              </ul>
              <form
                onSubmit={(event) => handleCommentSubmit(event, post)}
                className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/30 p-4"
              >
                <textarea
                  value={commentDrafts[post.id] ?? ''}
                  onChange={(event) =>
                    setCommentDrafts((prev) => ({
                      ...prev,
                      [post.id]: event.target.value
                    }))
                  }
                  placeholder={t('community.commentPlaceholder')}
                  className="min-h-[80px] w-full resize-y rounded-xl border border-white/10 bg-transparent px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={
                      commentMutation.isPending &&
                      commentMutation.variables?.postId === post.id
                        ? true
                        : !(commentDrafts[post.id] ?? '').trim()
                    }
                    className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white/80 transition hover:bg-white/20 disabled:cursor-not-allowed disabled:text-white/30"
                  >
                    {commentMutation.isPending &&
                    commentMutation.variables?.postId === post.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : null}
                    {t('community.commentSubmit', '댓글 달기')}
                  </button>
                </div>
              </form>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
