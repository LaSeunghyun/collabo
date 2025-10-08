'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  ANNOUNCEMENT_CATEGORIES,
  DEFAULT_ANNOUNCEMENT_CATEGORY,
  type AnnouncementCategory
} from '@/lib/constants/announcements';

interface AnnouncementFormState {
  title: string;
  content: string;
  category: AnnouncementCategory;
  isPinned: boolean;
  publishedAt: string;
}

const initialState: AnnouncementFormState = {
  title: '',
  content: '',
  category: DEFAULT_ANNOUNCEMENT_CATEGORY,
  isPinned: false,
  publishedAt: ''
};

async function createAnnouncementRequest(payload: AnnouncementFormState) {
  const response = await fetch('/api/announcements', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      title: payload.title,
      content: payload.content,
      category: payload.category,
      isPinned: payload.isPinned,
      publishedAt: payload.publishedAt ? new Date(payload.publishedAt).toISOString() : null
    })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: '공�? ?�성???�패?�습?�다.' }));
    throw new Error(error.message ?? '공�? ?�성???�패?�습?�다.');
  }

  return response.json();
}

export function AnnouncementComposer() {
  const [formState, setFormState] = useState<AnnouncementFormState>(initialState);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: createAnnouncementRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements', 'admin'] });
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      setFormState(initialState);
    }
  });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!formState.title.trim() || !formState.content.trim()) {
      setError('?�목�??�용??모두 ?�력??주세??');
      return;
    }

    try {
      await mutation.mutateAsync(formState);
    } catch (submissionError) {
      if (submissionError instanceof Error) {
        setError(submissionError.message);
      } else {
        setError('공�? ?�성 �??�류가 발생?�습?�다.');
      }
    }
  };

  const handleChange = (field: keyof AnnouncementFormState, value: string | boolean) => {
    setFormState((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const previewDate = formState.publishedAt
    ? new Date(formState.publishedAt)
    : new Date();

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 shadow-lg shadow-blue-500/5">
      <h2 className="text-xl font-semibold text-white">??공�? ?�성</h2>
      <p className="mt-1 text-sm text-white/60">
        공�? ?�목, 카테고리, 발행 ?�각???�정?�고 ?�시간으�?미리보기�??�인?�세??
      </p>

      <form onSubmit={handleSubmit} className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium text-white/80">
              ?�목
            </label>
            <input
              id="title"
              type="text"
              value={formState.title}
              onChange={(event) => handleChange('title', event.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder-white/40 focus:border-blue-400 focus:outline-none"
              placeholder="?? 8???�기 ?��? ?�내"
              required
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="category" className="text-sm font-medium text-white/80">
                카테고리
              </label>
              <select
                id="category"
                value={formState.category}
                onChange={(event) => handleChange('category', event.target.value as AnnouncementCategory)}
                className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white focus:border-blue-400 focus:outline-none"
              >
                {ANNOUNCEMENT_CATEGORIES.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="publishedAt" className="text-sm font-medium text-white/80">
                발행 ?�각 (비워?�면 즉시 발행)
              </label>
              <input
                id="publishedAt"
                type="datetime-local"
                value={formState.publishedAt}
                onChange={(event) => handleChange('publishedAt', event.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white focus:border-blue-400 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input
              id="isPinned"
              type="checkbox"
              checked={formState.isPinned}
              onChange={(event) => handleChange('isPinned', event.target.checked)}
              className="h-4 w-4 rounded border border-white/30 bg-white/5 text-blue-400 focus:ring-blue-400"
            />
            <label htmlFor="isPinned" className="text-sm text-white/70">
              공�?�??�단??고정?�니??
            </label>
          </div>

          <div className="space-y-2">
            <label htmlFor="content" className="text-sm font-medium text-white/80">
              ?�용
            </label>
            <textarea
              id="content"
              value={formState.content}
              onChange={(event) => handleChange('content', event.target.value)}
              className="h-48 w-full rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder-white/40 focus:border-blue-400 focus:outline-none"
              placeholder="공�? ?�용???�성??주세??"
              required
            />
          </div>

          {error ? <p className="text-sm text-rose-300">{error}</p> : null}

          <button
            type="submit"
            disabled={mutation.isPending}
            className="inline-flex items-center justify-center rounded-lg bg-blue-500 px-5 py-3 text-sm font-medium text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:bg-blue-500/50"
          >
            {mutation.isPending ? '?�록 중�? : '공�? 발행' }
          </button>
        </div>

        <aside className="hidden rounded-2xl border border-white/10 bg-white/[0.02] p-6 text-sm text-white/70 shadow-inner lg:block">
          <h3 className="text-sm font-semibold text-white">미리보기</h3>
          <p className="mt-1 text-xs text-white/50">
            {formState.publishedAt ? `?�약 발행: ${new Date(formState.publishedAt).toLocaleString('ko-KR')}` : '즉시 발행 ?�정'}
          </p>
          <div className="mt-5 space-y-3">
            <div className="flex items-center gap-2 text-xs text-white/60">
              {formState.isPinned ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-amber-300">
                  ?�� ?�단 고정
                </span>
              ) : null}
              <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2 py-0.5 text-white/70">
                {
                  ANNOUNCEMENT_CATEGORIES.find((category) => category.value === formState.category)?.label ??
                  formState.category
                }
              </span>
            </div>
            <h4 className="text-lg font-semibold text-white">{formState.title || '미리보기 ?�목'}</h4>
            <p className="text-white/60">
              {formState.content ? formState.content.slice(0, 160) : '공�? ?�용???�력?�면 ?�기?�서 미리보기가 ?�데?�트?�니??'}
              {formState.content.length > 160 ? '?? : ''}
            </p>
            <p className="text-xs text-white/40">{previewDate.toLocaleString('ko-KR')}</p>
          </div>
        </aside>
      </form>
    </div>
  );
}
