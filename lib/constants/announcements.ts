export const ANNOUNCEMENT_CATEGORIES = [
  { value: 'platform', label: '?åÎû´???ÖÎç∞?¥Ìä∏' },
  { value: 'policy', label: '?ïÏ±Ö Î∞??¥Ïö© ?àÎÇ¥' },
  { value: 'event', label: '?¥Î≤§???åÏãù' },
  { value: 'maintenance', label: '?úÎπÑ???êÍ?' }
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
