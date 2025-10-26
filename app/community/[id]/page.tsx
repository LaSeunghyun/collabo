'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Flag, Heart, Loader2, MessageCircle, MinusCircle, UserCircle2, X, Eye } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { signIn, useSession } from 'next-auth/react';
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
  const { data: session, status } = useSession();
  const isAuthenticated = Boolean(session?.user);

  const { data: post, isLoading, isError } = useCommunityPost(postId);
  const { data: comments = [], isLoading: commentsLoading } = useCommunityComments(postId);

  // 세션 상태 디버깅
  useEffect(() => {
    // Session status monitoring - removed console.log for production
  }, [status, isAuthenticated]);

  // 클라이언트 전용 날짜 포맷팅으로 hydration mismatch 방지
  useEffect(() => {
    if (post?.createdAt) {
      const date = new Date(post.createdAt);
      setFormattedDate(date.toLocaleString('ko-KR', {
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }));
    }
  }, [post?.createdAt]);

  // 싫어요 상태는 서버에서 관리하므로 로컬 상태 제거
  const [reportOpen, setReportOpen] = useState(false);
  const [reportStatus, setReportStatus] = useState<'idle' | 'submitted'>('idle');
  const [reportReasonKey, setReportReasonKey] = useState<string | null>(null);
  const [reportCustomReason, setReportCustomReason] = useState('');
  const [reportError, setReportError] = useState<string | null>(null);
  const [likeError, setLikeError] = useState<string | null>(null);
  const [authorMenuOpen, setAuthorMenuOpen] = useState(false);
  const [showAuthorPosts, setShowAuthorPosts] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageDraft, setMessageDraft] = useState('');
  const [messages, setMessages] = useState<{ id: string; sender: 'me' | 'them'; content: string; createdAt: string }[]>([]);

  const commentInputRef = useRef<HTMLTextAreaElement | null>(null);
  const [commentValue, setCommentValue] = useState('');
  
  // 클라이언트 전용 날짜 포맷팅으로 hydration mismatch 방지
  const [formattedDate, setFormattedDate] = useState<string>('');

  const redirectToSignIn = () => {
    const callbackUrl = typeof window !== 'undefined' ? window.location.href : undefined;
    void signIn(undefined, { callbackUrl });
  };

  const toggleLikeMutation = useMutation({
    mutationFn: async (like: boolean) => {
      const res = await fetch(`/api/community/${postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: like ? 'like' : 'unlike' })
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        const message =
          (payload && (payload.error ?? payload.message)) ?? t('community.detail.likeError');
        throw new Error(message);
      }
      return (await res.json()) as CommunityPost;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData<CommunityPost>(['community', 'detail', postId], updated);
      setLikeError(null);
    },
    onMutate: () => {
      setLikeError(null);
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : t('community.detail.likeError');
      setLikeError(message);
    }
  });

  const toggleDislikeMutation = useMutation({
    mutationFn: async (dislike: boolean) => {
      const res = await fetch(`/api/community/${postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: dislike ? 'dislike' : 'undislike' })
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        const message =
          (payload && (payload.error ?? payload.message)) ?? t('community.detail.dislikeError');
        throw new Error(message);
      }
      return (await res.json()) as CommunityPost;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData<CommunityPost>(['community', 'detail', postId], updated);
      setLikeError(null);
    },
    onMutate: () => {
      setLikeError(null);
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : t('community.detail.dislikeError');
      setLikeError(message);
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

  const reportReasonOptions = useMemo(() => {
    const entries = (t('community.detail.reportReasons', { returnObjects: true }) as
      | Record<string, { title?: string; description?: string } | string>
      | undefined) ?? {};

    return Object.entries(entries)
      .map(([value, raw]) => {
        if (typeof raw === 'string') {
          return { value, title: raw, description: '' };
        }

        if (raw?.title) {
          return { value, title: raw.title, description: raw.description ?? '' };
        }

        return null;
      })
      .filter((option): option is { value: string; title: string; description: string } => option !== null);
  }, [t]);

  const selectedReportReason = reportReasonKey
    ? reportReasonOptions.find((option) => option.value === reportReasonKey)
    : undefined;

  const isOtherReportReason = reportReasonKey === 'other';
  const trimmedCustomReportReason = reportCustomReason.trim();
  const canSubmitReport =
    Boolean(isAuthenticated) &&
    Boolean(selectedReportReason) &&
    (!isOtherReportReason || trimmedCustomReportReason.length > 0);

  const resolveReportErrorMessage = (message: string | null | undefined) => {
    if (!message) {
      return t('community.detail.reportError');
    }

    switch (message) {
      case 'Report already submitted.':
        return t('community.detail.reportDuplicate');
      case 'Post not found.':
        return t('community.detail.reportPostNotFound');
      case 'User not found.':
        return t('community.detail.reportUserNotFound');
      case 'Reporter is required.':
        return t('community.detail.reportAuthRequired');
      default:
        return message;
    }
  };

  const reportMutation = useMutation({
    mutationFn: async ({ reporterId, reason }: { reporterId: string; reason: string }) => {
      // Sending report request - removed console.log for production

      const res = await fetch(`/api/community/${postId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reporterId, reason })
      });

      // Report response status - removed console.log for production

      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        // Report error payload - removed console.log for production
        const message = resolveReportErrorMessage(payload?.message);
        const error = new Error(message);
        (error as any).details = payload?.details;
        throw error;
      }

      return res.json() as Promise<{ id: string }>;
    },
    onSuccess: () => {
      setReportStatus('submitted');
      setReportError(null);
      void queryClient.invalidateQueries({ queryKey: ['community', 'detail', postId] });
    },
    onError: (error) => {
      // Failed to submit report - removed console.error for production
      const message =
        error instanceof Error
          ? resolveReportErrorMessage(error.message)
          : t('community.detail.reportError');

      // 에러 상세 정보가 있으면 함께 표시
      const errorDetails = (error as any)?.details;
      const fullMessage = errorDetails ? `${message} (${errorDetails})` : message;

      setReportError(fullMessage);
    }
  });

  const resetReportFields = () => {
    setReportStatus('idle');
    setReportReasonKey(null);
    setReportCustomReason('');
    setReportError(null);
  };

  const closeReportModal = () => {
    setReportOpen(false);
    resetReportFields();
    reportMutation.reset();
  };

  const openReportModal = () => {
    resetReportFields();
    reportMutation.reset();
    setReportOpen(true);
  };

  const handleReportSubmit = () => {
    if (reportStatus === 'submitted') {
      closeReportModal();
      return;
    }

    // Report submit attempt - removed console.log for production

    if (!isAuthenticated || !session?.user?.id) {
      // Authentication check failed - removed console.log for production
      setReportError(t('community.detail.reportAuthRequired'));
      redirectToSignIn();
      return;
    }

    // 사용자 ID 유효성 검사
    if (typeof session.user.id !== 'string' || session.user.id.trim() === '') {
      // Invalid user ID - removed console.log for production
      setReportError(t('community.detail.reportUserNotFound'));
      return;
    }

    if (!selectedReportReason) {
      setReportError(t('community.detail.reportReasonRequired'));
      return;
    }

    if (isOtherReportReason && trimmedCustomReportReason.length === 0) {
      setReportError(t('community.detail.reportOtherRequired'));
      return;
    }

    const finalReason =
      isOtherReportReason ? trimmedCustomReportReason : selectedReportReason.title;

    setReportError(null);
    reportMutation.mutate({ reporterId: session.user.id, reason: finalReason });
  };

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

  // 싫어요 상태는 서버에서 관리하므로 로컬 useEffect 제거

  useEffect(() => {
    if (!reportOpen) {
      setReportStatus('idle');
      setReportReasonKey(null);
      setReportCustomReason('');
      setReportError(null);
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
  // const categoryLabel = t(`community.filters.${post.category}`);

  return (
    <div className="mx-auto max-w-4xl px-4 pb-24">
      <div className="flex flex-col gap-4 pt-10 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/community"
          className="inline-flex items-center gap-2 text-sm text-white/60 transition hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('community.actions.backToList')}
        </Link>
        <div className="flex items-center gap-4 text-sm text-white/60">
          <div className="flex items-center gap-1">
            <Heart className="h-4 w-4" />
            <span>{post.likes || 0}</span>
          </div>
          <div className="flex items-center gap-1">
            <MessageCircle className="h-4 w-4" />
            <span>{comments.length}</span>
          </div>
          <div className="flex items-center gap-1">
            <Eye className="h-4 w-4" />
            <span>{post.views || 0}</span>
          </div>
        </div>
      </div>

      <article className="mt-6 space-y-8 rounded-3xl border border-white/10 bg-white/5 p-8">
        <header className="space-y-3">
          <div className="flex items-center justify-between text-sm text-white/60">
            <div className="flex items-center gap-3">
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

            {/* 작성자 메뉴 - 통합된 위치 */}
            {authorMenuOpen && (
              <div className="fixed inset-0 z-30" onClick={() => setAuthorMenuOpen(false)}>
                <div className="relative">
                  <div
                    className="absolute right-0 top-8 w-48 rounded-2xl border border-white/10 bg-neutral-900/95 p-2 text-sm text-white shadow-xl z-10"
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
              </div>
            )}
          </div>
          <h1 className="text-3xl font-semibold text-white">{post.title}</h1>
          <p className="text-base leading-relaxed text-white/80 whitespace-pre-line">{post.content}</p>
        </header>

        <div className="flex flex-wrap gap-3 text-sm text-white/70">
          <button
            type="button"
            onClick={() => {
              if (!isAuthenticated) {
                redirectToSignIn();
                return;
              }
              toggleLikeMutation.mutate(!post.liked);
            }}
            className={clsx(
              'inline-flex items-center gap-2 rounded-full border px-4 py-2 transition disabled:cursor-not-allowed disabled:opacity-60',
              post.liked
                ? 'border-primary/60 bg-primary/20 text-primary'
                : 'border-white/10 bg-white/5 text-white/80 hover:border-white/30 hover:bg-white/10'
            )}
            disabled={toggleLikeMutation.isPending}
          >
            <Heart className={clsx('h-4 w-4', post.liked ? 'fill-current' : undefined)} />
            <span>{likeLabel}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              if (!isAuthenticated) {
                redirectToSignIn();
                return;
              }
              toggleDislikeMutation.mutate(!post.disliked);
            }}
            className={clsx(
              'inline-flex items-center gap-2 rounded-full border px-4 py-2 transition disabled:cursor-not-allowed disabled:opacity-60',
              post.disliked
                ? 'border-white/20 bg-white/20 text-white'
                : 'border-white/10 bg-white/5 text-white/80 hover:border-white/30 hover:bg-white/10'
            )}
            disabled={toggleDislikeMutation.isPending}
          >
            <MinusCircle className="h-4 w-4" />
            <span>{t('community.detail.dislikeLabel', { count: post.dislikes })}</span>
          </button>
          <button
            type="button"
            onClick={openReportModal}
            className="inline-flex items-center gap-2 rounded-full border border-red-400/40 bg-red-500/10 px-4 py-2 text-sm text-red-200 transition hover:border-red-300/60 hover:text-red-100"
          >
            <Flag className="h-4 w-4" />
            <span>{t('community.detail.report')}</span>
          </button>
        </div>
        {likeError ? <p className="text-xs text-red-400">{likeError}</p> : null}
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
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10">
                      <UserCircle2 className="h-4 w-4 text-white/70" />
                    </div>
                    <p className="font-semibold text-white">{comment.authorName}</p>
                    <span className="text-xs text-white/50">•</span>
                    <span className="text-xs text-white/50">
                      {comment.createdAt ? (() => {
                        try {
                          return new Date(comment.createdAt).toLocaleString('ko-KR', {
                            month: 'numeric',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          });
                        } catch {
                          return '';
                        }
                      })() : ''}
                    </span>
                  </div>
                  <p className="whitespace-pre-line text-white/70">{comment.content}</p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/60 transition hover:border-white/20 hover:text-white"
                    >
                      <Heart className="h-3 w-3" />
                      <span>0</span>
                    </button>
                    <button
                      type="button"
                      className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/60 transition hover:border-white/20 hover:text-white"
                    >
                      <MinusCircle className="h-3 w-3" />
                      <span>0</span>
                    </button>
                    <button
                      type="button"
                      className="rounded-full p-1 text-white/40 transition hover:text-red-400"
                    >
                      <Flag className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (!isAuthenticated) {
              redirectToSignIn();
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
                onClick={closeReportModal}
                className="rounded-full bg-white/10 p-2 text-white/70 transition hover:bg-white/20"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {reportStatus === 'submitted' ? (
              <p className="text-sm text-white/70">{t('community.detail.reportSuccess')}</p>
            ) : (
              <>
                <p className="text-sm text-white/70">{t('community.detail.reportDescription')}</p>
                {!isAuthenticated ? (
                  <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-xs text-amber-100">
                    {t('community.detail.reportAuthRequired')}
                  </div>
                ) : null}
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-white">
                      {t('community.detail.reportReasonLabel')}
                    </p>
                    <p className="mt-1 text-xs text-white/60">
                      {t('community.detail.reportReasonDescription')}
                    </p>
                  </div>
                  <div className="space-y-2">
                    {reportReasonOptions.map((option) => {
                      const selected = option.value === reportReasonKey;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => {
                            setReportReasonKey(option.value);
                            if (option.value !== 'other') {
                              setReportCustomReason('');
                            }
                            setReportError(null);
                          }}
                          className={clsx(
                            'w-full rounded-2xl border px-4 py-3 text-left transition',
                            selected
                              ? 'border-red-400/70 bg-red-500/20 text-white'
                              : 'border-white/10 bg-white/5 text-white/80 hover:border-white/20 hover:text-white'
                          )}
                        >
                          <p className="text-sm font-semibold">{option.title}</p>
                          {option.description ? (
                            <p className="mt-1 text-xs text-white/60">{option.description}</p>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                </div>
                {isOtherReportReason ? (
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-widest text-white/60">
                      {t('community.detail.reportReasonOtherLabel')}
                    </label>
                    <textarea
                      value={reportCustomReason}
                      onChange={(event) => setReportCustomReason(event.target.value)}
                      placeholder={t('community.detail.reportReasonOtherPlaceholder') ?? ''}
                      className="min-h-[96px] w-full rounded-2xl border border-white/10 bg-neutral-900/80 px-3 py-2 text-sm text-white placeholder:text-white/50 focus:border-primary focus:outline-none"
                    />
                  </div>
                ) : null}
              </>
            )}
            {reportError ? <p className="text-xs text-red-400">{reportError}</p> : null}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={closeReportModal}
                className="rounded-full border border-white/20 px-4 py-2 text-sm text-white/80 transition hover:border-white/40 hover:text-white"
              >
                {t('community.detail.reportCancel')}
              </button>
              <button
                type="button"
                onClick={handleReportSubmit}
                disabled={
                  reportStatus !== 'submitted' && (!canSubmitReport || reportMutation.isPending)
                }
                className="rounded-full bg-red-500/80 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {reportStatus === 'submitted'
                  ? t('community.detail.reportSubmitted')
                  : reportMutation.isPending
                    ? t('community.detail.reportSubmitting')
                    : t('community.detail.reportConfirm')}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
