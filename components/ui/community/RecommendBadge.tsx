'use client';

interface RecommendBadgeProps {
  count: number;
  className?: string;
}

export function RecommendBadge({ count, className = '' }: RecommendBadgeProps) {
  return (
    <div
      className={`
        flex items-center justify-center
        w-8 h-8 rounded-full
        bg-red-500 text-white
        text-xs font-bold
        shadow-md
        ${className}
      `}
    >
      {count}
    </div>
  );
}
