'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Flag, Heart, Loader2, MessageCircle, MinusCircle, UserCircle2, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSession } from 'next-auth/react';
import clsx from 'clsx';

import type { CommunityComment, CommunityFeedResponse, CommunityPost } from '@/lib/data/community';

function useCommunityPost(postId: string) {
  return useQuery({
    queryKey: ['community', 'detail', postId],
    queryFn: async () => {
      const res = await fetch(`/api/community/${postId}`);
      if (!res.ok) {
        throw new Error('Failed to load post');
      }
      return (await res.json()) as CommunityPost;
    },
    staleTime: 15_000
  });
}

function useCommunityComments(postId: string) {
  return useQuery({
    queryKey: ['community', 'comments', postId],
    queryFn: async () => {
      const res = await fetch(`/api/community/${postId}/comments`);
      if (!res.ok) {
        throw new Error('Failed to load comments');
      }
      return (await res.json()) as CommunityComment[];
    },
    staleTime: 15_000
  });
}

export default function CommunityPostDetailPage() {
  const params = useParams<{ id: string }>();
  const postId = params.id;
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const isAuthenticated = Boolean(session?.user);

  const { data: post, isLoading, isError } = useCommunityPost(postId);
  const { data: comments = [], isLoading: commentsLoading } = useCommunityComments(postId);

  const [dislikeActive, setDislikeActive] = useState(false);
  const [dislikeCount, setDislikeCount] = useState(0);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportStatus, setReportStatus] = useState<'idle' | 'submitted'>('idle');
  const [authorMenuOpen, setAuthorMenuOpen] = useState(false);
  const [showAuthorPosts, setShowAuthorPosts] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageDraft, setMessageDraft] = useState('');
  const [messages, setMessages] = useState<{ id: string; sender: 'me' | 'them'; content: string; createdAt: string }[]>([]);

  const commentInputRef = useRef<HTMLTextAreaElement | null>(null);
  const [commentValue, setCommentValue] = useState('');

  const toggleLikeMutation = useMutation({
    mutationFn: async (like: boolean) => {
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
    onSuccess: (updated) => {
      queryClient.setQueryData<CommunityPost>(['community', 'detail', postId], updated);
    }
  });

  const addCommentMutation = useMutation({
    mutationFn: async (value: string) => {
      const res = await fetch(`/api/community/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: value })
      });
      if (!res.ok) {
        throw new Error('Failed to add comment');
      }
      return (await res.json()) as CommunityComment;
    },
    onSuccess: (comment) => {
      queryClient.setQueryData<CommunityComment[]>(['community', 'comments', postId], (current = []) => [
        ...current,
        comment
      ]);
      setCommentValue('');
    }
  });

  const authorPostsQuery = useQuery({
    queryKey: ['community', 'author-posts', post?.author?.id],
    enabled: Boolean(post?.author?.id) && showAuthorPosts,
    queryFn: async () => {
      const query = new URLSearchParams();
      if (post?.author?.id) {
        query.set('authorId', post.author.id);
      }
      query.set('limit', '8');
      const res = await fetch(`/api/community?${query.toString()}`);
      if (!res.ok) {
        throw new Error('Failed to load author posts');
      }
      const data = (await res.json()) as CommunityFeedResponse;
      return data.posts;
    }
  });

  const messageIsValid = useMemo(() => messageDraft.trim().length > 0, [messageDraft]);

  const handleSendMessage = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!messageIsValid) {
      return;
    }

    const now = new Date().toISOString();
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), sender: 'me', content: messageDraft.trim(), createdAt: now }
    ]);
    setMessageDraft('');

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          sender: 'them',
          content: t('community.messages.autoReply'),
          createdAt: new Date().toISOString()
        }
      ]);
    }, 800);
  };

  useEffect(() => {
    if (typeof post?.dislikes === 'number') {
      setDislikeCount(post.dislikes);
    }
  }, [post?.dislikes]);

  useEffect(() => {
    if (!reportOpen) {
      setReportStatus('idle');
    }
  }, [reportOpen]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 pb-20">
        <div className="flex items-center gap-2 pt-16 text-sm text-white/70">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t('common.loading')}
        </div>
      </div>
    );
  }

  if (isError || !post) {
    return (
      <div className="mx-auto max-w-4xl px-4 pb-20">
        <div className="space-y-4 rounded-3xl border border-red-500/30 bg-red-500/10 p-8 text-white">
          <p className="text-lg font-semibold">{t('community.detail.errorTitle')}</p>
          <p className="text-sm text-white/70">{t('community.detail.errorDescription')}</p>
          <button
            type="button"
            onClick={() => router.push('/community')}
            className="rounded-full bg-white/10 px-4 py-2 text-sm transition hover:bg-white/20"
          >
            {t('community.actions.backToList')}
          </button>
        </div>
      </div>
    );
  }

  const likeLabel = t('community.likesLabel_other', { count: post.likes });
  const commentLabel = t('community.commentsLabel_other', { count: comments.length });
  const authorName = post.author?.name ?? t('community.defaultGuestName');
  const categoryLabel = t(`community.filters.${post.category}`);
  const createdAt = post.createdAt ? new Date(post.createdAt) : null;
  const formattedDate = createdAt
    ? createdAt.toLocaleString('ko-KR', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <div className="mx-auto max-w-4xl px-4 pb-24">
      <div className="flex items-center justify-between pt-10">
        <Link
          href="/community"
          className="inline-flex items-center gap-2 text-sm text-white/60 transition hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('community.actions.backToList')}
        </Link>
        <span className="text-xs uppercase tracking-[0.3em] text-white/50">{categoryLabel}</span>
      </div>

      <article className="mt-6 space-y-8 rounded-3xl border border-white/10 bg-white/5 p-8">
        <header className="space-y-3">
          <div className="flex items-center gap-3 text-sm text-white/60">
            <button
              type="button"
              onClick={() => setAuthorMenuOpen((prev) => !prev)}
              className="inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-1 text-white transition hover:border-white/40 hover:text-white"
            >
              <UserCircle2 className="h-4 w-4" />
              <span>{authorName}</span>
            </button>
            <span>•</span>
            <span>{formattedDate}</span>
          </div>
          <h1 className="text-3xl font-semibold text-white">{post.title}</h1>
          <p className="text-base leading-relaxed text-white/80 whitespace-pre-line">{post.content}</p>
        </header>

        <div className="flex flex-wrap gap-3 text-sm text-white/70">
          <button
            type="button"
            onClick={() => {
              if (!isAuthenticated) {
                router.push('/api/auth/signin');
                return;
              }
              toggleLikeMutation.mutate(!post.liked);
            }}
            className={clsx(
              'inline-flex items-center gap-2 rounded-full border px-4 py-2 transition',
              post.liked
                ? 'border-primary/60 bg-primary/20 text-primary'
                : 'border-white/10 bg-white/5 text-white/80 hover:border-white/30 hover:bg-white/10'
            )}
          >
            <Heart className={clsx('h-4 w-4', post.liked ? 'fill-current' : undefined)} />
            <span>{likeLabel}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setDislikeActive((prev) => {
                const next = !prev;
                setDislikeCount((count) => (next ? count + 1 : Math.max(0, count - 1)));
                return next;
              });
            }}
            className={clsx(
              'inline-flex items-center gap-2 rounded-full border px-4 py-2 transition',
              dislikeActive
                ? 'border-white/20 bg-white/20 text-white'
                : 'border-white/10 bg-white/5 text-white/80 hover:border-white/30 hover:bg-white/10'
            )}
          >
            <MinusCircle className="h-4 w-4" />
            <span>{t('community.detail.dislikeLabel', { count: dislikeCount })}</span>
          </button>
          <button
            type="button"
            onClick={() => setReportOpen(true)}
            className="inline-flex items-center gap-2 rounded-full border border-red-400/40 bg-red-500/10 px-4 py-2 text-sm text-red-200 transition hover:border-red-300/60 hover:text-red-100"
          >
            <Flag className="h-4 w-4" />
            <span>{t('community.detail.report')}</span>
          </button>
        </div>
      </article>

      <section className="mt-8 space-y-6 rounded-3xl border border-white/10 bg-white/5 p-8">
        <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">{t('community.commentsSectionTitle')}</h2>
            <p className="text-sm text-white/60">{commentLabel}</p>
          </div>
          <button
            type="button"
            onClick={() => commentInputRef.current?.focus()}
            className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm text-white/80 transition hover:border-white/40 hover:text-white"
          >
            <MessageCircle className="h-4 w-4" />
            <span>{t('community.detail.writeComment')}</span>
          </button>
        </header>

        <div className="space-y-4">
          {commentsLoading ? (
            <p className="text-sm text-white/60">{t('community.commentLoading')}</p>
          ) : null}
          {!commentsLoading && comments.length === 0 ? (
            <p className="text-sm text-white/60">{t('community.noComments')}</p>
          ) : null}
          <ul className="space-y-3">
            {comments.map((comment) => (
              <li key={comment.id} className="rounded-2xl border border-white/10 bg-neutral-950/60 px-4 py-3 text-sm text-white/80">
                <p className="font-semibold text-white">{comment.authorName}</p>
                <p className="mt-1 whitespace-pre-line text-white/70">{comment.content}</p>
              </li>
            ))}
          </ul>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (!isAuthenticated) {
              router.push('/api/auth/signin');
              return;
            }
            const trimmed = commentValue.trim();
            if (!trimmed) {
              return;
            }
            addCommentMutation.mutate(trimmed);
          }}
          className="space-y-3"
        >
          <textarea
            ref={commentInputRef}
            value={commentValue}
            onChange={(event) => setCommentValue(event.target.value)}
            placeholder={t('community.commentPlaceholder') ?? ''}
            className="h-32 w-full rounded-2xl border border-white/10 bg-neutral-950/60 px-4 py-3 text-sm text-white placeholder:text-white/50 focus:border-primary focus:outline-none"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/50">
              {isAuthenticated
                ? t('community.commentUserLabel', { name: session?.user?.name ?? t('community.defaultGuestName') })
                : t('community.commentLoginPrompt')}
            </span>
            <button
              type="submit"
              disabled={addCommentMutation.isPending}
              className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {addCommentMutation.isPending
                ? t('community.commentSubmitting')
                : t('community.commentSubmit')}
            </button>
          </div>
          {addCommentMutation.isError ? (
            <p className="text-xs text-red-400">{t('community.commentErrorMessage')}</p>
          ) : null}
        </form>
      </section>

      {authorMenuOpen ? (
        <div className="fixed inset-0 z-30" onClick={() => setAuthorMenuOpen(false)}>
          <div
            className="absolute right-6 top-24 w-56 rounded-2xl border border-white/10 bg-neutral-900/95 p-3 text-sm text-white shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => {
                setAuthorMenuOpen(false);
                setShowAuthorPosts(true);
              }}
              className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition hover:bg-white/10"
            >
              <span>{t('community.detail.authorPosts')}</span>
              <span className="text-xs text-white/40">↗</span>
            </button>
            {post.author?.id ? (
              <Link
                href={`/artists/${post.author.id}`}
                className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition hover:bg-white/10"
                onClick={() => setAuthorMenuOpen(false)}
              >
                <span>{t('community.detail.authorProfile')}</span>
                <span className="text-xs text-white/40">↗</span>
              </Link>
            ) : null}
            <button
              type="button"
              onClick={() => {
                setAuthorMenuOpen(false);
                setShowMessageModal(true);
              }}
              className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition hover:bg-white/10"
            >
              <span>{t('community.detail.authorMessage')}</span>
              <span className="text-xs text-white/40">↗</span>
            </button>
          </div>
        </div>
      ) : null}

      {showAuthorPosts ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4">
          <div
            className="w-full max-w-2xl space-y-4 rounded-3xl border border-white/10 bg-neutral-950/95 p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">
                {t('community.detail.authorPostsTitle', { name: authorName })}
              </h3>
              <button
                type="button"
                onClick={() => setShowAuthorPosts(false)}
                className="rounded-full bg-white/10 p-2 text-white/70 transition hover:bg-white/20"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {authorPostsQuery.isLoading ? (
              <p className="text-sm text-white/60">{t('common.loading')}</p>
            ) : null}
            {authorPostsQuery.isError ? (
              <p className="text-sm text-red-400">{t('community.detail.authorPostsError')}</p>
            ) : null}
            <div className="space-y-3">
              {(authorPostsQuery.data ?? []).map((item) => (
                <Link
                  key={item.id}
                  href={`/community/${item.id}`}
                  className="block rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white transition hover:border-primary/40 hover:text-primary"
                  onClick={() => setShowAuthorPosts(false)}
                >
                  <p className="text-sm font-semibold">{item.title}</p>
                  <p className="text-xs text-white/60 line-clamp-2">{item.content}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {showMessageModal ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4">
          <div
            className="flex w-full max-w-md flex-col gap-4 rounded-3xl border border-white/10 bg-neutral-950/95 p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">
                {t('community.detail.messageTitle', { name: authorName })}
              </h3>
              <button
                type="button"
                onClick={() => setShowMessageModal(false)}
                className="rounded-full bg-white/10 p-2 text-white/70 transition hover:bg-white/20"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/80">
              {messages.length === 0 ? (
                <p className="text-xs text-white/60">{t('community.messages.empty')}</p>
              ) : null}
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={clsx(
                    'flex flex-col gap-1 rounded-2xl px-3 py-2',
                    message.sender === 'me'
                      ? 'self-end bg-primary/20 text-primary-foreground'
                      : 'self-start bg-white/10 text-white'
                  )}
                >
                  <span className="text-xs uppercase tracking-[0.3em] text-white/50">
                    {message.sender === 'me' ? t('community.messages.me') : authorName}
                  </span>
                  <p>{message.content}</p>
                </div>
              ))}
            </div>
            <form onSubmit={handleSendMessage} className="space-y-3">
              <textarea
                value={messageDraft}
                onChange={(event) => setMessageDraft(event.target.value)}
                placeholder={t('community.messages.placeholder') ?? ''}
                className="h-24 w-full rounded-2xl border border-white/10 bg-neutral-900/80 px-3 py-2 text-sm text-white placeholder:text-white/50 focus:border-primary focus:outline-none"
              />
              <button
                type="submit"
                disabled={!messageIsValid}
                className="w-full rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {t('community.messages.send')}
              </button>
            </form>
          </div>
        </div>
      ) : null}

      {reportOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4">
          <div
            className="w-full max-w-md space-y-4 rounded-3xl border border-white/10 bg-neutral-950/95 p-6 text-white"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">{t('community.detail.reportTitle')}</h3>
              <button
                type="button"
                onClick={() => setReportOpen(false)}
                className="rounded-full bg-white/10 p-2 text-white/70 transition hover:bg-white/20"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {reportStatus === 'submitted' ? (
              <p className="text-sm text-white/70">{t('community.detail.reportSuccess')}</p>
            ) : (
              <p className="text-sm text-white/70">{t('community.detail.reportDescription')}</p>
            )}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setReportOpen(false)}
                className="rounded-full border border-white/20 px-4 py-2 text-sm text-white/80 transition hover:border-white/40 hover:text-white"
              >
                {t('community.detail.reportCancel')}
              </button>
              <button
                type="button"
                onClick={() => setReportStatus('submitted')}
                className="rounded-full bg-red-500/80 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-500"
              >
                {reportStatus === 'submitted'
                  ? t('community.detail.reportSubmitted')
                  : t('community.detail.reportConfirm')}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
