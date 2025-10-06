'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  className?: string;
}

const statusConfig = {
  // 프로젝트 상태
  DRAFT: { label: '초안/검토 대기중', variant: 'warning' as const },
  PRELAUNCH: { label: '프리런치', variant: 'info' as const },
  LIVE: { label: '진행중', variant: 'success' as const },
  SUCCEEDED: { label: '성공', variant: 'success' as const },
  FAILED: { label: '실패', variant: 'error' as const },
  SETTLING: { label: '정산중', variant: 'info' as const },
  EXECUTING: { label: '실행중', variant: 'success' as const },
  COMPLETED: { label: '완료', variant: 'success' as const },
  CANCELLED: { label: '취소됨', variant: 'error' as const },
  
  // 주문 상태
  ORDER_PENDING: { label: '대기중', variant: 'warning' as const },
  PAID_PENDING_CAPTURE: { label: '결제 대기중', variant: 'warning' as const },
  ORDER_PAID: { label: '결제완료', variant: 'success' as const },
  SHIPPED: { label: '배송중', variant: 'info' as const },
  DELIVERED: { label: '배송완료', variant: 'success' as const },
  REFUNDED: { label: '환불됨', variant: 'error' as const },
  ORDER_CANCELLED: { label: '취소됨', variant: 'error' as const },
  
  // 정산 상태
  SETTLEMENT_PENDING: { label: '대기중', variant: 'warning' as const },
  IN_PROGRESS: { label: '진행중', variant: 'info' as const },
  SETTLEMENT_PAID: { label: '지급완료', variant: 'success' as const },
  
  // 신고 상태
  PENDING: { label: '대기중', variant: 'warning' as const },
  REVIEWING: { label: '검토중', variant: 'info' as const },
  ACTION_TAKEN: { label: '조치완료', variant: 'success' as const },
  DISMISSED: { label: '기각됨', variant: 'error' as const },
  
  // 알림 상태
  UNREAD: { label: '읽지 않음', variant: 'warning' as const },
  READ: { label: '읽음', variant: 'default' as const },
  
  // 기본 상태
  ACTIVE: { label: '활성', variant: 'success' as const },
  INACTIVE: { label: '비활성', variant: 'default' as const },
  HIDDEN: { label: '숨김', variant: 'error' as const },
  DELETED: { label: '삭제됨', variant: 'error' as const },
};

const variantStyles = {
  default: 'bg-gray-100 text-gray-800',
  success: 'bg-green-100 text-green-800',
  warning: 'bg-yellow-100 text-yellow-800',
  error: 'bg-red-100 text-red-800',
  info: 'bg-blue-100 text-blue-800',
};

export function StatusBadge({ status, variant, className }: StatusBadgeProps) {
  const config = statusConfig[status as keyof typeof statusConfig] || {
    label: status,
    variant: variant || 'default'
  };
  
  const styleClass = variantStyles[config.variant];
  
  return (
    <Badge 
      className={cn(styleClass, className)}
    >
      {config.label}
    </Badge>
  );
}
