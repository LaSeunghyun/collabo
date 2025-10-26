'use client';

import { ChangeEvent, FormEvent, useMemo, useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ArrowLeft, Loader2, Paperclip } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSession, signIn } from 'next-auth/react';
import clsx from 'clsx';

import type { CommunityPost } from '@/lib/data/community';
import { fetchCategories } from '@/lib/api/categories';
import { CACHE_TTL } from '@/lib/constants/app-config';

interface NewPostFormValues {
  title: string;
  content: string;
  category: string;
  attachments: File[];
}

function CommunityNewPostForm() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchParamsString = searchParams.toString();
  const { status } = useSession();
  
  // 카테고리 데이터 가져오기
  const { data: categories = [], isLoading: categoriesLoading, error: categoriesError } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
    staleTime: CACHE_TTL.REACT_QUERY.CATEGORIES,
    retry: 3,
    retryDelay: 1000
  });

  // 카테고리 로딩 상태 디버깅
  useEffect(() => {
    console.log('🔍 [CATEGORIES] 상태 변경:', {
      isLoading: categoriesLoading,
      hasError: !!categoriesError,
      categoriesCount: categories.length,
      categories: categories.map(c => ({ id: c.id, label: c.label }))
    });
  }, [categoriesLoading, categoriesError, categories]);
  
  const [formValues, setFormValues] = useState<NewPostFormValues>({
    title: '',
    content: '',
    category: '',
    attachments: []
  });
  
  // 카테고리가 로드되면 첫 번째 카테고리를 기본값으로 설정
  useEffect(() => {
    if (categories.length > 0 && !formValues.category) {
      setFormValues(prev => ({ ...prev, category: categories[0].id }));
    }
  }, [categories, formValues.category]);
  const [error, setError] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // 로그인 상태 체크 및 리다이렉트
  useEffect(() => {
    if (status === 'loading') {
      return; // 로딩 중이면 대기
    }

    if (status === 'unauthenticated' && !isRedirecting) {
      setIsRedirecting(true);
      const callbackUrl = searchParamsString
        ? `/community/new?${searchParamsString}`
        : '/community/new';
      void signIn(undefined, { callbackUrl });
      return;
    }

    if (status === 'authenticated') {
      setIsRedirecting(false);
    }
  }, [status, searchParamsString, isRedirecting]);

  const isValid = useMemo(() => {
    return formValues.title.trim().length > 0 && 
           formValues.content.trim().length > 0 && 
           formValues.category.length > 0;
  }, [formValues.content, formValues.title, formValues.category]);

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
        credentials: 'include',
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to create community post');
      }

      return (await res.json()) as CommunityPost;
    },
    onSuccess: (post) => {
      // 폼 초기화
      setFormValues({ title: '', content: '', category: '', attachments: [] });
      
      // 즉시 리다이렉트 (로딩 상태 없이)
      if (typeof window !== 'undefined') {
        // 브라우저 히스토리를 직접 조작하여 더 빠른 네비게이션
        window.location.href = `/community/${post.id}`;
      } else if (router) {
        // 서버 사이드에서는 router.push 사용
        router.push(`/community/${post.id}`);
      }
    },
    onError: (error: Error) => {
      // Failed to create post - removed console.error for production
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
      <div className="pt-6">
        <Link
          href="/community"
          className="inline-flex items-center gap-2 text-sm text-white/60 transition hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('community.actions.backToList')}
        </Link>
      </div>

      <div className="mt-6">
        <h1 className="text-2xl font-semibold text-white">새 글 작성</h1>

        {/* 카테고리 탭 */}
        <div className="mt-4 flex flex-wrap gap-2">
          {categoriesLoading ? (
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-8 w-20 animate-pulse rounded-full bg-white/10" />
              ))}
            </div>
          ) : categoriesError ? (
            <div className="flex items-center gap-2 text-sm text-red-400">
              <span>⚠️</span>
              <span>카테고리를 불러올 수 없습니다. 페이지를 새로고침해주세요.</span>
              <button
                onClick={() => window.location.reload()}
                className="text-primary hover:underline"
              >
                새로고침
              </button>
            </div>
          ) : categories.length === 0 ? (
            <div className="text-sm text-yellow-400">
              ⚠️ 사용 가능한 카테고리가 없습니다.
            </div>
          ) : (
            categories.map((category) => {
              const isActive = formValues.category === category.id;
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setFormValues((prev) => ({ ...prev, category: category.id }))}
                  className={clsx(
                    'rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-widest transition focus:outline-none focus:ring-2 focus:ring-primary/60 focus:ring-offset-0',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                      : 'bg-white/5 text-white/60 hover:bg-white/10'
                  )}
                >
                  {category.icon && <span className="mr-1 text-sm not-italic">{category.icon}</span>}
                  {category.label}
                </button>
              );
            })
          )}
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mt-6 space-y-6 rounded-2xl border border-white/10 bg-white/5 p-6"
      >

        <div className="space-y-4">
          <input
            value={formValues.title}
            onChange={(event) => setFormValues((prev) => ({ ...prev, title: event.target.value }))}
            placeholder={t('community.newPostTitlePlaceholder') ?? ''}
            className="w-full rounded-2xl border border-white/10 bg-neutral-950/60 px-4 py-3 text-sm text-white placeholder:text-white/50 focus:border-primary focus:outline-none"
          />

          <textarea
            value={formValues.content}
            onChange={(event) => setFormValues((prev) => ({ ...prev, content: event.target.value }))}
            placeholder={t('community.writePlaceholder') ?? ''}
            className="h-48 w-full rounded-2xl border border-white/10 bg-neutral-950/60 px-4 py-3 text-sm text-white placeholder:text-white/50 focus:border-primary focus:outline-none"
          />
        </div>

        <div className="space-y-4">
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
        </div>

        {error ? <p className="text-sm text-red-400">{error}</p> : null}

        <div className="flex justify-end gap-2">
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
                게시글 작성 중...
              </>
            ) : (
              t('community.newPost.submit')
            )}
          </button>
        </div>
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
