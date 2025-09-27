'use client';

import { useEffect, useRef } from 'react';

import { useMarkAnnouncementRead } from '@/hooks/use-announcement-read';

interface AnnouncementReadTrackerProps {
  announcementId: string;
  canAcknowledge: boolean;
  isAlreadyRead: boolean;
}

export function AnnouncementReadTracker({
  announcementId,
  canAcknowledge,
  isAlreadyRead
}: AnnouncementReadTrackerProps) {
  const hasAcknowledgedRef = useRef(false);
  const { mutate } = useMarkAnnouncementRead();

  useEffect(() => {
    if (!canAcknowledge || isAlreadyRead || hasAcknowledgedRef.current) {
      return;
    }

    hasAcknowledgedRef.current = true;
    mutate(announcementId);
  }, [announcementId, canAcknowledge, isAlreadyRead, mutate]);

  return null;
}
