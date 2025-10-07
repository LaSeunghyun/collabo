export const ANNOUNCEMENT_CATEGORIES = [
  { value: 'platform', label: '?�랫???�데?�트' },
  { value: 'policy', label: '?�책 �??�용 ?�내' },
  { value: 'event', label: '?�벤???�식' },
  { value: 'maintenance', label: '?�비???��?' }
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
