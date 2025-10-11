'use client';

import { Badge } from '@/components/ui/badge';

interface CategoryBadgeProps {
  categorySlug: string;
  className?: string;
}

const categoryColors: Record<string, string> = {
  'free': 'bg-blue-900/30 text-blue-400 border-blue-700',
  'question': 'bg-green-900/30 text-green-400 border-green-700',
  'review': 'bg-purple-900/30 text-purple-400 border-purple-700',
  'suggestion': 'bg-yellow-900/30 text-yellow-400 border-yellow-700',
  'recruitment': 'bg-red-900/30 text-red-400 border-red-700',
  'trade': 'bg-orange-900/30 text-orange-400 border-orange-700',
  'info-share': 'bg-indigo-900/30 text-indigo-400 border-indigo-700',
  'general': 'bg-gray-900/30 text-gray-400 border-gray-700',
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
