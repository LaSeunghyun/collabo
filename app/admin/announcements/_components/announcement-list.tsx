'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { ANNOUNCEMENT_CATEGORY_LABELS, type AnnouncementCategory } from '@/lib/constants/announcements';

interface AdminAnnouncement {
  id: string;
  title: string;
  content: string;
  category: AnnouncementCategory | string;
  isPinned: boolean;
  publishedAt: string | null;
  isNew: boolean;
  updatedAt?: string;
}

async function fetchAdminAnnouncements() {
  const response = await fetch('/api/announcements?includeScheduled=true');

  if (!response.ok) {
    throw new Error('공지 목록을 불러오지 못했습니다.');
  }

  const data = (await response.json()) as { announcements: AdminAnnouncement[] };
  return data.announcements;
}

async function updateAnnouncementRequest(announcement: AdminAnnouncement & { publishedAtDraft?: string }) {
  const response = await fetch(`/api/announcements/${announcement.id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      title: announcement.title,
      content: announcement.content,
      category: announcement.category,
      isPinned: announcement.isPinned,
      publishedAt: announcement.publishedAtDraft
        ? new Date(announcement.publishedAtDraft).toISOString()
        : announcement.publishedAt
    })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: '공지 업데이트에 실패했습니다.' }));
    throw new Error(error.message ?? '공지 업데이트에 실패했습니다.');
  }

  return response.json();
}

async function deleteAnnouncementRequest(id: string) {
  const response = await fetch(`/api/announcements/${id}`, {
    method: 'DELETE'
  });

  if (!response.ok) {
    throw new Error('공지를 삭제하지 못했습니다.');
  }
}

const formatDate = (value: string | null) => {
  if (!value) return '발행 예정';
  if (typeof window === 'undefined') return value;
  try {
    return new Date(value).toLocaleString('ko-KR');
  } catch {
    return value;
  }
};

export function AnnouncementList() {
  const queryClient = useQueryClient();
  const [scheduleDrafts, setScheduleDrafts] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const { data: announcements = [], isLoading, isError } = useQuery({
    queryKey: ['announcements', 'admin'],
    queryFn: fetchAdminAnnouncements
  });

  const updateMutation = useMutation({
    mutationFn: updateAnnouncementRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements', 'admin'] });
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      setError(null);
    },
    onError: (mutationError) => {
      if (mutationError instanceof Error) {
        setError(mutationError.message);
      } else {
        setError('공지 업데이트 중 오류가 발생했습니다.');
      }
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAnnouncementRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements', 'admin'] });
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
    },
    onError: (mutationError) => {
      if (mutationError instanceof Error) {
        setError(mutationError.message);
      } else {
        setError('공지 삭제 중 오류가 발생했습니다.');
      }
    }
  });

  const sortedAnnouncements = useMemo(() => {
    return [...announcements].sort((a, b) => {
      if (a.isPinned !== b.isPinned) {
        return a.isPinned ? -1 : 1;
      }

      const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
      const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
      return dateB - dateA;
    });
  }, [announcements]);

  const handleScheduleDraftChange = (id: string, value: string) => {
    setScheduleDrafts((prev) => ({
      ...prev,
      [id]: value
    }));
  };

  const handleSaveSchedule = (announcement: AdminAnnouncement) => {
    const draft = scheduleDrafts[announcement.id];
    updateMutation.mutate({ ...announcement, publishedAtDraft: draft });
  };

  const handleTogglePin = (announcement: AdminAnnouncement) => {
    updateMutation.mutate({ ...announcement, isPinned: !announcement.isPinned });
  };

  const handleDelete = (announcement: AdminAnnouncement) => {
    if (!window.confirm('이 공지를 삭제하시겠습니까? 삭제 후에는 되돌릴 수 없습니다.')) {
      return;
    }

    deleteMutation.mutate(announcement.id);
  };

  if (isLoading) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-10 text-center text-sm text-white/60">
        공지 데이터를 불러오는 중입니다…
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-3xl border border-rose-500/20 bg-rose-500/5 p-10 text-center text-sm text-rose-200">
        공지 데이터를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white">발행된 공지 관리</h2>
          <p className="text-sm text-white/60">상단 고정 여부와 발행 일정을 조정하고 필요 시 공지를 삭제할 수 있습니다.</p>
        </div>
        <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-white/70">총 {sortedAnnouncements.length}건</span>
      </div>

      {error ? <p className="mt-4 text-sm text-rose-300">{error}</p> : null}

      <div className="mt-6 space-y-4">
        {sortedAnnouncements.map((announcement) => {
          const draftValue = scheduleDrafts[announcement.id] ??
            (announcement.publishedAt ? new Date(announcement.publishedAt).toISOString().slice(0, 16) : '');
          const categoryLabel =
            ANNOUNCEMENT_CATEGORY_LABELS[announcement.category as AnnouncementCategory] ?? announcement.category;

          return (
            <div
              key={announcement.id}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 shadow-sm shadow-blue-500/5"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-white/50">
                    {announcement.isPinned ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-amber-300">
                        📌 상단 고정
                      </span>
                    ) : null}
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2 py-0.5 text-white/70">
                      {categoryLabel}
                    </span>
                    <span>{formatDate(announcement.publishedAt)}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-white">{announcement.title}</h3>
                  <p className="line-clamp-2 text-sm text-white/60">{announcement.content}</p>
                </div>

                <div className="flex flex-col items-stretch gap-2 text-sm">
                  <label className="text-xs text-white/60" htmlFor={`schedule-${announcement.id}`}>
                    발행 시각 재설정
                  </label>
                  <input
                    id={`schedule-${announcement.id}`}
                    type="datetime-local"
                    value={draftValue}
                    onChange={(event) => handleScheduleDraftChange(announcement.id, event.target.value)}
                    className="w-56 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white focus:border-blue-400 focus:outline-none"
                  />
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => handleSaveSchedule(announcement)}
                      disabled={updateMutation.isPending}
                      className="rounded-lg bg-blue-500 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:bg-blue-500/50"
                    >
                      예약 저장
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTogglePin(announcement)}
                      disabled={updateMutation.isPending}
                      className="rounded-lg border border-white/20 px-3 py-2 text-sm font-medium text-white transition hover:border-blue-400 hover:text-blue-200 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {announcement.isPinned ? '상단 고정 해제' : '상단에 고정'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(announcement)}
                      disabled={deleteMutation.isPending}
                      className="rounded-lg border border-rose-500/40 px-3 py-2 text-sm font-medium text-rose-200 transition hover:border-rose-400 hover:text-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
