'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  className?: string;
}

const statusConfig = {
  // ?„ë¡œ?íŠ¸ ?íƒœ
  DRAFT: { label: 'ì´ˆì•ˆ/ê²€???€ê¸°ì¤‘', variant: 'warning' as const },
  PRELAUNCH: { label: '?„ë¦¬?°ì¹˜', variant: 'info' as const },
  LIVE: { label: 'ì§„í–‰ì¤?, variant: 'success' as const },
  SUCCEEDED: { label: '?±ê³µ', variant: 'success' as const },
  FAILED: { label: '?¤íŒ¨', variant: 'error' as const },
  SETTLING: { label: '?•ì‚°ì¤?, variant: 'info' as const },
  EXECUTING: { label: '?¤í–‰ì¤?, variant: 'success' as const },
  COMPLETED: { label: '?„ë£Œ', variant: 'success' as const },
  CANCELLED: { label: 'ì·¨ì†Œ??, variant: 'error' as const },
  
  // ì£¼ë¬¸ ?íƒœ
  ORDER_PENDING: { label: '?€ê¸°ì¤‘', variant: 'warning' as const },
  PAID_PENDING_CAPTURE: { label: 'ê²°ì œ ?€ê¸°ì¤‘', variant: 'warning' as const },
  ORDER_PAID: { label: 'ê²°ì œ?„ë£Œ', variant: 'success' as const },
  SHIPPED: { label: 'ë°°ì†¡ì¤?, variant: 'info' as const },
  DELIVERED: { label: 'ë°°ì†¡?„ë£Œ', variant: 'success' as const },
  REFUNDED: { label: '?˜ë¶ˆ??, variant: 'error' as const },
  ORDER_CANCELLED: { label: 'ì·¨ì†Œ??, variant: 'error' as const },
  
  // ?•ì‚° ?íƒœ
  SETTLEMENT_PENDING: { label: '?€ê¸°ì¤‘', variant: 'warning' as const },
  IN_PROGRESS: { label: 'ì§„í–‰ì¤?, variant: 'info' as const },
  SETTLEMENT_PAID: { label: 'ì§€ê¸‰ì™„ë£?, variant: 'success' as const },
  
  // ? ê³  ?íƒœ
  PENDING: { label: '?€ê¸°ì¤‘', variant: 'warning' as const },
  REVIEWING: { label: 'ê²€? ì¤‘', variant: 'info' as const },
  ACTION_TAKEN: { label: 'ì¡°ì¹˜?„ë£Œ', variant: 'success' as const },
  DISMISSED: { label: 'ê¸°ê°??, variant: 'error' as const },
  
  // ?Œë¦¼ ?íƒœ
  UNREAD: { label: '?½ì? ?ŠìŒ', variant: 'warning' as const },
  READ: { label: '?½ìŒ', variant: 'default' as const },
  
  // ê¸°ë³¸ ?íƒœ
  ACTIVE: { label: '?œì„±', variant: 'success' as const },
  INACTIVE: { label: 'ë¹„í™œ??, variant: 'default' as const },
  HIDDEN: { label: '?¨ê?', variant: 'error' as const },
  DELETED: { label: '?? œ??, variant: 'error' as const },
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
