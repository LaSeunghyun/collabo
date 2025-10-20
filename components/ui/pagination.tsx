'use client';

import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import clsx from 'clsx';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({ currentPage, totalPages, onPageChange, className }: PaginationProps) {

  if (totalPages <= 1) {
    return null;
  }

  const getVisiblePages = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  const visiblePages = getVisiblePages();

  return (
    <nav className={clsx('flex items-center justify-center space-x-1', className)} aria-label="페이지네이션">
      {/* 이전 페이지 버튼 */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className={clsx(
          'flex h-8 w-8 items-center justify-center rounded-full text-sm transition',
          currentPage <= 1
            ? 'cursor-not-allowed text-white/30'
            : 'text-white/70 hover:bg-white/10 hover:text-white'
        )}
        aria-label="이전 페이지"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {/* 페이지 번호들 */}
      {visiblePages.map((page, index) => {
        if (page === '...') {
          return (
            <span
              key={`ellipsis-${index}`}
              className="flex h-8 w-8 items-center justify-center text-white/50"
            >
              <MoreHorizontal className="h-4 w-4" />
            </span>
          );
        }

        const pageNumber = page as number;
        const isCurrentPage = pageNumber === currentPage;

        return (
          <button
            key={pageNumber}
            onClick={() => onPageChange(pageNumber)}
            className={clsx(
              'flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition',
              isCurrentPage
                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                : 'text-white/70 hover:bg-white/10 hover:text-white'
            )}
            aria-label={`${pageNumber}페이지로 이동`}
            aria-current={isCurrentPage ? 'page' : undefined}
          >
            {pageNumber}
          </button>
        );
      })}

      {/* 다음 페이지 버튼 */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className={clsx(
          'flex h-8 w-8 items-center justify-center rounded-full text-sm transition',
          currentPage >= totalPages
            ? 'cursor-not-allowed text-white/30'
            : 'text-white/70 hover:bg-white/10 hover:text-white'
        )}
        aria-label="다음 페이지"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
}

interface PaginationInfoProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  className?: string;
}

export function PaginationInfo({ 
  currentPage,
  totalItems, 
  itemsPerPage, 
  className 
}: PaginationInfoProps) {
  
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className={clsx('text-xs text-white/60', className)}>
      {totalItems > 0 ? (
        <span>
          {startItem}-{endItem} / 총 {totalItems.toLocaleString()}개
        </span>
      ) : (
        <span>게시글이 없습니다</span>
      )}
    </div>
  );
}
