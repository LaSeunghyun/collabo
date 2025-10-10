/**
 * @deprecated 이 파일은 deprecated되었습니다. 대신 @/lib/constants/enums를 사용하세요.
 * 
 * 마이그레이션 가이드:
 * - AnnouncementCategory -> import { AnnouncementCategory } from '@/lib/constants/enums'
 * - ANNOUNCEMENT_CATEGORY_LABELS -> import { ANNOUNCEMENT_CATEGORY_LABELS } from '@/lib/constants/enums'
 * - DEFAULT_ANNOUNCEMENT_CATEGORY -> import { DEFAULT_ANNOUNCEMENT_CATEGORY } from '@/lib/constants/enums'
 */

export {
  AnnouncementCategory,
  type AnnouncementCategoryValue,
  ANNOUNCEMENT_CATEGORY_LABELS,
  DEFAULT_ANNOUNCEMENT_CATEGORY,
} from '@/lib/constants/enums';

// 타입 호환성을 위한 별칭
export type AnnouncementCategory = import('@/lib/constants/enums').AnnouncementCategoryValue;
