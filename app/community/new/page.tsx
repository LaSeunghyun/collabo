'use client';

import { ChangeEvent, FormEvent, useMemo, useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { ArrowLeft, Loader2, Paperclip } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSession, signIn } from 'next-auth/react';
import clsx from 'clsx';

import type { CommunityPost } from '@/lib/data/community';

const CATEGORY_OPTIONS = [
  'notice',
  'general',
  'collab',
  'support',
  'showcase'
] as const;

interface NewPostFormValues {
  title: string;
  content: string;
  category: (typeof CATEGORY_OPTIONS)[number];
  attachments: File[];
}

function CommunityNewPostForm() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();
  const [formValues, setFormValues] = useState<NewPostFormValues>({
    title: '',
    content: '',
    category: 'general',
    attachments: []
  });
  const [error, setError] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // 로그인 상태 체크 및 리다이렉트
  useEffect(() => {
    if (status === 'loading') return; // 로딩 중이면 대기

    if (status === 'unauthenticated') {
      setIsRedirecting(true);
      // 현재 URL을 callbackUrl로 설정하여 로그인 후 돌아올 수 있도록 함
      const callbackUrl = `/community/new?${searchParams.toString()}`;
      signIn(undefined, { callbackUrl });
      return;
    }

    if (status === 'authenticated') {
      setIsRedirecting(false);
    }
  }, [status, searchParams]);

  const isValid = useMemo(() => {
    return formValues.title.trim().length > 0 && formValues.content.trim().length > 0;
  }, [formValues.content, formValues.title]);

  const createPostMutation = useMutation({
    mutationFn: async (values: NewPostFormValues) => {
      const body = {
        title: values.title.trim(),
        content: values.content.trim(),
        category: values.category,
        attachments: values.attachments.map((file) => ({
          name: file.name,
          size: file.size,
          type: file.type
        }))
      };

      const res = await fetch('/api/community', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to create community post');
      }

      return (await res.json()) as CommunityPost;
    },
    onSuccess: (post) => {
      setFormValues({ title: '', content: '', category: 'general', attachments: [] });
      router.push(`/community/${post.id}`);
    },
    onError: (error: Error) => {
      console.error('Failed to create post:', error);
      setError(error.message || t('community.postErrorMessage') || '게시글 작성에 실패했습니다.');
    }
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!isValid) {
      setError(t('community.validation.required') ?? '');
      return;
    }

    createPostMutation.mutate(formValues);
  };

  const handleFileInput = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) {
      return;
    }

    setFormValues((prev) => ({
      ...prev,
      attachments: [...prev.attachments, ...files]
    }));
    event.target.value = '';
  };

  const handleRemoveAttachment = (index: number) => {
    setFormValues((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((_, fileIndex) => fileIndex !== index)
    }));
  };

  // 로딩 중이거나 리다이렉트 중일 때 표시
  if (status === 'loading' || isRedirecting) {
    return (
      <div className="mx-auto max-w-4xl px-4 pb-20">
        <div className="pt-10">
          <Link
            href="/community"
            className="inline-flex items-center gap-2 text-sm text-white/60 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('community.actions.backToList')}
          </Link>
        </div>
        <div className="mt-6 flex h-96 items-center justify-center">
          <div className="text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-white/60" />
            <p className="mt-4 text-sm text-white/60">
              {isRedirecting ? '로그인 페이지로 이동 중...' : '로딩 중...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 로그인되지 않은 경우 (이론적으로는 위에서 리다이렉트되지만 안전장치)
  if (status === 'unauthenticated') {
    return (
      <div className="mx-auto max-w-4xl px-4 pb-20">
        <div className="pt-10">
          <Link
            href="/community"
            className="inline-flex items-center gap-2 text-sm text-white/60 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('community.actions.backToList')}
          </Link>
        </div>
        <div className="mt-6 flex h-96 items-center justify-center">
          <div className="text-center">
            <p className="text-lg text-white/80">로그인이 필요합니다</p>
            <p className="mt-2 text-sm text-white/60">게시글을 작성하려면 먼저 로그인해주세요.</p>
            <button
              onClick={() => signIn(undefined, { callbackUrl: '/community/new' })}
              className="mt-4 rounded-full bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
            >
              로그인하기
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 pb-20">
      <div className="pt-10">
        <Link
          href="/community"
          className="inline-flex items-center gap-2 text-sm text-white/60 transition hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('community.actions.backToList')}
        </Link>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mt-6 space-y-8 rounded-3xl border border-white/10 bg-white/5 p-8"
      >
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/50">
            {t('community.newPost.lead')}
          </p>
          <h1 className="text-3xl font-semibold text-white">{t('community.newPost.title')}</h1>
          <p className="text-sm text-white/70">{t('community.newPost.description')}</p>
        </header>

        <section className="space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-[0.3em] text-white/50">
            {t('community.newPost.categoryLabel')}
          </h2>
          <div className="flex flex-wrap gap-2">
            {CATEGORY_OPTIONS.map((option) => {
              const isActive = formValues.category === option;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setFormValues((prev) => ({ ...prev, category: option }))}
                  className={clsx(
                    'rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.3em] transition focus:outline-none focus:ring-2 focus:ring-primary/60 focus:ring-offset-0',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                      : 'bg-white/5 text-white/60 hover:bg-white/10'
                  )}
                >
                  {t(`community.filters.${option}`)}
                </button>
              );
            })}
          </div>
        </section>

        <section className="grid gap-6">
          <label className="space-y-3">
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-white/50">
              {t('community.newPostTitleLabel')}
            </span>
            <input
              value={formValues.title}
              onChange={(event) => setFormValues((prev) => ({ ...prev, title: event.target.value }))}
              placeholder={t('community.newPostTitlePlaceholder') ?? ''}
              className="w-full rounded-2xl border border-white/10 bg-neutral-950/60 px-4 py-3 text-sm text-white placeholder:text-white/50 focus:border-primary focus:outline-none"
            />
          </label>

          <label className="space-y-3">
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-white/50">
              {t('community.newPostContentLabel')}
            </span>
            <textarea
              value={formValues.content}
              onChange={(event) => setFormValues((prev) => ({ ...prev, content: event.target.value }))}
              placeholder={t('community.writePlaceholder') ?? ''}
              className="h-48 w-full rounded-2xl border border-white/10 bg-neutral-950/60 px-4 py-3 text-sm text-white placeholder:text-white/50 focus:border-primary focus:outline-none"
            />
          </label>
        </section>

        <section className="space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-[0.3em] text-white/50">
            {t('community.newPost.attachmentLabel')}
          </h2>
          <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-dashed border-white/20 bg-white/5 px-4 py-3 text-sm text-white/70 transition hover:border-white/40">
            <div className="flex items-center gap-3">
              <Paperclip className="h-4 w-4" />
              <span>{t('community.newPost.attachmentCta')}</span>
            </div>
            <span className="text-xs text-white/40">{t('community.newPost.attachmentHint')}</span>
            <input
              type="file"
              className="hidden"
              multiple
              onChange={handleFileInput}
            />
          </label>
          {formValues.attachments.length ? (
            <ul className="space-y-2 text-sm text-white/80">
              {formValues.attachments.map((file, index) => (
                <li
                  key={`${file.name}-${index}`}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-neutral-950/60 px-4 py-2"
                >
                  <div>
                    <p className="font-medium text-white">{file.name}</p>
                    <p className="text-xs text-white/50">
                      {(file.size / 1024).toFixed(1)} KB · {file.type || 'unknown'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveAttachment(index)}
                    className="rounded-full px-3 py-1 text-xs text-white/70 transition hover:bg-white/10"
                  >
                    {t('community.newPost.attachmentRemove')}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </section>

        {error ? <p className="text-sm text-red-400">{error}</p> : null}

        <footer className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-white/50">{t('community.newPost.notice')}</p>
          <div className="flex gap-2">
            <Link
              href="/community"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-2 text-sm text-white/80 transition hover:border-white/40 hover:text-white"
            >
              {t('community.actions.cancel')}
            </Link>
            <button
              type="submit"
              disabled={!isValid || createPostMutation.isPending}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {createPostMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t('community.newPost.submitting')}
                </>
              ) : (
                t('community.newPost.submit')
              )}
            </button>
          </div>
        </footer>
      </form>
    </div>
  );
}

export default function CommunityNewPostPage() {
  return (
    <Suspense fallback={
      <div className="mx-auto max-w-4xl px-4 pb-20">
        <div className="pt-10">
          <Link
            href="/community"
            className="inline-flex items-center gap-2 text-sm text-white/60 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            커뮤니티로 돌아가기
          </Link>
        </div>
        <div className="mt-6 flex h-96 items-center justify-center">
          <div className="text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-white/60" />
            <p className="mt-4 text-sm text-white/60">로딩 중...</p>
          </div>
        </div>
      </div>
    }>
      <CommunityNewPostForm />
    </Suspense>
  );
}
