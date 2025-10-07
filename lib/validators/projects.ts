import { ProjectStatus, PROJECT_STATUS_VALUES, PROJECT_STATUS_LABELS } from '@/types/auth';
import { z } from 'zod';

export { ProjectStatus, PROJECT_STATUS_VALUES, PROJECT_STATUS_LABELS };

const currencySchema = z
  .string()
  .trim()
  .min(3, '?µí™” ì½”ë“œ??3?ë¦¬?¬ì•¼ ?©ë‹ˆ??')
  .max(3, '?µí™” ì½”ë“œ??3?ë¦¬?¬ì•¼ ?©ë‹ˆ??')
  .transform((value: string) => value.toUpperCase());

const nullableDateSchema = z
  .union([z.coerce.date(), z.null()])
  .optional();

const jsonLikeSchema = z.unknown().optional();

const baseProjectSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, '?„ë¡œ?íŠ¸ ?œëª©?€ 1???´ìƒ?´ì–´???©ë‹ˆ??')
      .max(120, '?„ë¡œ?íŠ¸ ?œëª©?€ 120?ë? ?˜ì„ ???†ìŠµ?ˆë‹¤.'),
    description: z
      .string()
      .trim()
      .min(1, '?„ë¡œ?íŠ¸ ?¤ëª…?€ 1???´ìƒ?´ì–´???©ë‹ˆ??'),
    category: z
      .string()
      .trim()
      .min(1, 'ì¹´í…Œê³ ë¦¬??1???´ìƒ?´ì–´???©ë‹ˆ??')
      .max(60, 'ì¹´í…Œê³ ë¦¬??60?ë? ?˜ì„ ???†ìŠµ?ˆë‹¤.'),
    targetAmount: z
      .coerce
      .number()
      .int('ëª©í‘œ ê¸ˆì•¡?€ ?•ìˆ˜?¬ì•¼ ?©ë‹ˆ??')
      .positive('ëª©í‘œ ê¸ˆì•¡?€ 0ë³´ë‹¤ ì»¤ì•¼ ?©ë‹ˆ??'),
    currency: currencySchema.optional().default('KRW'),
    startDate: nullableDateSchema,
    endDate: nullableDateSchema,
    rewardTiers: jsonLikeSchema,
    milestones: jsonLikeSchema,
    thumbnail: z
      .string()
      .url('?¸ë„¤??URL??? íš¨?˜ì? ?ŠìŠµ?ˆë‹¤.')
      .or(z.literal(''))
      .or(z.null())
      .optional(),
    status: z.nativeEnum(ProjectStatus).optional(),
    ownerId: z.string().cuid().optional()
  })
  .refine(
    (data: z.infer<typeof baseProjectSchema>) => {
      if (!data.startDate || !data.endDate) {
        return true;
      }

      if (data.endDate < data.startDate) {
        return false;
      }

      return true;
    },
    {
      message: 'ì¢…ë£Œ?¼ì? ?œì‘???´í›„?¬ì•¼ ?©ë‹ˆ??',
      path: ['endDate']
    }
  );

export const createProjectSchema = baseProjectSchema.omit({ status: true });

export const updateProjectSchema = z.object({
  title: baseProjectSchema.shape.title.optional(),
  description: baseProjectSchema.shape.description.optional(),
  category: baseProjectSchema.shape.category.optional(),
  targetAmount: baseProjectSchema.shape.targetAmount.optional(),
  currency: currencySchema.optional(),
  startDate: nullableDateSchema,
  endDate: nullableDateSchema,
  rewardTiers: jsonLikeSchema,
  milestones: jsonLikeSchema,
  thumbnail: baseProjectSchema.shape.thumbnail,
  status: z.nativeEnum(ProjectStatus).optional(),
  ownerId: z.string().cuid().optional()
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
