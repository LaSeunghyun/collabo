export const ANNOUNCEMENT_CATEGORIES = [
  { value: 'platform', label: '플랫폼 업데이트' },
  { value: 'policy', label: '정책 및 이용 안내' },
  { value: 'event', label: '이벤트 소식' },
  { value: 'maintenance', label: '서비스 점검' }
] as const;

export type AnnouncementCategory = (typeof ANNOUNCEMENT_CATEGORIES)[number]['value'];

export const ANNOUNCEMENT_CATEGORY_LABELS: Record<AnnouncementCategory, string> =
  ANNOUNCEMENT_CATEGORIES.reduce(
    (labels, category) => ({
      ...labels,
      [category.value]: category.label
    }),
    {} as Record<AnnouncementCategory, string>
  );

export const DEFAULT_ANNOUNCEMENT_CATEGORY: AnnouncementCategory = 'platform';
