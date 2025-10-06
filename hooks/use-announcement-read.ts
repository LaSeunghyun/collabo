'use client';

import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';

interface MarkReadResponse {
  status: 'ok';
  announcement?: unknown;
}

async function markAnnouncementReadRequest(announcementId: string) {
  const response = await fetch(`/api/announcements/${announcementId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ markAsRead: true })
  });

  if (!response.ok) {
    throw new Error('ê³µì? ?½ìŒ ì²˜ë¦¬???¤íŒ¨?ˆìŠµ?ˆë‹¤.');
  }

  return (await response.json()) as MarkReadResponse;
}

async function fetchUnreadCount() {
  const response = await fetch('/api/announcements?meta=unread-count');

  if (!response.ok) {
    throw new Error('ê³µì? ?½ì? ?ŠìŒ ?˜ë? ë¶ˆëŸ¬?¤ì? ëª»í–ˆ?µë‹ˆ??');
  }

  const data = (await response.json()) as { unreadCount: number };
  return data.unreadCount;
}

export function useMarkAnnouncementRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['announcements', 'mark-read'],
    mutationFn: markAnnouncementReadRequest,
    onSuccess: (_data, announcementId) => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      queryClient.invalidateQueries({ queryKey: ['announcements', 'detail', announcementId] });
      queryClient.invalidateQueries({ queryKey: ['announcements', 'unread-count'] });
    }
  });
}

export function useAnnouncementUnreadCount(enabled: boolean) {
  return useQuery({
    queryKey: ['announcements', 'unread-count'],
    queryFn: fetchUnreadCount,
    staleTime: 1000 * 60,
    enabled
  });
}
