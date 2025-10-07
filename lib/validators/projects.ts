import { ProjectStatus, PROJECT_STATUS_VALUES, PROJECT_STATUS_LABELS } from '@/types/auth';
import { z } from 'zod';

export { ProjectStatus, PROJECT_STATUS_VALUES, PROJECT_STATUS_LABELS };

const currencySchema = z
  .string()
  .trim()
  .min(3, '?�화 코드??3?�리?�야 ?�니??')
  .max(3, '?�화 코드??3?�리?�야 ?�니??')
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
      .min(1, '?�로?�트 ?�목?� 1???�상?�어???�니??')
      .max(120, '?�로?�트 ?�목?� 120?��? ?�을 ???�습?�다.'),
    description: z
      .string()
      .trim()
      .min(1, '?�로?�트 ?�명?� 1???�상?�어???�니??'),
    category: z
      .string()
      .trim()
      .min(1, '카테고리??1???�상?�어???�니??')
      .max(60, '카테고리??60?��? ?�을 ???�습?�다.'),
    targetAmount: z
      .coerce
      .number()
      .int('목표 금액?� ?�수?�야 ?�니??')
      .positive('목표 금액?� 0보다 커야 ?�니??'),
    currency: currencySchema.optional().default('KRW'),
    startDate: nullableDateSchema,
    endDate: nullableDateSchema,
    rewardTiers: jsonLikeSchema,
    milestones: jsonLikeSchema,
    thumbnail: z
      .string()
      .url('?�네??URL???�효?��? ?�습?�다.')
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
      message: '종료?��? ?�작???�후?�야 ?�니??',
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
