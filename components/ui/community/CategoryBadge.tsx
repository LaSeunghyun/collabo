'use client';

import { Badge } from '@/components/ui/badge';

interface CategoryBadgeProps {
  categorySlug: string;
  className?: string;
}

const categoryColors: Record<string, string> = {
  'free': 'bg-blue-100 text-blue-700 border-blue-200',
  'question': 'bg-green-100 text-green-700 border-green-200',
  'review': 'bg-purple-100 text-purple-700 border-purple-200',
  'suggestion': 'bg-yellow-100 text-yellow-700 border-yellow-200',
  'recruitment': 'bg-red-100 text-red-700 border-red-200',
  'trade': 'bg-orange-100 text-orange-700 border-orange-200',
  'info-share': 'bg-indigo-100 text-indigo-700 border-indigo-200',
  'general': 'bg-gray-100 text-gray-700 border-gray-200',
};

const categoryLabels: Record<string, string> = {
  'free': '자유',
  'question': '질문',
  'review': '후기',
  'suggestion': '제안',
  'recruitment': '모집',
  'trade': '거래',
  'info-share': '정보공유',
  'general': '일반',
};

export function CategoryBadge({ categorySlug, className = '' }: CategoryBadgeProps) {
  const colorClass = categoryColors[categorySlug] || categoryColors['general'];
  const label = categoryLabels[categorySlug] || categorySlug;

  return (
    <Badge
      variant="outline"
      className={`text-xs font-medium px-2 py-1 ${colorClass} ${className}`}
    >
      {label}
    </Badge>
  );
}
