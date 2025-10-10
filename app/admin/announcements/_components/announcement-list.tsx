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
    throw new Error('ê³µì? ëª©ë¡??ë¶ˆëŸ¬?¤ì? ëª»í–ˆ?µë‹ˆ??');
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
    const error = await response.json().catch(() => ({ message: 'ê³µì? ?…ë°?´íŠ¸???¤íŒ¨?ˆìŠµ?ˆë‹¤.' }));
    throw new Error(error.message ?? 'ê³µì? ?…ë°?´íŠ¸???¤íŒ¨?ˆìŠµ?ˆë‹¤.');
  }

  return response.json();
}

async function deleteAnnouncementRequest(id: string) {
  const response = await fetch(`/api/announcements/${id}`, {
    method: 'DELETE'
  });

  if (!response.ok) {
    throw new Error('ê³µì?ë¥??? œ?˜ì? ëª»í–ˆ?µë‹ˆ??');
  }
}

const formatDate = (value: string | null) =>
  value ? new Date(value).toLocaleString('ko-KR') : 'ë°œí–‰ ë¯¸ì •';

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
        setError('ê³µì? ?…ë°?´íŠ¸ ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤.');
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
        setError('ê³µì? ?? œ ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤.');
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
    if (!window.confirm('??ê³µì?ë¥??? œ?˜ì‹œê² ìŠµ?ˆê¹Œ? ???‘ì—…?€ ?˜ëŒë¦????†ìŠµ?ˆë‹¤.')) {
      return;
    }

    deleteMutation.mutate(announcement.id);
  };

  if (isLoading) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-10 text-center text-sm text-white/60">
        ê³µì? ëª©ë¡??ë¶ˆëŸ¬?¤ëŠ” ì¤‘ì…?ˆë‹¤...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-3xl border border-rose-500/20 bg-rose-500/5 p-10 text-center text-sm text-rose-200">
        ê³µì? ëª©ë¡??ë¶ˆëŸ¬?¤ì? ëª»í–ˆ?µë‹ˆ?? ? ì‹œ ???¤ì‹œ ?œë„?´ì£¼?¸ìš”.
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white">ë°œí–‰??ê³µì? ê´€ë¦?/h2>
          <p className="text-sm text-white/60">?ë‹¨ ê³ ì • ?¬ë??€ ë°œí–‰ ?œì ??ì¡°ì •?˜ê³  ?„ìš”??ê³µì?ë¥??? œ?????ˆìŠµ?ˆë‹¤.</p>
        </div>
        <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-white/70">ì´?{sortedAnnouncements.length}ê°?/span>
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
                        ?“Œ ?ë‹¨ ê³ ì •
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
                    ë°œí–‰ ?ˆì • ?œê°
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
                      ë³€ê²??€??
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTogglePin(announcement)}
                      disabled={updateMutation.isPending}
                      className="rounded-lg border border-white/20 px-3 py-2 text-sm font-medium text-white transition hover:border-blue-400 hover:text-blue-200 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {announcement.isPinned ? '?ë‹¨ ê³ ì • ?´ì œ' : '?ë‹¨??ê³ ì •'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(announcement)}
                      disabled={deleteMutation.isPending}
                      className="rounded-lg border border-rose-500/40 px-3 py-2 text-sm font-medium text-rose-200 transition hover:border-rose-400 hover:text-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      ?? œ
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
